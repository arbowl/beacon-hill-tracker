"""
Email Service for sending verification and notification emails
Uses Flask-Mail with configurable SMTP settings
"""

from flask import current_app, render_template_string
from flask_mail import Mail, Message

mail = Mail()

# Email templates
VERIFICATION_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - Beacon Hill Compliance Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Beacon Hill Compliance Tracker</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with the Beacon Hill Compliance Tracker!</p>
            <p>To complete your registration and activate your account, please click the button below:</p>
            <a href="{{ verification_url }}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ verification_url }}">{{ verification_url }}</a></p>
            <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
        </div>
        <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""

ROLE_UPDATE_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Account Role Updated - Beacon Hill Compliance Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .role-badge { 
            display: inline-block; 
            background: #10b981; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Beacon Hill Compliance Tracker</h1>
        </div>
        <div class="content">
            <h2>Your Account Role Has Been Updated</h2>
            <p>Your account role has been updated by an administrator.</p>
            <p><strong>New Role:</strong> <span class="role-badge">{{ new_role.title() }}</span></p>
            {% if new_role == 'privileged' %}
            <p>You now have access to:</p>
            <ul>
                <li>Generate signing keys for data submission</li>
                <li>Manage your signing keys</li>
                <li>All previous user permissions</li>
            </ul>
            {% elif new_role == 'admin' %}
            <p>You now have access to:</p>
            <ul>
                <li>Manage user roles</li>
                <li>View all signing keys</li>
                <li>Access admin panel</li>
                <li>All previous permissions</li>
            </ul>
            {% endif %}
            <p>Log in to your account to access your new features.</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""

PASSWORD_RESET_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password - Beacon Hill Compliance Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { 
            display: inline-block; 
            background: #2563eb; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
        }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Beacon Hill Compliance Tracker</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Beacon Hill Compliance Tracker account.</p>
            <p>To reset your password, click the button below:</p>
            <a href="{{ reset_url }}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="{{ reset_url }}">{{ reset_url }}</a></p>
            <div class="warning">
                <p><strong>⚠️ Important:</strong></p>
                <ul style="margin: 0;">
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request a password reset, you can safely ignore this email</li>
                    <li>Your password will not change unless you click the link and set a new password</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""

CONTACT_FORM_EMAIL_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Form Submission - Beacon Hill Compliance Tracker</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .info-box { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 12px; margin: 20px 0; }
        .message-box { background: white; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 6px; }
        .label { font-weight: bold; color: #1f2937; }
        .value { color: #4b5563; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 New Contact Form Submission</h1>
        </div>
        <div class="content">
            <h2>Contact Form Message</h2>
            <div class="info-box">
                <p><strong>You have received a new message from your website's contact form.</strong></p>
            </div>
            
            <div class="value">
                <span class="label">From:</span> {{ sender_name }} &lt;{{ sender_email }}&gt;
            </div>
            
            <div class="value">
                <span class="label">Subject:</span> {{ subject }}
            </div>
            
            <div class="message-box">
                <div class="label">Message:</div>
                <div style="margin-top: 10px; white-space: pre-wrap;">{{ message }}</div>
            </div>
            
            <div class="info-box">
                <p><strong>💡 Tip:</strong> Reply directly to this email to respond to {{ sender_name }}.</p>
            </div>
        </div>
        <div class="footer">
            <p>This message was sent from the Beacon Hill Compliance Tracker contact form.</p>
        </div>
    </div>
</body>
</html>
"""


def init_mail(app):
    """Initialize Flask-Mail with the application"""
    mail.init_app(app)


def send_verification_email(email, verification_url):
    """Send email verification message to user"""
    try:
        subject = "Verify Your Email - Beacon Hill Compliance Tracker"
        
        # Render HTML template
        html_body = render_template_string(
            VERIFICATION_EMAIL_TEMPLATE,
            verification_url=verification_url
        )
        
        # Create plain text version
        text_body = f"""
Beacon Hill Compliance Tracker - Email Verification

Thank you for registering!

To complete your registration and activate your account, please visit:
{verification_url}

This verification link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.
        """.strip()
        
        # Send email
        msg = Message(
            subject=subject,
            recipients=[email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        current_app.logger.info(f"Verification email sent to {email}")
        
    except Exception as e:
        current_app.logger.error(f"Failed to send verification email to {email}: {e}")
        raise


def send_password_reset_email(email, reset_url):
    """Send password reset email to user"""
    try:
        subject = "Reset Your Password - Beacon Hill Compliance Tracker"
        
        # Render HTML template
        html_body = render_template_string(
            PASSWORD_RESET_EMAIL_TEMPLATE,
            reset_url=reset_url
        )
        
        # Create plain text version
        text_body = f"""
Beacon Hill Compliance Tracker - Password Reset

We received a request to reset your password.

To reset your password, visit:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email.
        """.strip()
        
        # Send email
        msg = Message(
            subject=subject,
            recipients=[email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        current_app.logger.info(f"Password reset email sent to {email}")
        
    except Exception as e:
        current_app.logger.error(
            f"Failed to send password reset email to {email}: {e}"
        )
        raise


def send_contact_form_email(contact_email, sender_name, sender_email,
                            subject, message):
    """Send contact form submission to site admin"""
    try:
        email_subject = f"Contact Form: {subject}"
        
        # Render HTML template
        html_body = render_template_string(
            CONTACT_FORM_EMAIL_TEMPLATE,
            sender_name=sender_name,
            sender_email=sender_email,
            subject=subject,
            message=message
        )
        
        # Create plain text version
        text_body = f"""
Beacon Hill Compliance Tracker - New Contact Form Submission

From: {sender_name} <{sender_email}>
Subject: {subject}

Message:
{message}

---
Reply to this email to respond to {sender_name}.
        """.strip()
        
        # Send email to site admin with reply-to set to sender
        msg = Message(
            subject=email_subject,
            recipients=[contact_email],
            html=html_body,
            body=text_body,
            reply_to=sender_email
        )
        
        mail.send(msg)
        current_app.logger.info(
            f"Contact form email sent to {contact_email} from {sender_email}"
        )
        
    except Exception as e:
        current_app.logger.error(
            f"Failed to send contact form email: {e}"
        )
        raise


def send_role_update_email(email, new_role, old_role=None):
    """Send notification when user role is updated"""
    try:
        subject = "Account Role Updated - Beacon Hill Compliance Tracker"
        
        # Render HTML template
        html_body = render_template_string(
            ROLE_UPDATE_EMAIL_TEMPLATE,
            new_role=new_role,
            old_role=old_role
        )
        
        # Create plain text version
        text_body = f"""
Beacon Hill Compliance Tracker - Role Updated

Your account role has been updated by an administrator.

New Role: {new_role.title()}

Log in to your account to access your new features.
        """.strip()
        
        # Send email
        msg = Message(
            subject=subject,
            recipients=[email],
            html=html_body,
            body=text_body
        )
        
        mail.send(msg)
        current_app.logger.info(f"Role update email sent to {email}")
        
    except Exception as e:
        current_app.logger.error(
            f"Failed to send role update email to {email}: {e}"
        )
        # Don't raise - this is a notification, not critical


def send_key_generated_email(email, key_id):
    """Send notification when signing key is generated"""
    try:
        subject = "New Signing Key Generated - Beacon Hill Compliance Tracker"
        
        text_body = f"""
Beacon Hill Compliance Tracker - New Signing Key

A new signing key has been generated for your account.

Key ID: {key_id}

You can view and manage your signing keys in your account dashboard.

Keep your signing keys secure and do not share them with others.
        """.strip()
        
        # Send email
        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body
        )
        
        mail.send(msg)
        current_app.logger.info(f"Key generation email sent to {email}")
        
    except Exception as e:
        current_app.logger.error(f"Failed to send key generation email to {email}: {e}")
        # Don't raise - this is a notification, not critical


# Export functions
__all__ = [
    'mail', 'init_mail', 'send_verification_email',
    'send_password_reset_email', 'send_contact_form_email',
    'send_role_update_email', 'send_key_generated_email'
]
