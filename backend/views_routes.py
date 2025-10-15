"""
Saved Views API Endpoints
Handles CRUD operations for user-saved dashboard views
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
import json

from auth_models import db, User, SavedView

views_bp = Blueprint('views', __name__, url_prefix='/api/views')


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


@views_bp.route('', methods=['GET'])
@jwt_required()
def list_saved_views():
    """Get all saved views for the current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Get all saved views for this user, ordered by most recent first
        saved_views = SavedView.query.filter_by(user_id=user.id)\
                                     .order_by(SavedView.updated_at.desc())\
                                     .all()
        
        return jsonify({
            'views': [view.to_dict() for view in saved_views],
            'count': len(saved_views)
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'List saved views error: {e}')
        return jsonify({'error': 'Failed to retrieve saved views'}), 500


@views_bp.route('', methods=['POST'])
@jwt_required()
def create_saved_view():
    """Create a new saved view for the current user"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Validate required fields
        name = data.get('name', '').strip()
        payload = data.get('payload')
        
        if not name:
            return jsonify({'error': 'View name is required'}), 400
        
        if not payload:
            return jsonify({'error': 'View payload is required'}), 400
        
        # Validate name length
        if len(name) > 255:
            return jsonify({'error': 'View name too long (max 255 characters)'}), 400
        
        # Check for duplicate names for this user
        existing_view = SavedView.query.filter_by(
            user_id=user.id,
            name=name
        ).first()
        
        if existing_view:
            return jsonify({'error': 'A view with this name already exists'}), 409
        
        # Validate and serialize payload
        try:
            payload_json = json.dumps(payload)
        except (TypeError, ValueError) as e:
            return jsonify({'error': f'Invalid payload format: {str(e)}'}), 400
        
        # Create new saved view
        saved_view = SavedView(
            user_id=user.id,
            name=name,
            payload_json=payload_json
        )
        
        db.session.add(saved_view)
        db.session.commit()
        
        return jsonify({
            'message': 'Saved view created successfully',
            'view': saved_view.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Create saved view error: {e}')
        return jsonify({'error': 'Failed to create saved view'}), 500


@views_bp.route('/<int:view_id>', methods=['GET'])
@jwt_required()
def get_saved_view(view_id):
    """Get a specific saved view by ID (user-scoped)"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Find the view (must belong to current user)
        saved_view = SavedView.query.filter_by(
            id=view_id,
            user_id=user.id
        ).first()
        
        if not saved_view:
            return jsonify({'error': 'Saved view not found'}), 404
        
        # Parse the payload JSON for the response
        view_data = saved_view.to_dict()
        try:
            view_data['payload'] = json.loads(saved_view.payload_json)
        except json.JSONDecodeError:
            view_data['payload'] = {}
        
        return jsonify({'view': view_data}), 200
        
    except Exception as e:
        current_app.logger.error(f'Get saved view error: {e}')
        return jsonify({'error': 'Failed to retrieve saved view'}), 500


@views_bp.route('/<int:view_id>', methods=['PUT'])
@jwt_required()
def update_saved_view(view_id):
    """Update a saved view (user-scoped)"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Find the view (must belong to current user)
        saved_view = SavedView.query.filter_by(
            id=view_id,
            user_id=user.id
        ).first()
        
        if not saved_view:
            return jsonify({'error': 'Saved view not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Update name if provided
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'View name cannot be empty'}), 400
            
            if len(name) > 255:
                return jsonify({'error': 'View name too long (max 255 characters)'}), 400
            
            # Check for duplicate names (excluding current view)
            existing_view = SavedView.query.filter_by(
                user_id=user.id,
                name=name
            ).filter(SavedView.id != view_id).first()
            
            if existing_view:
                return jsonify({'error': 'A view with this name already exists'}), 409
            
            saved_view.name = name
        
        # Update payload if provided
        if 'payload' in data:
            payload = data['payload']
            if not payload:
                return jsonify({'error': 'View payload cannot be empty'}), 400
            
            try:
                payload_json = json.dumps(payload)
                saved_view.payload_json = payload_json
            except (TypeError, ValueError) as e:
                return jsonify({'error': f'Invalid payload format: {str(e)}'}), 400
        
        # Update timestamp
        saved_view.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Saved view updated successfully',
            'view': saved_view.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Update saved view error: {e}')
        return jsonify({'error': 'Failed to update saved view'}), 500


@views_bp.route('/<int:view_id>', methods=['DELETE'])
@jwt_required()
def delete_saved_view(view_id):
    """Delete a saved view (user-scoped)"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Find the view (must belong to current user)
        saved_view = SavedView.query.filter_by(
            id=view_id,
            user_id=user.id
        ).first()
        
        if not saved_view:
            return jsonify({'error': 'Saved view not found'}), 404
        
        # Store view name for response
        view_name = saved_view.name
        
        # Delete the view
        db.session.delete(saved_view)
        db.session.commit()
        
        return jsonify({
            'message': f'Saved view "{view_name}" deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Delete saved view error: {e}')
        return jsonify({'error': 'Failed to delete saved view'}), 500


@views_bp.route('/search', methods=['GET'])
@jwt_required()
def search_saved_views():
    """Search saved views by name (user-scoped)"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Get search query parameter
        query = request.args.get('q', '').strip()
        
        if not query:
            return jsonify({'error': 'Search query parameter "q" is required'}), 400
        
        # Search views by name (case-insensitive)
        saved_views = SavedView.query.filter_by(user_id=user.id)\
                                    .filter(SavedView.name.ilike(f'%{query}%'))\
                                    .order_by(SavedView.updated_at.desc())\
                                    .all()
        
        return jsonify({
            'views': [view.to_dict() for view in saved_views],
            'count': len(saved_views),
            'query': query
        }), 200
        
    except Exception as e:
        current_app.logger.error(f'Search saved views error: {e}')
        return jsonify({'error': 'Failed to search saved views'}), 500


@views_bp.route('/duplicate/<int:view_id>', methods=['POST'])
@jwt_required()
def duplicate_saved_view(view_id):
    """Duplicate an existing saved view with a new name"""
    try:
        user = get_current_user()
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 401
        
        # Find the source view (must belong to current user)
        source_view = SavedView.query.filter_by(
            id=view_id,
            user_id=user.id
        ).first()
        
        if not source_view:
            return jsonify({'error': 'Source view not found'}), 404
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Get new name for the duplicate
        new_name = data.get('name', '').strip()
        if not new_name:
            # Generate default name
            new_name = f"{source_view.name} (Copy)"
        
        if len(new_name) > 255:
            return jsonify({'error': 'View name too long (max 255 characters)'}), 400
        
        # Check for duplicate names
        existing_view = SavedView.query.filter_by(
            user_id=user.id,
            name=new_name
        ).first()
        
        if existing_view:
            return jsonify({'error': 'A view with this name already exists'}), 409
        
        # Create duplicate view
        duplicate_view = SavedView(
            user_id=user.id,
            name=new_name,
            payload_json=source_view.payload_json
        )
        
        db.session.add(duplicate_view)
        db.session.commit()
        
        return jsonify({
            'message': 'Saved view duplicated successfully',
            'view': duplicate_view.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Duplicate saved view error: {e}')
        return jsonify({'error': 'Failed to duplicate saved view'}), 500


# Error handlers
@views_bp.errorhandler(422)
def handle_unprocessable_entity(e):
    return jsonify({'error': 'Invalid request data'}), 422


@views_bp.errorhandler(429)
def handle_rate_limit_exceeded(e):
    return jsonify({'error': 'Rate limit exceeded. Please try again later.'}), 429
