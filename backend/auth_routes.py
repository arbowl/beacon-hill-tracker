"""
Authentication and User Management API Endpoints
Handles user registration, login, verification, and role management
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    jwt_required, get_jwt_identity, create_access_token,
    verify_jwt_in_request
)
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
from datetime import datetime, timedelta, timezone

from auth_models import db, User, EmailToken
from email_service import send_verification_email

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def require_role(required_role):
    """Decorator to require specific role or higher"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            # Convert string ID back to integer
            try:
                user_id = int(current_user_id)
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid user ID'}), 401
            
            user = User.query.get(user_id)
            
            if not user or not user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
                
            if not user.has_role(required_role):
                return jsonify({'error': 'Insufficient permissions'}), 403
                
            return f(*args, **kwargs)
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator


@auth_bp.route('/register', methods=['POST', 'OPTIONS'])
def register():
    """Register a new user account with email verification"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Validate email format
        try:
            valid_email = validate_email(email)
            email = valid_email.email
        except EmailNotValidError as e:
            return jsonify({'error': f'Invalid email: {str(e)}'}), 400
        
        # Validate password strength
        if len(password) < 8:
            return jsonify({
                'error': 'Password must be at least 8 characters long'
            }), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user (inactive by default)
        pw_hash = generate_password_hash(password)
        user = User(
            email=email,
            pw_hash=pw_hash,
            role=User.ROLE_USER,
            is_active=False
        )
        
        db.session.add(user)
        db.session.flush()  # Get user ID without committing
        
        # Generate verification token
        token = EmailToken.generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        email_token = EmailToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
            purpose=EmailToken.PURPOSE_VERIFICATION
        )
        
        db.session.add(email_token)
        db.session.commit()
        
        # Send verification email
        try:
            # Send user directly to frontend verification page
            # This avoids issues with email security proxies not handling redirects
            frontend_url = current_app.config.get(
                'FRONTEND_URL', 'http://localhost:5173'
            )
            verification_url = (
                f"{frontend_url.rstrip('/')}/verify-email?token={token}"
            )
            send_verification_email(email, verification_url)
        except Exception as e:
            current_app.logger.error(
                f'Failed to send verification email: {e}'
            )
            # Don't fail registration if email fails
            pass
        
        return jsonify({
            'message': ('Registration successful. Please check your email '
                       'to verify your account.'),
            'user_id': user.id,
            'email': user.email
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Registration error: {e}')
        return jsonify({'error': 'Registration failed'}), 500


@auth_bp.route('/verify/<token>', methods=['GET', 'POST'])
def verify_email(token):
    """Verify user email address using token
    
    Supports both direct access (redirects to frontend) and API calls (returns JSON).
    This dual approach helps handle email security proxies that may not properly
    forward redirects.
    """
    from flask import redirect
    
    try:
        # Find the token
        email_token = EmailToken.query.filter_by(
            token=token,
            purpose=EmailToken.PURPOSE_VERIFICATION
        ).first()
        
        # Get frontend URL for redirects
        frontend_url = current_app.config.get(
            'FRONTEND_URL', 'http://localhost:5173'
        )
        
        if not email_token:
            # Check if this is an API call (has Accept: application/json header)
            if request.headers.get('Accept') == 'application/json':
                return jsonify({
                    'success': False,
                    'error': 'invalid_token',
                    'message': 'Invalid or already used verification token'
                }), 400
            # Redirect for direct browser access
            return redirect(
                f"{frontend_url}/login?verified=false&error=invalid_token"
            )
        
        # Check if token is expired
        if email_token.is_expired():
            db.session.delete(email_token)
            db.session.commit()
            if request.headers.get('Accept') == 'application/json':
                return jsonify({
                    'success': False,
                    'error': 'expired',
                    'message': 'Verification token has expired'
                }), 400
            return redirect(
                f"{frontend_url}/login?verified=false&error=expired"
            )
        
        # Activate the user
        user = email_token.user
        user.is_active = True
        
        # Remove the verification token
        db.session.delete(email_token)
        db.session.commit()
        
        # Return success
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': True,
                'message': 'Email verified successfully',
                'user_id': user.id,
                'email': user.email
            }), 200
        return redirect(f"{frontend_url}/login?verified=true")
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Email verification error: {e}')
        frontend_url = current_app.config.get(
            'FRONTEND_URL', 'http://localhost:5173'
        )
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'success': False,
                'error': 'server_error',
                'message': 'Verification failed'
            }), 500
        return redirect(
            f"{frontend_url}/login?verified=false&error=server_error"
        )


@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    """Authenticate user and return JWT token"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            current_app.logger.error('Login failed: No JSON data provided')
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        current_app.logger.info(f'Login attempt for email: {email}')
        
        if not email or not password:
            current_app.logger.warning('Login failed: Missing email or password')
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            current_app.logger.warning(f'Login failed: User not found for email: {email}')
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not check_password_hash(user.pw_hash, password):
            current_app.logger.warning(f'Login failed: Invalid password for email: {email}')
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            current_app.logger.warning(f'Login failed: Account not verified for email: {email}')
            return jsonify({
                'error': 'Account not verified. Please check your email or contact support.'
            }), 401
        
        # Create JWT token
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(
                hours=current_app.config.get('TOKEN_EXPIRATION_HOURS', 24)
            )
        )
        
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Login error: {e}')
        return jsonify({'error': 'Login failed'}), 500


@auth_bp.route('/me')
@jwt_required()
def get_current_user():
    """Get current user profile and role"""
    try:
        current_user_id = get_jwt_identity()
        # Convert string ID back to integer
        try:
            user_id = int(current_user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
        
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get current user error: {e}')
        return jsonify({'error': 'Failed to get user info'}), 500


@auth_bp.route('/role', methods=['PATCH'])
@require_role(User.ROLE_ADMIN)
def update_user_role():
    """Admin-only endpoint to elevate/demote user roles"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        user_id = data.get('user_id')
        new_role = data.get('role')
        
        if not user_id or not new_role:
            return jsonify({'error': 'user_id and role are required'}), 400
        
        if new_role not in User.VALID_ROLES:
            return jsonify({
                'error': f'Invalid role. Must be one of: {User.VALID_ROLES}'
            }), 400
        
        # Find target user
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404
        
        # Don't allow changing own role
        current_user_id = get_jwt_identity()
        # Convert string ID back to integer
        try:
            admin_user_id = int(current_user_id)
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid user ID'}), 401
        
        if target_user.id == admin_user_id:
            return jsonify({'error': 'Cannot change your own role'}), 400
        
        # Update role
        old_role = target_user.role
        target_user.role = new_role
        db.session.commit()
        
        return jsonify({
            'message': f'User role updated from {old_role} to {new_role}',
            'user': target_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Role update error: {e}')
        return jsonify({'error': 'Failed to update role'}), 500


@auth_bp.route('/users')
@require_role(User.ROLE_ADMIN)
def list_users():
    """Admin-only endpoint to list all users"""
    try:
        users = User.query.order_by(User.created_at.desc()).all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'List users error: {e}')
        return jsonify({'error': 'Failed to list users'}), 500


@auth_bp.route('/forgot-password', methods=['POST', 'OPTIONS'])
def forgot_password():
    """Request a password reset email"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        # Always return success to prevent email enumeration
        if not user:
            current_app.logger.warning(
                f'Password reset requested for non-existent email: {email}'
            )
            return jsonify({
                'message': ('If an account exists with this email, '
                           'you will receive password reset instructions.')
            }), 200
        
        # Delete any existing password reset tokens for this user
        EmailToken.query.filter_by(
            user_id=user.id,
            purpose=EmailToken.PURPOSE_PASSWORD_RESET
        ).delete()
        
        # Generate password reset token
        token = EmailToken.generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        
        email_token = EmailToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
            purpose=EmailToken.PURPOSE_PASSWORD_RESET
        )
        
        db.session.add(email_token)
        db.session.commit()
        
        # Send password reset email
        try:
            from email_service import send_password_reset_email
            frontend_url = current_app.config.get(
                'FRONTEND_URL', 'http://localhost:5173'
            )
            # Send user to frontend reset page with token
            reset_url = (
                f"{frontend_url.rstrip('/')}/reset-password?token={token}"
            )
            send_password_reset_email(email, reset_url)
        except Exception as e:
            current_app.logger.error(
                f'Failed to send password reset email: {e}'
            )
            # Continue anyway - don't reveal if email sending failed
        
        return jsonify({
            'message': ('If an account exists with this email, '
                       'you will receive password reset instructions.')
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Forgot password error: {e}')
        return jsonify({'error': 'Failed to process request'}), 500


@auth_bp.route('/reset-password', methods=['POST', 'OPTIONS'])
def reset_password():
    """Reset password using token"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        token = data.get('token', '')
        new_password = data.get('password', '')
        
        if not token or not new_password:
            return jsonify({
                'error': 'Token and new password are required'
            }), 400
        
        # Validate password strength
        if len(new_password) < 8:
            return jsonify({
                'error': 'Password must be at least 8 characters long'
            }), 400
        
        # Find the token
        email_token = EmailToken.query.filter_by(
            token=token,
            purpose=EmailToken.PURPOSE_PASSWORD_RESET
        ).first()
        
        if not email_token:
            return jsonify({
                'error': 'Invalid or expired reset token'
            }), 400
        
        # Check if token is expired
        if email_token.is_expired():
            db.session.delete(email_token)
            db.session.commit()
            return jsonify({
                'error': 'Reset token has expired. Please request a new one.'
            }), 400
        
        # Reset the password
        user = email_token.user
        user.pw_hash = generate_password_hash(new_password)
        
        # Remove the reset token
        db.session.delete(email_token)
        db.session.commit()
        
        return jsonify({
            'message': 'Password reset successfully. You can now log in.',
            'user_id': user.id,
            'email': user.email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Reset password error: {e}')
        return jsonify({'error': 'Failed to reset password'}), 500


# Error handlers
@auth_bp.errorhandler(422)
def handle_unprocessable_entity(e):
    return jsonify({'error': 'Invalid request data'}), 422


@auth_bp.errorhandler(429)
def handle_rate_limit_exceeded(e):
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
