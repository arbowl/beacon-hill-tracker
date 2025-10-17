"""
Contact Form API Endpoint
Handles contact form submissions and sends emails
"""

from flask import Blueprint, request, jsonify, current_app
from email_validator import validate_email, EmailNotValidError

contact_bp = Blueprint('contact', __name__, url_prefix='/api/contact')


@contact_bp.route('/send', methods=['POST', 'OPTIONS'])
def send_contact_message():
    """Send contact form message via email"""
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        # Extract and validate form data
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        subject = data.get('subject', '').strip()
        message = data.get('message', '').strip()
        
        # Validate required fields
        if not name or not email or not subject or not message:
            return jsonify({
                'error': 'All fields are required'
            }), 400
        
        # Validate email format
        try:
            valid_email = validate_email(email)
            email = valid_email.email
        except EmailNotValidError as e:
            return jsonify({'error': f'Invalid email: {str(e)}'}), 400
        
        # Validate message length
        if len(message) < 10:
            return jsonify({
                'error': 'Message must be at least 10 characters long'
            }), 400
        
        if len(message) > 5000:
            return jsonify({
                'error': 'Message must be less than 5000 characters'
            }), 400
        
        # Send contact email
        try:
            from email_service import send_contact_form_email
            
            # Get contact recipient from config
            contact_email = current_app.config.get(
                'CONTACT_EMAIL',
                'info@beaconhilltracker.org'
            )
            
            send_contact_form_email(
                contact_email=contact_email,
                sender_name=name,
                sender_email=email,
                subject=subject,
                message=message
            )
            
            current_app.logger.info(
                f'Contact form submitted by {name} ({email})'
            )
            
            return jsonify({
                'message': ('Thank you for your message! '
                           'We will get back to you soon.')
            }), 200
            
        except Exception as e:
            current_app.logger.error(f'Failed to send contact email: {e}')
            return jsonify({
                'error': ('Failed to send message. '
                          'Please try again later or email us directly.')
            }), 500
        
    except Exception as e:
        current_app.logger.error(f'Contact form error: {e}')
        return jsonify({'error': 'Failed to process request'}), 500


# Error handlers
@contact_bp.errorhandler(429)
def handle_rate_limit_exceeded(e):
    return jsonify({
        'error': 'Too many requests. Please try again later.'
    }), 429

