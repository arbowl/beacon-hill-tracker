"""
Security and CORS Configuration
Handles CORS settings, rate limiting, and security headers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from datetime import timedelta


def init_cors(app: Flask):
    """Initialize CORS configuration"""
    # Get allowed origins from environment or use defaults
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    allowed_origins = [
        frontend_url,
        'http://localhost:3000',  # Alternative React dev server
        'http://localhost:5173',  # Vite dev server
        'http://127.0.0.1:5173',  # Alternative localhost
        'https://beaconhilltracker.org',  # Production frontend
        'https://www.beaconhilltracker.org',  # Production frontend with www
    ]
    
    # Add production origins if specified
    production_origins = os.getenv('CORS_ORIGINS', '').split(',')
    for origin in production_origins:
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)
    
    # Log CORS configuration for debugging
    app.logger.info(f"CORS allowed origins: {allowed_origins}")
    
    # Configure CORS
    CORS(app, 
         origins=allowed_origins,
         methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
         allow_headers=[
             'Content-Type',
             'Authorization',
             'Accept',
             'Origin',
             'X-Requested-With',
             'X-CSRF-Token',
             'X-Ingest-Key-Id',
             'X-Ingest-Timestamp',
             'X-Ingest-Signature'
         ],
         supports_credentials=True,
         max_age=timedelta(hours=24))
    
    return app


def init_rate_limiter(app: Flask):
    """Initialize rate limiting"""
    # Get rate limit storage from config
    storage_url = app.config.get('RATELIMIT_STORAGE_URL', 'memory://')
    default_limits = app.config.get('RATELIMIT_DEFAULT', '100 per hour')
    
    # Exempt health check and debug endpoints from rate limiting
    def rate_limit_exempt():
        """Check if current request should be exempt from rate limiting"""
        exempt_paths = ['/health', '/debug/db-info']
        return request.path in exempt_paths
    
    # Initialize limiter
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=storage_url,
        default_limits=[default_limits],
        headers_enabled=True,
        retry_after='http-date',
        skip_if=rate_limit_exempt
    )
    limiter.init_app(app)
    
    # Define rate limits for different endpoint types
    
    # Authentication endpoints - stricter limits
    @limiter.limit("5 per minute")
    def auth_rate_limit():
        pass
    
    # Apply to auth routes
    # Note: Rate limits are applied via decorators in route files
    
    # Error handler for rate limit exceeded
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': str(e.description),
            'retry_after': getattr(e, 'retry_after', None)
        }), 429
    
    return limiter


def init_security_headers(app: Flask):
    """Initialize security headers (helmet-style)"""
    
    @app.after_request
    def set_security_headers(response):
        # Content Security Policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.github.com; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        response.headers['Content-Security-Policy'] = csp_policy
        
        # Prevent clickjacking
        response.headers['X-Frame-Options'] = 'DENY'
        
        # Prevent MIME type sniffing
        response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # Enable XSS protection
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Referrer policy
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # HSTS for HTTPS (only in production)
        if request.is_secure or app.config.get('FORCE_HTTPS', False):
            response.headers['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains; preload'
            )
        
        # Permissions policy (formerly Feature Policy)
        permissions_policy = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "speaker=()"
        )
        response.headers['Permissions-Policy'] = permissions_policy
        
        # Remove server information
        response.headers.pop('Server', None)
        
        # Cache control for API responses
        if request.path.startswith('/api/') or request.path.startswith('/auth/'):
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        
        return response
    
    return app


def init_request_validation(app: Flask):
    """Initialize request validation middleware"""
    
    @app.before_request
    def validate_request():
        # Check request size
        max_content_length = app.config.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)  # 16MB
        if (request.content_length and max_content_length and 
            request.content_length > max_content_length):
            return jsonify({'error': 'Request entity too large'}), 413
        
        # Validate Content-Type for JSON endpoints
        if request.method in ['POST', 'PUT', 'PATCH'] and request.path.startswith('/api/'):
            if not request.is_json and request.content_type != 'application/json':
                return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        # Block suspicious user agents (basic protection)
        user_agent = request.headers.get('User-Agent', '').lower()
        suspicious_agents = ['sqlmap', 'nmap', 'nikto', 'masscan', 'zap']
        if any(agent in user_agent for agent in suspicious_agents):
            return jsonify({'error': 'Forbidden'}), 403
        
        # Basic bot protection
        if len(user_agent) < 10 and request.method != 'OPTIONS':
            return jsonify({'error': 'Invalid user agent'}), 400
    
    return app


def init_error_handlers(app: Flask):
    """Initialize global error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Insufficient permissions'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found'
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'error': 'Method Not Allowed',
            'message': 'The method is not allowed for the requested URL'
        }), 405
    
    @app.errorhandler(413)
    def payload_too_large(error):
        return jsonify({
            'error': 'Payload Too Large',
            'message': 'The request entity is too large'
        }), 413
    
    @app.errorhandler(422)
    def unprocessable_entity(error):
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': 'The request was well-formed but contains semantic errors'
        }), 422
    
    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        }), 500
    
    return app


def init_security_middleware(app: Flask):
    """Initialize all security middleware"""
    app = init_cors(app)
    limiter = init_rate_limiter(app)
    app = init_security_headers(app)
    app = init_request_validation(app)
    app = init_error_handlers(app)
    
    # Log security configuration
    app.logger.info("Security middleware initialized:")
    app.logger.info(f"- CORS origins: {app.config.get('CORS_ORIGINS', 'default')}")
    app.logger.info(f"- Rate limiting: {app.config.get('RATELIMIT_DEFAULT', '100 per hour')}")
    app.logger.info("- Security headers enabled")
    app.logger.info("- Request validation enabled")
    
    return app, limiter


# Export main function
__all__ = ['init_security_middleware']
