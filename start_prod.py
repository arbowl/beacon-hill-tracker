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

def setup_databases():
    """Initialize databases if they don't exist"""
    try:
        from backend.app import create_app
        from backend.auth_models import db
        
        app = create_app()
        
        with app.app_context():
            # Create all tables
            db.create_all()
            print("✅ Databases initialized successfully")
            
            # Create admin user if it doesn't exist
            from backend.auth_models import User
            admin_email = os.getenv('ADMIN_EMAIL')
            admin_password = os.getenv('ADMIN_PASSWORD')
            
            if admin_email and admin_password:
                existing_admin = User.query.filter_by(email=admin_email).first()
                if not existing_admin:
                    admin_user = User(
                        email=admin_email,
                        role='admin',
                        is_active=True
                    )
                    admin_user.set_password(admin_password)
                    db.session.add(admin_user)
                    db.session.commit()
                    print(f"✅ Admin user created: {admin_email}")
                else:
                    print(f"ℹ️  Admin user already exists: {admin_email}")
            else:
                print("⚠️  No admin credentials provided in environment variables")
                
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        sys.exit(1)

def main():
    """Main production startup"""
    print("🚀 Beacon Hill Compliance Tracker - Production Startup")
    print("=" * 55)
    
    # Setup databases
    setup_databases()
    
    # Import and run the Flask app
    try:
        from backend.app import create_app
        app = create_app()
        
        # Get port from environment (Render sets this)
        port = int(os.getenv('PORT', 5000))
        
        print(f"🌐 Starting server on port {port}")
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        print(f"❌ Application startup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
