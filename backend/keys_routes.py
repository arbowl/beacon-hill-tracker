"""
Signing Key Management API Endpoints
Handles generation, listing, and revocation of signing keys for data submitters
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from auth_models import db, User, SigningKey
from email_service import send_key_generated_email

keys_bp = Blueprint('keys', __name__, url_prefix='/api/keys')


def get_current_user():
    """Helper function to get current authenticated user"""
    current_user_id = get_jwt_identity()
    # Convert string ID back to integer
    try:
        user_id = int(current_user_id)
    except (ValueError, TypeError):
        return None
    
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        return None
    
    return user


def require_key_permissions():
    """Helper function to check if user can manage signing keys"""
    user = get_current_user()
    if not user:
        return None, jsonify({'error': 'User not found or inactive'}), 401
    
    if not user.can_generate_keys():
        return None, jsonify({
            'error': 'Insufficient permissions. Privileged role required.'
        }), 403
    
    return user, None, None


@keys_bp.route('', methods=['POST'])
@jwt_required()
def generate_signing_key():
    """Generate a new signing key pair for the current user (privileged+ only)"""
    try:
        user, error_response, status_code = require_key_permissions()
        if error_response:
            return error_response, status_code
        
        data = request.get_json() or {}
        
        # Optional description/note for the key
        description = data.get('description', '').strip()
        
        # Generate key pair
        key_id, secret = SigningKey.generate_key_pair()
        
        # Create signing key record
        signing_key = SigningKey(
            user_id=user.id,
            key_id=key_id,
            secret=secret
        )
        
        db.session.add(signing_key)
        db.session.commit()
        
        # Send notification email (non-blocking)
        try:
            send_key_generated_email(user.email, key_id)
        except Exception as e:
            current_app.logger.error(f'Failed to send key generation email: {e}')
            # Don't fail the operation if email fails
            pass
        
        # Return the key with secret (only time it's shown)
        response_data = signing_key.to_dict(include_secret=True)
        if description:
            response_data['description'] = description
        
        return jsonify({
            'message': 'Signing key generated successfully',
            'key': response_data,
            'warning': 'This is the only time the secret will be displayed. Store it securely.'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Generate signing key error: {e}')
        return jsonify({'error': 'Failed to generate signing key'}), 500


@keys_bp.route('', methods=['GET'])
@jwt_required()
def list_signing_keys():
    """List all signing keys for the current user (privileged+ only)"""
    try:
        user, error_response, status_code = require_key_permissions()
        if error_response:
            return error_response, status_code
        
        # Get query parameters
        include_revoked = request.args.get('include_revoked', 'false').lower() == 'true'
        
        # Build query
        query = SigningKey.query.filter_by(user_id=user.id)
        
        if not include_revoked:
            query = query.filter(SigningKey.revoked_at.is_(None))
        
        signing_keys = query.order_by(SigningKey.created_at.desc()).all()
        
        return jsonify({
            'keys': [key.to_dict(include_secret=False) for key in signing_keys],
            'count': len(signing_keys),
            'include_revoked': include_revoked
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'List signing keys error: {e}')
        return jsonify({'error': 'Failed to retrieve signing keys'}), 500


@keys_bp.route('/<int:key_id>', methods=['GET'])
@jwt_required()
def get_signing_key(key_id):
    """Get details of a specific signing key (privileged+ only, user-scoped)"""
    try:
        user, error_response, status_code = require_key_permissions()
        if error_response:
            return error_response, status_code
        
        # Find the key (must belong to current user)
        signing_key = SigningKey.query.filter_by(
            id=key_id,
            user_id=user.id
        ).first()
        
        if not signing_key:
            return jsonify({'error': 'Signing key not found'}), 404
        
        return jsonify({
            'key': signing_key.to_dict(include_secret=False)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Get signing key error: {e}')
        return jsonify({'error': 'Failed to retrieve signing key'}), 500


@keys_bp.route('/revoke/<int:key_id>', methods=['PATCH'])
@keys_bp.route('/<int:key_id>/revoke', methods=['PATCH'])
@jwt_required()
def revoke_signing_key(key_id):
    """Revoke a signing key (privileged+ only, user-scoped)"""
    try:
        user, error_response, status_code = require_key_permissions()
        if error_response:
            return error_response, status_code
        
        # Find the key (must belong to current user)
        signing_key = SigningKey.query.filter_by(
            id=key_id,
            user_id=user.id
        ).first()
        
        if not signing_key:
            return jsonify({'error': 'Signing key not found'}), 404
        
        if signing_key.is_revoked():
            return jsonify({'error': 'Signing key is already revoked'}), 400
        
        # Revoke the key
        signing_key.revoke()
        db.session.commit()
        
        return jsonify({
            'message': f'Signing key {signing_key.key_id} revoked successfully',
            'key': signing_key.to_dict(include_secret=False)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Revoke signing key error: {e}')
        return jsonify({'error': 'Failed to revoke signing key'}), 500


@keys_bp.route('/verify', methods=['POST'])
def verify_signing_key():
    """Verify a signing key (public endpoint for external validation)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        key_id = data.get('key_id', '').strip()
        secret = data.get('secret', '').strip()
        
        if not key_id or not secret:
            return jsonify({'error': 'key_id and secret are required'}), 400
        
        # Find the key by key_id
        signing_key = SigningKey.query.filter_by(key_id=key_id).first()
        
        if not signing_key:
            return jsonify({
                'valid': False,
                'reason': 'Key not found'
            }), 200
        
        if signing_key.is_revoked():
            return jsonify({
                'valid': False,
                'reason': 'Key has been revoked',
                'revoked_at': signing_key.revoked_at.isoformat()
            }), 200
        
        if signing_key.secret != secret:
            return jsonify({
                'valid': False,
                'reason': 'Invalid secret'
            }), 200
        
        # Key is valid
        return jsonify({
            'valid': True,
            'key_id': signing_key.key_id,
            'user_email': signing_key.user.email,
            'created_at': signing_key.created_at.isoformat(),
            'user_role': signing_key.user.role
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Verify signing key error: {e}')
        return jsonify({'error': 'Failed to verify signing key'}), 500


# Admin-only endpoints
@keys_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_list_all_keys():
    """Admin-only: List all signing keys across all users"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        if not user.can_manage_users():
            return jsonify({'error': 'Admin permissions required'}), 403
        
        # Get query parameters
        include_revoked = request.args.get('include_revoked', 'false').lower() == 'true'
        user_id = request.args.get('user_id')
        
        # Build query
        query = SigningKey.query.join(User)
        
        if user_id:
            try:
                user_id = int(user_id)
                query = query.filter(SigningKey.user_id == user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user_id parameter'}), 400
        
        if not include_revoked:
            query = query.filter(SigningKey.revoked_at.is_(None))
        
        signing_keys = query.order_by(SigningKey.created_at.desc()).all()
        
        # Include user email in response for admin
        keys_data = []
        for key in signing_keys:
            key_data = key.to_dict(include_secret=False)
            key_data['user_email'] = key.user.email
            key_data['user_role'] = key.user.role
            keys_data.append(key_data)
        
        return jsonify({
            'keys': keys_data,
            'count': len(keys_data),
            'include_revoked': include_revoked,
            'filtered_by_user': user_id is not None
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Admin list all keys error: {e}')
        return jsonify({'error': 'Failed to retrieve signing keys'}), 500


@keys_bp.route('/admin/revoke/<int:key_id>', methods=['PATCH'])
@jwt_required()
def admin_revoke_signing_key(key_id):
    """Admin-only: Revoke any user's signing key"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        if not user.can_manage_users():
            return jsonify({'error': 'Admin permissions required'}), 403
        
        # Find the key (any user)
        signing_key = SigningKey.query.get(key_id)
        
        if not signing_key:
            return jsonify({'error': 'Signing key not found'}), 404
        
        if signing_key.is_revoked():
            return jsonify({'error': 'Signing key is already revoked'}), 400
        
        # Revoke the key
        signing_key.revoke()
        db.session.commit()
        
        return jsonify({
            'message': f'Signing key {signing_key.key_id} revoked by admin',
            'key': signing_key.to_dict(include_secret=False),
            'user_email': signing_key.user.email
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Admin revoke signing key error: {e}')
        return jsonify({'error': 'Failed to revoke signing key'}), 500


# Error handlers
@keys_bp.errorhandler(422)
def handle_unprocessable_entity(e):
    return jsonify({'error': 'Invalid request data'}), 422


@keys_bp.errorhandler(429)
def handle_rate_limit_exceeded(e):
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
