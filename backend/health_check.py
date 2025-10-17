#!/usr/bin/env python3
"""
Health check script for Render deployment
Verifies database connections, environment variables, and auth system
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from flask import Flask
from auth_models import db, User
from database import get_db_connection, get_database_type
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def create_temp_app():
    """Create a temporary Flask app for health checks"""
    app = Flask(__name__)
    
    # Database configuration
    auth_db_url = os.getenv('AUTH_DATABASE_URL', 'sqlite:///auth.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = auth_db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    return app


def check_environment():
    """Check environment variables"""
    print("\n🔍 Environment Variables Check")
    print("=" * 60)
    
    required_vars = [
        'DATABASE_URL',
        'AUTH_DATABASE_URL',
        'SECRET_KEY',
        'JWT_SECRET_KEY',
        'FRONTEND_URL',
    ]
    
    optional_vars = [
        'CORS_ORIGINS',
        'ADMIN_EMAIL',
        'ADMIN_PASSWORD',
        'MAIL_SERVER',
        'MAIL_USERNAME',
    ]
    
    all_good = True
    
    # Check required variables
    for var in required_vars:
        value = os.getenv(var)
        if value:
            # Show first 50 chars only
            display_value = value[:50] + '...' if len(value) > 50 else value
            print(f"✅ {var}: {display_value}")
        else:
            print(f"❌ {var}: NOT SET (REQUIRED)")
            all_good = False
    
    print()
    
    # Check optional variables
    for var in optional_vars:
        value = os.getenv(var)
        if value:
            display_value = value[:50] + '...' if len(value) > 50 else value
            print(f"ℹ️  {var}: {display_value}")
        else:
            print(f"⚠️  {var}: Not set (optional)")
    
    return all_good


def check_auth_database():
    """Check auth database connection and schema"""
    print("\n🗄️  Auth Database Check")
    print("=" * 60)
    
    app = create_temp_app()
    
    with app.app_context():
        try:
            # Check if we can query users
            user_count = User.query.count()
            print(f"✅ Auth database connected successfully")
            print(f"   Users in database: {user_count}")
            
            # Check if there are any active users
            active_users = User.query.filter_by(is_active=True).count()
            inactive_users = User.query.filter_by(is_active=False).count()
            
            print(f"   Active users: {active_users}")
            print(f"   Inactive users: {inactive_users}")
            
            if active_users == 0:
                print("⚠️  WARNING: No active users found!")
                print("   Users cannot log in until activated.")
                print("   Run: python backend/activate_user.py --list")
            
            # Check for admin user
            admin_email = os.getenv('ADMIN_EMAIL', 'admin@example.com')
            admin_user = User.query.filter_by(email=admin_email).first()
            
            if admin_user:
                status = "✅ Active" if admin_user.is_active else "❌ Inactive"
                print(f"\n   Admin user ({admin_email}): {status}")
                print(f"   Role: {admin_user.role}")
            else:
                print(f"\n⚠️  Admin user not found: {admin_email}")
            
            return True
            
        except Exception as e:
            print(f"❌ Auth database error: {e}")
            return False


def check_compliance_database():
    """Check compliance/data database connection"""
    print("\n🗄️  Compliance Database Check")
    print("=" * 60)
    
    try:
        db_type = get_database_type()
        print(f"✅ Database type: {db_type}")
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check committees
            cursor.execute("SELECT COUNT(*) FROM committees")
            if db_type == 'postgresql':
                count = cursor.fetchone()[0]
            else:
                count = cursor.fetchone()[0]
            print(f"   Committees: {count}")
            
            # Check bills
            cursor.execute("SELECT COUNT(*) FROM bills")
            if db_type == 'postgresql':
                count = cursor.fetchone()[0]
            else:
                count = cursor.fetchone()[0]
            print(f"   Bills: {count}")
            
            # Check compliance records
            cursor.execute("SELECT COUNT(*) FROM bill_compliance")
            if db_type == 'postgresql':
                count = cursor.fetchone()[0]
            else:
                count = cursor.fetchone()[0]
            print(f"   Compliance records: {count}")
        
        print("✅ Compliance database connected successfully")
        return True
        
    except Exception as e:
        print(f"❌ Compliance database error: {e}")
        return False


def check_cors():
    """Check CORS configuration"""
    print("\n🌐 CORS Configuration Check")
    print("=" * 60)
    
    frontend_url = os.getenv('FRONTEND_URL')
    cors_origins = os.getenv('CORS_ORIGINS', '')
    
    if not frontend_url:
        print("⚠️  FRONTEND_URL not set")
        return False
    
    print(f"Frontend URL: {frontend_url}")
    
    if not cors_origins:
        print("⚠️  CORS_ORIGINS not set - CORS might not work in production!")
        return False
    
    origins = [o.strip() for o in cors_origins.split(',') if o.strip()]
    print(f"CORS Origins ({len(origins)}):")
    for origin in origins:
        print(f"  - {origin}")
    
    if frontend_url not in origins:
        print(f"⚠️  WARNING: FRONTEND_URL ({frontend_url}) not in CORS_ORIGINS!")
        return False
    
    print("✅ CORS configuration looks good")
    return True


def main():
    """Run all health checks"""
    print("🏥 Beacon Hill Tracker - Health Check")
    print("=" * 60)
    
    checks = {
        'Environment Variables': check_environment(),
        'Auth Database': check_auth_database(),
        'Compliance Database': check_compliance_database(),
        'CORS Configuration': check_cors(),
    }
    
    print("\n" + "=" * 60)
    print("📊 Health Check Summary")
    print("=" * 60)
    
    all_passed = True
    for check_name, passed in checks.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {check_name}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n✅ All checks passed! System is healthy.")
        sys.exit(0)
    else:
        print("\n⚠️  Some checks failed. Please review the output above.")
        sys.exit(1)


if __name__ == '__main__':
    main()

