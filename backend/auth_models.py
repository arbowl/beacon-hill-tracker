"""
Auth Database Schema for Beacon Hill Compliance Tracker
Creates tables for user authentication, saved views, and signing keys
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
import secrets
import string

db = SQLAlchemy()


class User(db.Model):
    """User accounts with role-based access control"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False,
                       index=True)
    pw_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user',
                      index=True)
    is_active = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False,
                           default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    email_tokens = db.relationship('EmailToken', backref='user',
                                   lazy='dynamic',
                                   cascade='all, delete-orphan')
    saved_views = db.relationship('SavedView', backref='user',
                                  lazy='dynamic',
                                  cascade='all, delete-orphan')
    signing_keys = db.relationship('SigningKey', backref='user',
                                   lazy='dynamic',
                                   cascade='all, delete-orphan')
    
    # Role constants
    ROLE_USER = 'user'
    ROLE_PRIVILEGED = 'privileged'
    ROLE_ADMIN = 'admin'
    
    VALID_ROLES = [ROLE_USER, ROLE_PRIVILEGED, ROLE_ADMIN]
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self):
        """Convert user to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def has_role(self, role):
        """Check if user has specific role or higher"""
        role_hierarchy = {
            self.ROLE_USER: 0,
            self.ROLE_PRIVILEGED: 1,
            self.ROLE_ADMIN: 2
        }
        return role_hierarchy.get(self.role, -1) >= role_hierarchy.get(role, 999)
    
    def can_manage_users(self):
        """Check if user can manage other users"""
        return self.role == self.ROLE_ADMIN
    
    def can_generate_keys(self):
        """Check if user can generate signing keys"""
        return self.role in [self.ROLE_PRIVILEGED, self.ROLE_ADMIN]


class EmailToken(db.Model):
    """Email verification and password reset tokens"""
    __tablename__ = 'email_tokens'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(255), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    purpose = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    
    # Purpose constants
    PURPOSE_VERIFICATION = 'verification'
    PURPOSE_PASSWORD_RESET = 'password_reset'
    
    VALID_PURPOSES = [PURPOSE_VERIFICATION, PURPOSE_PASSWORD_RESET]
    
    def __repr__(self):
        return f'<EmailToken {self.token[:8]}... for {self.user.email}>'
    
    def is_expired(self):
        """Check if token is expired"""
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)
    
    @staticmethod
    def generate_token():
        """Generate a secure random token"""
        return secrets.token_urlsafe(32)


class SavedView(db.Model):
    """User-saved dashboard views with filters and visualization settings"""
    __tablename__ = 'saved_views'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    payload_json = db.Column(db.Text, nullable=False)  # JSON string with view configuration
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Composite index for user queries
    __table_args__ = (
        db.Index('idx_saved_views_user_name', 'user_id', 'name'),
    )
    
    def __repr__(self):
        return f'<SavedView "{self.name}" by {self.user.email}>'
    
    def to_dict(self):
        """Convert saved view to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'payload_json': self.payload_json,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class SigningKey(db.Model):
    """Cryptographic keys for data submitters"""
    __tablename__ = 'signing_keys'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    key_id = db.Column(db.String(64), unique=True, nullable=False, index=True)
    secret = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    revoked_at = db.Column(db.DateTime, nullable=True)
    
    def __repr__(self):
        return f'<SigningKey {self.key_id} for {self.user.email}>'
    
    def is_revoked(self):
        """Check if key is revoked"""
        return self.revoked_at is not None
    
    def revoke(self):
        """Revoke the signing key"""
        self.revoked_at = datetime.now(timezone.utc)
    
    def to_dict(self, include_secret=False):
        """Convert signing key to dictionary for JSON serialization"""
        data = {
            'id': self.id,
            'key_id': self.key_id,
            'created_at': self.created_at.isoformat(),
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'is_revoked': self.is_revoked()
        }
        if include_secret and not self.is_revoked():
            data['secret'] = self.secret
        return data
    
    @staticmethod
    def generate_key_pair():
        """Generate a new key ID and secret pair"""
        # Generate a readable key ID (like API keys)
        key_id = 'bhct_' + ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(24))
        
        # Generate a secure secret
        secret = secrets.token_urlsafe(32)
        
        return key_id, secret


def init_db(app):
    """Initialize the database with the Flask app"""
    # Set SQLAlchemy database URI from config
    auth_db_path = app.config.get('AUTH_DATABASE_URL', 'sqlite:///auth.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = auth_db_path
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Create default admin user if it doesn't exist
        admin_email = app.config.get('ADMIN_EMAIL', 'admin@example.com')
        admin_password = app.config.get('ADMIN_PASSWORD', 'change-this-admin-password')
        
        if not User.query.filter_by(email=admin_email).first():
            from werkzeug.security import generate_password_hash
            
            admin_user = User(
                email=admin_email,
                pw_hash=generate_password_hash(admin_password),
                role=User.ROLE_ADMIN,
                is_active=True
            )
            db.session.add(admin_user)
            db.session.commit()
            print(f"Created admin user: {admin_email}")
        
        print("Authentication database initialized successfully")

# Export models for easy importing
__all__ = ['db', 'User', 'EmailToken', 'SavedView', 'SigningKey', 'init_db']
