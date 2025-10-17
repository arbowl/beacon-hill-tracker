#!/usr/bin/env python3
"""
EMERGENCY: Reset Admin Password
Use this to fix the security issue with default admin credentials
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from flask import Flask
from auth_models import db, User
from werkzeug.security import generate_password_hash
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


def delete_default_admin():
    """Delete the insecure default admin user"""
    app = create_temp_app()
    
    with app.app_context():
        # Find the default admin
        default_admin = User.query.filter_by(email='admin@example.com').first()
        
        if default_admin:
            print(f"🚨 Found insecure default admin: admin@example.com")
            print(f"   User ID: {default_admin.id}")
            print(f"   Created: {default_admin.created_at}")
            
            db.session.delete(default_admin)
            db.session.commit()
            
            print("✅ Deleted insecure default admin user")
            return True
        else:
            print("ℹ️  No default admin user found (admin@example.com)")
            return False


def create_secure_admin():
    """Create admin user with credentials from environment variables"""
    app = create_temp_app()
    
    with app.app_context():
        admin_email = os.getenv('ADMIN_EMAIL')
        admin_password = os.getenv('ADMIN_PASSWORD')
        
        if not admin_email or not admin_password:
            print("❌ ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set!")
            print("   Set these in Render dashboard before running this script.")
            return False
        
        # Check if admin already exists
        existing_admin = User.query.filter_by(email=admin_email).first()
        if existing_admin:
            print(f"ℹ️  Admin user already exists: {admin_email}")
            print(f"   Updating password...")
            
            existing_admin.pw_hash = generate_password_hash(admin_password)
            existing_admin.is_active = True
            existing_admin.role = User.ROLE_ADMIN
            db.session.commit()
            
            print(f"✅ Updated admin user password")
            return True
        
        # Create new admin
        admin_user = User(
            email=admin_email,
            pw_hash=generate_password_hash(admin_password),
            role=User.ROLE_ADMIN,
            is_active=True
        )
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"✅ Created secure admin user: {admin_email}")
        return True


def list_all_admins():
    """List all admin users"""
    app = create_temp_app()
    
    with app.app_context():
        admins = User.query.filter_by(role=User.ROLE_ADMIN).all()
        
        if not admins:
            print("No admin users found")
            return
        
        print(f"\nFound {len(admins)} admin user(s):")
        print("-" * 80)
        
        for admin in admins:
            status = "✅ Active" if admin.is_active else "❌ Inactive"
            warning = " ⚠️  INSECURE DEFAULT!" if admin.email == "admin@example.com" else ""
            print(f"{status} | {admin.email}{warning}")
            print(f"  ID: {admin.id} | Created: {admin.created_at}")
            print("-" * 80)


def main():
    """Main function"""
    print("=" * 80)
    print("🚨 EMERGENCY: Admin Password Reset Tool")
    print("=" * 80)
    
    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python reset_admin.py --list              # List all admin users")
        print("  python reset_admin.py --delete-default    # Delete insecure default admin")
        print("  python reset_admin.py --create-secure     # Create/update secure admin")
        print("  python reset_admin.py --fix-now           # Delete default + create secure (RECOMMENDED)")
        print("\nRECOMMENDED: Set ADMIN_EMAIL and ADMIN_PASSWORD in Render, then run:")
        print("  python reset_admin.py --fix-now")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == '--list':
        list_all_admins()
    
    elif command == '--delete-default':
        print("\n🗑️  Deleting insecure default admin...\n")
        if delete_default_admin():
            print("\n✅ Done! The insecure admin has been removed.")
            print("   Run with --create-secure to create a secure admin.")
        else:
            print("\n✅ No insecure default admin found.")
    
    elif command == '--create-secure':
        print("\n🔐 Creating/updating secure admin...\n")
        if create_secure_admin():
            print("\n✅ Done! Secure admin is ready.")
            print("\nTest login with your ADMIN_EMAIL and ADMIN_PASSWORD.")
        else:
            print("\n❌ Failed! Check that environment variables are set.")
    
    elif command == '--fix-now':
        print("\n🔧 FULL FIX: Removing insecure admin and creating secure one...\n")
        
        # Step 1: Delete default
        print("Step 1: Removing insecure default admin...")
        delete_default_admin()
        
        # Step 2: Create secure
        print("\nStep 2: Creating secure admin...")
        if create_secure_admin():
            print("\n" + "=" * 80)
            print("✅ SECURITY ISSUE FIXED!")
            print("=" * 80)
            print("\nYour admin account is now secure.")
            print(f"Email: {os.getenv('ADMIN_EMAIL', 'NOT SET')}")
            print("Password: (from ADMIN_PASSWORD env var)")
            print("\n⚠️  Log out immediately and log back in with new credentials!")
        else:
            print("\n❌ Fix failed! Make sure ADMIN_EMAIL and ADMIN_PASSWORD are set in Render.")
    
    else:
        print(f"❌ Unknown command: {command}")
        sys.exit(1)


if __name__ == '__main__':
    main()

