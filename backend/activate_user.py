#!/usr/bin/env python3
"""
Utility script to manually activate user accounts
Useful when email verification isn't working in production
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from flask import Flask
from auth_models import db, User
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_temp_app():
    """Create a temporary Flask app for database operations"""
    app = Flask(__name__)
    
    # Database configuration
    auth_db_url = os.getenv('AUTH_DATABASE_URL', 'sqlite:///auth.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = auth_db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    return app


def activate_user(email):
    """Activate a user account by email"""
    app = create_temp_app()
    
    with app.app_context():
        user = User.query.filter_by(email=email.lower()).first()
        
        if not user:
            print(f"❌ User not found: {email}")
            return False
        
        if user.is_active:
            print(f"ℹ️  User already active: {email}")
            return True
        
        user.is_active = True
        db.session.commit()
        
        print(f"✅ User activated: {email}")
        print(f"   User ID: {user.id}")
        print(f"   Role: {user.role}")
        print(f"   Created: {user.created_at}")
        
        return True


def list_users():
    """List all users in the database"""
    app = create_temp_app()
    
    with app.app_context():
        users = User.query.order_by(User.created_at.desc()).all()
        
        if not users:
            print("No users found in database")
            return
        
        print(f"\nFound {len(users)} user(s):")
        print("-" * 80)
        
        for user in users:
            status = "✅ Active" if user.is_active else "❌ Inactive"
            print(f"{status} | {user.email}")
            print(f"  ID: {user.id} | Role: {user.role} | Created: {user.created_at}")
            print("-" * 80)


def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python activate_user.py <email>          - Activate specific user")
        print("  python activate_user.py --list           - List all users")
        print("  python activate_user.py --activate-all   - Activate all users")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == '--list':
        list_users()
    elif command == '--activate-all':
        app = create_temp_app()
        with app.app_context():
            users = User.query.filter_by(is_active=False).all()
            if not users:
                print("No inactive users found")
            else:
                for user in users:
                    user.is_active = True
                db.session.commit()
                print(f"✅ Activated {len(users)} user(s)")
    else:
        email = command
        activate_user(email)


if __name__ == '__main__':
    main()

