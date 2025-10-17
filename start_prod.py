#!/usr/bin/env python3
"""
Production startup script for Render deployment
Sets up databases and starts the Flask application
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))


def main():
    """Main production startup"""
    print("🚀 Beacon Hill Compliance Tracker - Production Startup")
    print("=" * 55)
    
    # Check database environment variables
    print("\n🔍 Environment Configuration:")
    db_url = os.getenv('DATABASE_URL', 'Not set')
    auth_url = os.getenv('AUTH_DATABASE_URL', 'Not set')
    print(f"   DATABASE_URL: {db_url[:50]}...")
    print(f"   AUTH_DATABASE_URL: {auth_url[:50]}...")
    print(f"   FRONTEND_URL: {os.getenv('FRONTEND_URL', 'Not set')}")
    print(f"   CORS_ORIGINS: {os.getenv('CORS_ORIGINS', 'Not set')}")
    
    # Import and create the Flask app (this initializes databases automatically)
    try:
        from backend.app import create_app
        app = create_app()
        
        print("✅ Application initialized successfully")
        
        # Verify database tables exist
        with app.app_context():
            from backend.auth_models import User
            try:
                user_count = User.query.count()
                status = f"✅ Auth database connection verified"
                print(f"{status} ({user_count} users)")
            except Exception as e:
                print(f"⚠️  Auth database warning: {e}")
        
        # Get port from environment (Render sets this)
        port = int(os.getenv('PORT', 5000))
        
        print(f"🌐 Starting server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
