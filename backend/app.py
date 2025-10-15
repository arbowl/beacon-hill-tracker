"""
Beacon Hill Compliance Tracker - Integrated Flask Application
Combines existing ingest API with new authentication, dashboard,
and admin features.
"""

import os
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import sqlite3
from datetime import datetime
from pathlib import Path

# Import our new modules
from auth_models import init_db as init_auth_db
from auth_routes import auth_bp
from views_routes import views_bp
from keys_routes import keys_bp
from email_service import init_mail
from security import init_security_middleware

# Load environment variables
load_dotenv()

def create_app():
    """Application factory pattern"""
    flask_app = Flask(__name__)

    # Configuration
    flask_app.config['SECRET_KEY'] = os.getenv(
        'SECRET_KEY', 'dev-secret-key-change-in-production')
    flask_app.config['JWT_SECRET_KEY'] = os.getenv(
        'JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    flask_app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(
        os.getenv('JWT_ACCESS_TOKEN_EXPIRES', '3600'))

    # Database paths
    flask_app.config['DATABASE_URL'] = os.getenv(
        'DATABASE_URL', 'sqlite:///compliance_tracker.db')
    flask_app.config['AUTH_DATABASE_URL'] = os.getenv(
        'AUTH_DATABASE_URL', 'sqlite:///auth.db')

    # Email configuration
    flask_app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'localhost')
    flask_app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
    flask_app.config['MAIL_USE_TLS'] = (
        os.getenv('MAIL_USE_TLS', 'True').lower() == 'true')
    flask_app.config['MAIL_USE_SSL'] = (
        os.getenv('MAIL_USE_SSL', 'False').lower() == 'true')
    flask_app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    flask_app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    flask_app.config['MAIL_DEFAULT_SENDER'] = os.getenv(
        'MAIL_DEFAULT_SENDER')

    # Other configuration
    flask_app.config['FRONTEND_URL'] = os.getenv(
        'FRONTEND_URL', 'http://localhost:5173')
    flask_app.config['RATELIMIT_STORAGE_URL'] = os.getenv(
        'RATELIMIT_STORAGE_URL', 'memory://')
    flask_app.config['RATELIMIT_DEFAULT'] = os.getenv(
        'RATELIMIT_DEFAULT', '100 per hour')

    # Initialize extensions
    JWTManager(flask_app)
    init_mail(flask_app)

    # Initialize security middleware (includes CORS, rate limiting, etc.)
    flask_app, _ = init_security_middleware(flask_app)

    # Initialize auth database
    init_auth_db(flask_app)

    # Register blueprints
    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(views_bp)
    flask_app.register_blueprint(keys_bp)

    # Initialize main database (existing functionality)
    init_database()

    # Define API routes within the app context
    @flask_app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'message': 'Beacon Hill Compliance Tracker API is running',
            'timestamp': datetime.utcnow().isoformat()
        })

    # Stats endpoint for dashboard
    @flask_app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get global statistics for the dashboard"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get overall statistics with deduplication
            cursor.execute('''
                WITH latest_bills AS (
                    SELECT bc.*, 
                           ROW_NUMBER() OVER (PARTITION BY bc.bill_id, bc.committee_id ORDER BY bc.generated_at DESC) as rn
                    FROM bill_compliance bc
                )
                SELECT 
                    COUNT(DISTINCT committee_id) as total_committees,
                    COUNT(CASE WHEN rn = 1 THEN 1 END) as total_bills,
                    SUM(CASE WHEN rn = 1 AND LOWER(state) = 'compliant' THEN 1 ELSE 0 END) as compliant_bills,
                    SUM(CASE WHEN rn = 1 AND LOWER(state) IN ('incomplete') THEN 1 ELSE 0 END) as incomplete_bills,
                    SUM(CASE WHEN rn = 1 AND LOWER(state) = 'non-compliant' THEN 1 ELSE 0 END) as non_compliant_bills,
                    SUM(CASE WHEN rn = 1 AND (LOWER(state) IN ('unknown') OR state = 'Unknown') THEN 1 ELSE 0 END) as unknown_bills,
                    ROUND(
                        CASE
                            WHEN COUNT(CASE WHEN rn = 1 AND LOWER(state) NOT IN ('unknown') AND state != 'Unknown' THEN 1 END) > 0
                            THEN 100.0 * SUM(CASE WHEN rn = 1 AND LOWER(state) = 'compliant' THEN 1 ELSE 0 END) / COUNT(CASE WHEN rn = 1 AND LOWER(state) NOT IN ('unknown') AND state != 'Unknown' THEN 1 END)
                            ELSE 0
                        END, 2
                    ) as overall_compliance_rate,
                    MAX(generated_at) as latest_report_date
                FROM latest_bills
            ''')
            
            result = cursor.fetchone()
            
            if result:
                stats = {
                    'total_committees': result[0] or 0,
                    'total_bills': result[1] or 0,
                    'compliant_bills': result[2] or 0,
                    'incomplete_bills': result[3] or 0,
                    'non_compliant_bills': result[4] or 0,
                    'unknown_bills': result[5] or 0,
                    'overall_compliance_rate': result[6] or 0,
                    'latest_report_date': result[7]
                }
            else:
                stats = {
                    'total_committees': 0,
                    'total_bills': 0,
                    'compliant_bills': 0,
                    'incomplete_bills': 0,
                    'non_compliant_bills': 0,
                    'unknown_bills': 0,
                    'overall_compliance_rate': 0,
                    'latest_report_date': None
                }
            
            conn.close()
            return jsonify(stats)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Committees endpoint
    @flask_app.route('/api/committees', methods=['GET'])
    def get_committees():
        """Get all committees"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT committee_id, name, chamber, url, updated_at
                FROM committees
                ORDER BY name
            ''')
            
            committees = []
            for row in cursor.fetchall():
                committees.append({
                    'committee_id': row[0],
                    'name': row[1],
                    'chamber': row[2],
                    'url': row[3],
                    'updated_at': row[4]
                })
            
            conn.close()
            return jsonify(committees)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Committee statistics endpoint
    @flask_app.route('/api/committees/stats', methods=['GET'])
    def get_committee_stats():
        """Get committee compliance statistics"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('''
                WITH latest_bills AS (
                    SELECT bc.*, 
                           ROW_NUMBER() OVER (PARTITION BY bc.bill_id, bc.committee_id ORDER BY bc.generated_at DESC) as rn
                    FROM bill_compliance bc
                )
                SELECT 
                    c.committee_id,
                    c.name as committee_name,
                    c.chamber,
                    COUNT(CASE WHEN lb.rn = 1 THEN 1 END) as total_bills,
                    SUM(CASE WHEN lb.rn = 1 AND LOWER(lb.state) = 'compliant' THEN 1 ELSE 0 END) as compliant_count,
                    SUM(CASE WHEN lb.rn = 1 AND LOWER(lb.state) IN ('incomplete') THEN 1 ELSE 0 END) as incomplete_count,
                    SUM(CASE WHEN lb.rn = 1 AND LOWER(lb.state) = 'non-compliant' THEN 1 ELSE 0 END) as non_compliant_count,
                    SUM(CASE WHEN lb.rn = 1 AND (LOWER(lb.state) IN ('unknown') OR lb.state = 'Unknown') THEN 1 ELSE 0 END) as unknown_count,
                    ROUND(
                        CASE
                            WHEN COUNT(CASE WHEN lb.rn = 1 AND LOWER(lb.state) NOT IN ('unknown') AND lb.state != 'Unknown' THEN 1 END) > 0
                            THEN 100.0 * SUM(CASE WHEN lb.rn = 1 AND LOWER(lb.state) = 'compliant' THEN 1 ELSE 0 END) / COUNT(CASE WHEN lb.rn = 1 AND LOWER(lb.state) NOT IN ('unknown') AND lb.state != 'Unknown' THEN 1 END)
                            ELSE 0
                        END, 2
                    ) as compliance_rate,
                    MAX(lb.generated_at) as last_report_generated
                FROM committees c
                LEFT JOIN latest_bills lb ON c.committee_id = lb.committee_id
                GROUP BY c.committee_id, c.name, c.chamber
                ORDER BY compliance_rate DESC, c.name
            ''')
            
            committee_stats = []
            for row in cursor.fetchall():
                committee_stats.append({
                    'committee_id': row[0],
                    'committee_name': row[1],
                    'chamber': row[2],
                    'total_bills': row[3] or 0,
                    'compliant_count': row[4] or 0,
                    'incomplete_count': row[5] or 0,
                    'non_compliant_count': row[6] or 0,
                    'unknown_count': row[7] or 0,
                    'compliance_rate': row[8] or 0,
                    'last_report_generated': row[9]
                })
            
            conn.close()
            return jsonify(committee_stats)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Detailed committee endpoint
    @flask_app.route('/api/committees/<committee_id>', methods=['GET'])
    def get_committee_details(committee_id):
        """Get detailed information for a specific committee including contact details"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT committee_id, name, chamber, url, 
                       house_room, house_address, house_phone,
                       senate_room, senate_address, senate_phone,
                       house_chair_name, house_chair_email,
                       house_vice_chair_name, house_vice_chair_email,
                       senate_chair_name, senate_chair_email,
                       senate_vice_chair_name, senate_vice_chair_email,
                       updated_at
                FROM committees
                WHERE committee_id = ?
            ''', (committee_id,))
            
            row = cursor.fetchone()
            if not row:
                conn.close()
                return jsonify({'error': 'Committee not found'}), 404
            
            committee = {
                'committee_id': row[0],
                'name': row[1],
                'chamber': row[2],
                'url': row[3],
                'house_room': row[4],
                'house_address': row[5],
                'house_phone': row[6],
                'senate_room': row[7],
                'senate_address': row[8],
                'senate_phone': row[9],
                'house_chair_name': row[10],
                'house_chair_email': row[11],
                'house_vice_chair_name': row[12],
                'house_vice_chair_email': row[13],
                'senate_chair_name': row[14],
                'senate_chair_email': row[15],
                'senate_vice_chair_name': row[16],
                'senate_vice_chair_email': row[17],
                'updated_at': row[18]
            }
            
            conn.close()
            return jsonify(committee)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Bills endpoint with filtering
    @flask_app.route('/api/bills', methods=['GET'])
    def get_bills():
        """Get bills with optional filtering - deduplicated to show only latest version"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get filter parameters
            committee_id = request.args.get('committee_id')  # For backward compatibility
            committees = request.args.get('committees')      # For multiple committee selection
            chamber = request.args.get('chamber')
            state = request.args.get('state')
            search_term = request.args.get('search', '')
            
            # Build the query with deduplication
            base_query = '''
                WITH latest_bills AS (
                    SELECT bc.committee_id, bc.bill_id, bc.hearing_date, bc.deadline_60, bc.effective_deadline,
                           bc.extension_order_url, bc.extension_date, bc.reported_out, bc.summary_present,
                           bc.summary_url, bc.votes_present, bc.votes_url, bc.state, bc.reason,
                           bc.notice_status, bc.notice_gap_days, bc.announcement_date, bc.scheduled_hearing_date,
                           bc.generated_at, b.bill_title, b.bill_url, c.name as committee_name, c.chamber,
                           ROW_NUMBER() OVER (PARTITION BY bc.bill_id, bc.committee_id ORDER BY bc.generated_at DESC) as rn
                    FROM bill_compliance bc
                    LEFT JOIN bills b ON bc.bill_id = b.bill_id
                    LEFT JOIN committees c ON bc.committee_id = c.committee_id
                )
                SELECT committee_id, bill_id, hearing_date, deadline_60, effective_deadline,
                       extension_order_url, extension_date, reported_out, summary_present,
                       summary_url, votes_present, votes_url, state, reason,
                       notice_status, notice_gap_days, announcement_date, scheduled_hearing_date,
                       generated_at, bill_title, bill_url, committee_name, chamber
                FROM latest_bills
                WHERE rn = 1
            '''
            
            params = []
            conditions = []
            
            # Handle committee filtering (single or multiple)
            if committee_id:
                conditions.append("committee_id = ?")
                params.append(committee_id)
            elif committees:
                # Handle comma-separated list of committee IDs
                committee_list = [c.strip() for c in committees.split(',') if c.strip()]
                if committee_list:
                    placeholders = ','.join(['?' for _ in committee_list])
                    conditions.append(f"committee_id IN ({placeholders})")
                    params.extend(committee_list)
            
            if chamber:
                conditions.append("chamber = ?")
                params.append(chamber)
            
            if state:
                conditions.append("LOWER(state) = LOWER(?)")
                params.append(state)
            
            if search_term:
                conditions.append("(bill_id LIKE ? OR bill_title LIKE ?)")
                params.extend([f'%{search_term}%', f'%{search_term}%'])
            
            if conditions:
                base_query += " AND " + " AND ".join(conditions)
            
            base_query += " ORDER BY generated_at DESC"
            
            cursor.execute(base_query, params)
            
            bills = []
            for row in cursor.fetchall():
                bill = {
                    'committee_id': row[0],          # committee_id
                    'bill_id': row[1],               # bill_id
                    'hearing_date': row[2],          # hearing_date
                    'deadline_60': row[3],           # deadline_60
                    'effective_deadline': row[4],    # effective_deadline
                    'extension_order_url': row[5],   # extension_order_url
                    'extension_date': row[6],        # extension_date
                    'reported_out': bool(row[7]),    # reported_out
                    'summary_present': bool(row[8]), # summary_present
                    'summary_url': row[9],           # summary_url
                    'votes_present': bool(row[10]),  # votes_present
                    'votes_url': row[11],            # votes_url
                    'state': row[12],                # state
                    'reason': row[13],               # reason
                    'notice_status': row[14],        # notice_status
                    'notice_gap_days': row[15],      # notice_gap_days
                    'announcement_date': row[16],    # announcement_date
                    'scheduled_hearing_date': row[17], # scheduled_hearing_date
                    'generated_at': row[18],         # generated_at
                    'bill_title': row[19],           # bill_title (from JOIN)
                    'bill_url': row[20] if row[20] else f'https://malegislature.gov/Bills/194/{row[1]}', # bill_url (from JOIN)
                    'committee_name': row[21],       # committee_name (from JOIN)
                    'chamber': row[22],              # chamber (from JOIN)
                }
                
                # Normalize state to lowercase for consistent frontend handling
                if bill['state']:
                    bill['state'] = bill['state'].lower()
                
                bills.append(bill)
            
            conn.close()
            return jsonify(bills)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return flask_app

# ========================================================================
# Database Initialization (Existing functionality)
# ========================================================================

# Get the absolute path to the compliance_tracker.db in the parent directory
BASE_DIR = Path(__file__).parent.parent
DB_PATH = str(BASE_DIR / 'compliance_tracker.db')

def init_database():
    """Initialize SQLite3 database with schema from SCHEMA.md Part 2"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create committees table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS committees (
            committee_id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            chamber TEXT NOT NULL CHECK(chamber IN
                ('Joint', 'House', 'Senate')),
            url TEXT NOT NULL,
            house_room TEXT,
            house_address TEXT,
            house_phone TEXT,
            senate_room TEXT,
            senate_address TEXT,
            senate_phone TEXT,
            house_chair_name TEXT,
            house_chair_email TEXT,
            house_vice_chair_name TEXT,
            house_vice_chair_email TEXT,
            senate_chair_name TEXT,
            senate_chair_email TEXT,
            senate_vice_chair_name TEXT,
            senate_vice_chair_email TEXT,
            updated_at TEXT NOT NULL
        )
    ''')

    # Create bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bills (
            bill_id TEXT PRIMARY KEY,
            bill_title TEXT,
            bill_url TEXT,
            updated_at TEXT
        )
    ''')

    # Create bill_compliance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bill_compliance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            committee_id TEXT NOT NULL,
            bill_id TEXT NOT NULL,
            hearing_date TEXT,
            deadline_60 TEXT,
            effective_deadline TEXT,
            extension_order_url TEXT,
            extension_date TEXT,
            reported_out INTEGER NOT NULL,
            summary_present INTEGER NOT NULL,
            summary_url TEXT,
            votes_present INTEGER NOT NULL,
            votes_url TEXT,
            state TEXT NOT NULL,
            reason TEXT NOT NULL,
            notice_status TEXT,
            notice_gap_days INTEGER,
            announcement_date TEXT,
            scheduled_hearing_date TEXT,
            generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (committee_id) REFERENCES committees(committee_id) ON DELETE CASCADE,
            FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE
        )
    ''')

    conn.commit()
    conn.close()

# Create the Flask app instance for direct execution
if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
