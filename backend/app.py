
"""
Beacon Hill Compliance Tracker - Integrated Flask Application
Combines existing ingest API with new authentication, dashboard,
and admin features.
"""

import os
import logging
import time
from flask import Flask, request, jsonify
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import datetime

# Import our new modules
from auth_models import init_db as init_auth_db
from auth_routes import auth_bp
from views_routes import views_bp
from keys_routes import keys_bp
from contact_routes import contact_bp
from email_service import init_mail
from security import init_security_middleware
from database import get_db_connection, get_database_type, init_compliance_database

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
    flask_app.config['BACKEND_URL'] = os.getenv(
        'BACKEND_URL', 'http://localhost:5000')
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
    flask_app.register_blueprint(contact_bp)

    # Initialize main database (existing functionality)
    init_compliance_database()

    # Define API routes within the app context
    @flask_app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint"""
        return jsonify({
            'status': 'healthy',
            'message': 'Beacon Hill Compliance Tracker API is running',
            'timestamp': datetime.utcnow().isoformat()
        })

    @flask_app.route('/debug/db-info', methods=['GET'])
    def debug_db_info():
        """Debug endpoint to check database connection and type"""
        try:
            db_type = get_database_type()
            db_url = os.getenv('DATABASE_URL', 'sqlite:///compliance_tracker.db')
            
            # Test database connection
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Count records
                cursor.execute('SELECT COUNT(*) FROM committees')
                committee_count = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM bills')
                bill_count = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM bill_compliance')
                compliance_count = cursor.fetchone()[0]
            
            return jsonify({
                'status': 'success',
                'database_type': db_type,
                'database_url_prefix': db_url.split('://')[0] if '://' in db_url else 'unknown',
                'counts': {
                    'committees': committee_count,
                    'bills': bill_count,
                    'bill_compliance': compliance_count
                },
                'timestamp': datetime.utcnow().isoformat()
            })
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    @flask_app.route('/debug/test-write', methods=['POST'])
    def debug_test_write():
        """Debug endpoint to test database write without authentication"""
        logger = logging.getLogger(__name__)
        logger.info("=== DEBUG TEST WRITE CALLED ===")
        
        try:
            db_type = get_database_type()
            placeholder = '%s' if db_type == 'postgresql' else '?'
            logger.info(f"Database type: {db_type}")
            
            test_committee_id = f"TEST_DEBUG_{int(time.time())}"
            
            with get_db_connection() as conn:
                cursor = conn.cursor()
                logger.info("Database connection established")
                
                # Try to insert a test committee
                if db_type == 'postgresql':
                    logger.info("Using PostgreSQL INSERT")
                    cursor.execute(f'''
                        INSERT INTO committees 
                        (committee_id, name, chamber, url, updated_at)
                        VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                        ON CONFLICT (committee_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            updated_at = EXCLUDED.updated_at
                    ''', (
                        test_committee_id,
                        'Test Committee',
                        'Joint',
                        'https://example.com',
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                else:
                    logger.info("Using SQLite INSERT OR REPLACE")
                    cursor.execute('''
                        INSERT OR REPLACE INTO committees 
                        (committee_id, name, chamber, url, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        test_committee_id,
                        'Test Committee',
                        'Joint',
                        'https://example.com',
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                
                logger.info("INSERT executed")
                
                # Verify the insert
                cursor.execute(f'SELECT COUNT(*) FROM committees WHERE committee_id = {placeholder}', (test_committee_id,))
                count = cursor.fetchone()[0]
                logger.info(f"Verification count: {count}")
                
                # The context manager should commit automatically
                logger.info("Exiting context manager (should auto-commit)")
            
            # Check again after context manager closes
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(f'SELECT COUNT(*) FROM committees WHERE committee_id = {placeholder}', (test_committee_id,))
                final_count = cursor.fetchone()[0]
                logger.info(f"Final verification count: {final_count}")
            
            return jsonify({
                'status': 'success',
                'message': 'Test write completed',
                'database_type': db_type,
                'test_committee_id': test_committee_id,
                'inserted': final_count > 0,
                'timestamp': datetime.utcnow().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Test write failed: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }), 500

    # Stats endpoint for dashboard
    @flask_app.route('/api/stats', methods=['GET'])
    def get_stats():
        """Get global statistics for the dashboard"""
        try:
            with get_db_connection() as conn:
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
                    # Merge incomplete into non_compliant for presentation
                    incomplete_count = result[3] or 0
                    non_compliant_count = result[4] or 0
                    
                    stats = {
                        'total_committees': result[0] or 0,
                        'total_bills': result[1] or 0,
                        'compliant_bills': result[2] or 0,
                        'incomplete_bills': 0,  # Always 0 - merged into non_compliant
                        'non_compliant_bills': non_compliant_count + incomplete_count,  # Merge incomplete here
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
                
                return jsonify(stats)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Committees endpoint
    @flask_app.route('/api/committees', methods=['GET'])
    def get_committees():
        """Get all committees"""
        try:
            with get_db_connection() as conn:
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
                
                return jsonify(committees)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Committee statistics endpoint
    @flask_app.route('/api/committees/stats', methods=['GET'])
    def get_committee_stats():
        """Get committee compliance statistics"""
        try:
            with get_db_connection() as conn:
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
                    # Merge incomplete into non_compliant for presentation
                    incomplete_count = row[5] or 0
                    non_compliant_count = row[6] or 0
                    
                    committee_stats.append({
                        'committee_id': row[0],
                        'committee_name': row[1],
                        'chamber': row[2],
                        'total_bills': row[3] or 0,
                        'compliant_count': row[4] or 0,
                        'incomplete_count': 0,  # Always 0 - merged into non_compliant
                        'non_compliant_count': non_compliant_count + incomplete_count,  # Merge incomplete here
                        'unknown_count': row[7] or 0,
                        'compliance_rate': row[8] or 0,
                        'last_report_generated': row[9]
                    })
                
                return jsonify(committee_stats)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Detailed committee endpoint
    @flask_app.route('/api/committees/<committee_id>', methods=['GET'])
    def get_committee_details(committee_id):
        """Get detailed information for a specific committee including contact details"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Use appropriate placeholder based on database type
                placeholder = '%s' if get_database_type() == 'postgresql' else '?'
                
                cursor.execute(f'''
                    SELECT committee_id, name, chamber, url, 
                           house_room, house_address, house_phone,
                           senate_room, senate_address, senate_phone,
                           house_chair_name, house_chair_email,
                           house_vice_chair_name, house_vice_chair_email,
                           senate_chair_name, senate_chair_email,
                           senate_vice_chair_name, senate_vice_chair_email,
                           updated_at
                    FROM committees
                    WHERE committee_id = {placeholder}
                ''', (committee_id,))
                
                row = cursor.fetchone()
                if not row:
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
                
                return jsonify(committee)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Bills endpoint with filtering
    @flask_app.route('/api/bills', methods=['GET'])
    def get_bills():
        """Get bills with optional filtering - deduplicated to show only latest version"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Get filter parameters
                committee_id = request.args.get('committee_id')  # For backward compatibility
                committees = request.args.get('committees')      # For multiple committee selection
                chambers = request.args.get('chambers')          # For multiple chamber selection
                chamber = request.args.get('chamber')            # For backward compatibility
                states = request.args.get('states')              # For multiple state selection
                state = request.args.get('state')                # For backward compatibility
                search_term = request.args.get('search', '')
                
                # Get appropriate placeholder for database type
                placeholder = '%s' if get_database_type() == 'postgresql' else '?'
                
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
                    conditions.append(f"committee_id = {placeholder}")
                    params.append(committee_id)
                elif committees:
                    # Handle comma-separated list of committee IDs
                    committee_list = [c.strip() for c in committees.split(',') if c.strip()]
                    if committee_list:
                        placeholders = ','.join([placeholder for _ in committee_list])
                        conditions.append(f"committee_id IN ({placeholders})")
                        params.extend(committee_list)
                
                # Handle chamber filtering (single or multiple)
                if chamber:
                    conditions.append(f"chamber = {placeholder}")
                    params.append(chamber)
                elif chambers:
                    # Handle comma-separated list of chambers
                    chamber_list = [c.strip() for c in chambers.split(',') if c.strip()]
                    if chamber_list:
                        placeholders = ','.join([placeholder for _ in chamber_list])
                        conditions.append(f"chamber IN ({placeholders})")
                        params.extend(chamber_list)
                
                # Handle state filtering (single or multiple)
                if state:
                    conditions.append(f"LOWER(state) = LOWER({placeholder})")
                    params.append(state)
                elif states:
                    # Handle comma-separated list of states
                    state_list = [s.strip() for s in states.split(',') if s.strip()]
                    if state_list:
                        # Create case-insensitive comparisons for each state
                        state_placeholders = ' OR '.join([f"LOWER(state) = LOWER({placeholder})" for _ in state_list])
                        conditions.append(f"({state_placeholders})")
                        params.extend(state_list)
                
                if search_term:
                    conditions.append(f"(bill_id LIKE {placeholder} OR bill_title LIKE {placeholder})")
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
                    
                    # Normalize state to lowercase and map incomplete → non-compliant
                    if bill['state']:
                        bill['state'] = bill['state'].lower()
                        if bill['state'] == 'incomplete':
                            bill['state'] = 'non-compliant'
                    
                    bills.append(bill)
                
                return jsonify(bills)
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    # Scan metadata endpoint - get latest diff_report and analysis for a committee
    @flask_app.route('/api/compliance/<committee_id>/metadata', methods=['GET'])
    def get_committee_metadata(committee_id):
        """Get latest scan metadata (diff_report and analysis) for a committee"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                db_type = get_database_type()
                placeholder = '%s' if db_type == 'postgresql' else '?'
                
                # Debug: Check if table exists
                if db_type == 'sqlite':
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_scan_metadata'")
                    table_check = cursor.fetchone()
                    logger = logging.getLogger(__name__)
                    if not table_check:
                        logger.error(f"compliance_scan_metadata table does not exist for committee {committee_id}")
                
                # Get the latest scan metadata for this committee
                cursor.execute(f'''
                    SELECT diff_report, analysis, scan_date
                    FROM compliance_scan_metadata
                    WHERE committee_id = {placeholder}
                    ORDER BY scan_date DESC
                    LIMIT 1
                ''', (committee_id,))
                
                result = cursor.fetchone()
                
                if not result:
                    return jsonify({
                        'diff_report': None,
                        'analysis': None,
                        'scan_date': None
                    }), 200
                
                if db_type == 'postgresql':
                    diff_report_json = result[0]
                    analysis = result[1]
                    scan_date = result[2]
                else:
                    diff_report_json = result[0]
                    analysis = result[1]
                    scan_date = result[2]
                
                # Parse diff_report JSON if it exists
                diff_report = None
                if diff_report_json:
                    try:
                        diff_report = json.loads(diff_report_json) if isinstance(diff_report_json, str) else diff_report_json
                    except (json.JSONDecodeError, TypeError):
                        diff_report = None
                
                return jsonify({
                    'diff_report': diff_report,
                    'analysis': analysis,
                    'scan_date': scan_date.isoformat() if hasattr(scan_date, 'isoformat') else scan_date
                }), 200
        
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching committee metadata for {committee_id}: {str(e)}", exc_info=True)
            # Check if table exists
            try:
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='compliance_scan_metadata'")
                table_exists = cursor.fetchone() is not None
                if not table_exists:
                    logger.error("compliance_scan_metadata table does not exist! Database schema may need to be initialized.")
            except Exception:
                pass
            return jsonify({'error': str(e)}), 500

    # Global aggregated metadata endpoint - sums stats across all committees
    @flask_app.route('/api/compliance/metadata', methods=['GET'])
    def get_global_metadata():
        """Get aggregated scan metadata (diff_report summed across all committees)"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                db_type = get_database_type()
                
                # Get the latest scan metadata for each committee
                cursor.execute('''
                    SELECT committee_id, diff_report, scan_date
                    FROM compliance_scan_metadata
                    WHERE diff_report IS NOT NULL
                    ORDER BY committee_id, scan_date DESC
                ''')
                
                results = cursor.fetchall()
                
                if not results:
                    return jsonify({
                        'diff_report': None,
                        'analysis': None,
                        'scan_date': None
                    }), 200
                
                # Group by committee_id and get the latest for each
                latest_by_committee = {}
                for result in results:
                    committee_id = result[0]
                    diff_report_json = result[1]
                    scan_date = result[2]
                    
                    if committee_id not in latest_by_committee:
                        # Parse diff_report
                        try:
                            if db_type == 'postgresql':
                                diff_report = diff_report_json if isinstance(diff_report_json, dict) else json.loads(diff_report_json)
                            else:
                                diff_report = json.loads(diff_report_json) if isinstance(diff_report_json, str) else diff_report_json
                            
                            if diff_report:
                                latest_by_committee[committee_id] = {
                                    'diff_report': diff_report,
                                    'scan_date': scan_date
                                }
                        except (json.JSONDecodeError, TypeError):
                            continue
                
                # Aggregate all diff_reports
                aggregated = {
                    'time_interval': None,
                    'previous_date': None,
                    'current_date': None,
                    'compliance_delta': 0.0,
                    'new_bills_count': 0,
                    'new_bills': [],
                    'bills_with_new_hearings': [],
                    'bills_reported_out': [],
                    'bills_with_new_summaries': []
                }
                
                # Track count for averaging compliance_delta
                compliance_delta_count = 0
                compliance_delta_sum = 0.0
                
                latest_scan_date = None
                for committee_data in latest_by_committee.values():
                    dr = committee_data['diff_report']
                    
                    # Average compliance_delta (track count and sum separately)
                    if dr.get('compliance_delta') is not None:
                        compliance_delta_sum += dr['compliance_delta']
                        compliance_delta_count += 1
                    if dr.get('new_bills_count') is not None:
                        aggregated['new_bills_count'] += dr['new_bills_count']
                    
                    # Collect unique bill IDs
                    if dr.get('new_bills'):
                        aggregated['new_bills'].extend(dr['new_bills'])
                    if dr.get('bills_with_new_hearings'):
                        aggregated['bills_with_new_hearings'].extend(dr['bills_with_new_hearings'])
                    if dr.get('bills_reported_out'):
                        aggregated['bills_reported_out'].extend(dr['bills_reported_out'])
                    if dr.get('bills_with_new_summaries'):
                        aggregated['bills_with_new_summaries'].extend(dr['bills_with_new_summaries'])
                    
                    # Use first time_interval, previous_date, current_date (they should be consistent)
                    if not aggregated['time_interval'] and dr.get('time_interval'):
                        aggregated['time_interval'] = dr['time_interval']
                    if not aggregated['previous_date'] and dr.get('previous_date'):
                        aggregated['previous_date'] = dr['previous_date']
                    if not aggregated['current_date'] and dr.get('current_date'):
                        aggregated['current_date'] = dr['current_date']
                    
                    # Track latest scan date
                    scan_date = committee_data['scan_date']
                    if scan_date:
                        scan_date_str = scan_date.isoformat() if hasattr(scan_date, 'isoformat') else str(scan_date)
                        if not latest_scan_date or scan_date_str > latest_scan_date:
                            latest_scan_date = scan_date_str
                
                # Calculate average compliance_delta
                if compliance_delta_count > 0:
                    aggregated['compliance_delta'] = compliance_delta_sum / compliance_delta_count
                else:
                    aggregated['compliance_delta'] = None
                
                # Remove duplicates from lists
                aggregated['new_bills'] = list(set(aggregated['new_bills']))
                aggregated['bills_with_new_hearings'] = list(set(aggregated['bills_with_new_hearings']))
                aggregated['bills_reported_out'] = list(set(aggregated['bills_reported_out']))
                aggregated['bills_with_new_summaries'] = list(set(aggregated['bills_with_new_summaries']))
                
                return jsonify({
                    'diff_report': aggregated,
                    'analysis': None,  # No analysis for aggregated view
                    'scan_date': latest_scan_date
                }), 200
        
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching global metadata: {str(e)}", exc_info=True)
            return jsonify({'error': str(e)}), 500

    # Data ingestion endpoints
    @flask_app.route('/ingest/cache', methods=['POST'])
    def ingest_cache():
        """
        Ingest endpoint for cache data.
        Expects cache.json structure with bill_parsers, committee_contacts, etc.
        Requires HMAC signature authentication.
        """
        try:
            # Verify signature
            is_valid, error_msg, key_record = verify_ingest_signature(request)
            if not is_valid:
                return jsonify({
                    "status": "error",
                    "message": f"Authentication failed: {error_msg}"
                }), 401
            
            data = request.get_json()
            if not data:
                return jsonify({
                    "status": "error",
                    "message": "No JSON data provided"
                }), 400

            result = import_cache_data(data)
            if result['status'] == 'success':
                # Log successful ingestion
                user_id = key_record[1] if key_record else None
                result['authenticated_user_id'] = user_id
                return jsonify(result), 200
            return jsonify(result), 500

        except Exception as exc:
            return jsonify({"status": "error", "message": str(exc)}), 500

    @flask_app.route('/ingest/basic', methods=['POST'])
    def ingest_basic():
        """
        Ingest endpoint for basic/compliance reports.
        Expects: {"committee_id": "XXX", "run_id": "...", "items": [...]}
        Also accepts "bills" instead of "items" for backwards compatibility.
        Requires HMAC signature authentication.
        """
        logger = logging.getLogger(__name__)
        logger.info("=== INGEST BASIC ENDPOINT CALLED ===")
        
        try:
            # Verify signature
            logger.info("Verifying signature...")
            is_valid, error_msg, key_record = verify_ingest_signature(request)
            if not is_valid:
                logger.warning(f"Authentication failed: {error_msg}")
                return jsonify({
                    "status": "error",
                    "message": f"Authentication failed: {error_msg}"
                }), 401
            
            logger.info("Signature verified successfully")
            
            data = request.get_json()
            if not data:
                logger.error("No JSON data provided")
                return jsonify({
                    "status": "error",
                    "message": "No JSON data provided"
                }), 400

            if not isinstance(data, dict):
                logger.error("Data is not a dictionary")
                return jsonify({
                    "status": "error",
                    "message": "Expected JSON object with committee_id and items"
                }), 400

            # Extract committee_id (from body or query parameter)
            committee_id = data.get('committee_id') or request.args.get('committee_id')
            logger.info(f"Committee ID: {committee_id}")
            
            # Debug: Log top-level keys to see what we received
            logger.info(f"Top-level keys in data: {list(data.keys())}")
            logger.info(f"Has 'bills' key: {'bills' in data}")
            logger.info(f"Has 'diff_report' key: {'diff_report' in data}")
            logger.info(f"Has 'analysis' key: {'analysis' in data}")
            
            if not committee_id:
                logger.error("No committee_id provided")
                return jsonify({
                    "status": "error",
                    "message": "committee_id is required"
                }), 400

            # Extract items/bills array - handle both old and new formats
            # Old format: data is array directly, or has 'items' or 'bills' array
            # New format: has 'bills' array, optional 'diff_report' and 'analysis'
            items = None
            diff_report = None
            analysis = None
            
            # Check if data itself is an array (old format)
            if isinstance(data, list):
                items = data
            else:
                # Check for new format with bills, diff_report, analysis
                # First check if 'bills' key exists (could be new or old format)
                if 'bills' in data and isinstance(data['bills'], list):
                    items = data['bills']
                    # Check if this is the new format (has diff_report or analysis at top level)
                    if 'diff_report' in data or 'analysis' in data:
                        diff_report = data.get('diff_report')  # Can be None
                        analysis = data.get('analysis')  # Can be None
                        logger.info(f"New format detected: has diff_report={diff_report is not None}, analysis={analysis is not None}")
                        if diff_report:
                            logger.info(f"Diff report keys: {list(diff_report.keys()) if isinstance(diff_report, dict) else 'not a dict'}")
                # Fall back to old format: 'items' or 'bills' as direct key
                elif 'items' in data and isinstance(data['items'], list):
                    items = data['items']
                elif 'bills' in data and isinstance(data['bills'], list):
                    items = data['bills']
            
            if items is None:
                logger.error("Could not find 'items' or 'bills' array in data")
                return jsonify({
                    "status": "error",
                    "message": "Expected 'items' or 'bills' to be an array"
                }), 400
            
            logger.info(f"Number of items to ingest: {len(items)}")
            if diff_report:
                logger.info(f"Diff report present with compliance_delta: {diff_report.get('compliance_delta')}")

            logger.info("Calling import_compliance_report...")
            result = import_compliance_report(committee_id, items, diff_report, analysis)
            logger.info(f"Import result: {result}")
            
            if result['status'] == 'success':
                # Log successful ingestion
                user_id = key_record[1] if key_record else None
                result['authenticated_user_id'] = user_id
                logger.info(f"SUCCESS: Returning 200 with result: {result}")
                return jsonify(result), 200
            
            logger.error(f"Import failed with result: {result}")
            return jsonify(result), 500

        except Exception as exc:
            logger.error(f"Exception in ingest_basic: {str(exc)}", exc_info=True)
            return jsonify({"status": "error", "message": str(exc)}), 500

    @flask_app.route('/ingest/changelog', methods=['POST'])
    def ingest_changelog():
        """
        Ingest endpoint for changelog data.
        Expects: {
            "current_version": "1.0.0",
            "user_agent": "...",
            "changelog": [
                {
                    "version": "1.0.0",
                    "date": "2025-10-28",
                    "changes": {
                        "added": [...],
                        "changed": [...],
                        "fixed": [...],
                        ...
                    }
                }
            ]
        }
        Requires HMAC signature authentication.
        """
        logger = logging.getLogger(__name__)
        logger.info("=== INGEST CHANGELOG ENDPOINT CALLED ===")
        
        try:
            # Verify signature
            logger.info("Verifying signature...")
            is_valid, error_msg, key_record = verify_ingest_signature(request)
            if not is_valid:
                logger.warning(f"Authentication failed: {error_msg}")
                return jsonify({
                    "status": "error",
                    "message": f"Authentication failed: {error_msg}"
                }), 401
            
            logger.info("Signature verified successfully")
            
            data = request.get_json()
            if not data:
                logger.error("No JSON data provided")
                return jsonify({
                    "status": "error",
                    "message": "No JSON data provided"
                }), 400

            if not isinstance(data, dict):
                logger.error("Data is not a dictionary")
                return jsonify({
                    "status": "error",
                    "message": "Expected JSON object with changelog data"
                }), 400

            # Validate required fields
            current_version = data.get('current_version')
            if not current_version:
                logger.error("No current_version provided")
                return jsonify({
                    "status": "error",
                    "message": "current_version is required"
                }), 400

            changelog_entries = data.get('changelog', [])
            if not isinstance(changelog_entries, list):
                logger.error("changelog is not a list")
                return jsonify({
                    "status": "error",
                    "message": "Expected 'changelog' to be an array"
                }), 400

            logger.info(f"Processing changelog for version {current_version} with {len(changelog_entries)} entries")
            
            result = import_changelog_data(data)
            logger.info(f"Import result: {result}")
            
            if result['status'] == 'success':
                logger.info(f"SUCCESS: Returning 200 with result: {result}")
                return jsonify(result), 200
            
            logger.error(f"Import failed with result: {result}")
            return jsonify(result), 500

        except Exception as exc:
            logger.error(f"Exception in ingest_changelog: {str(exc)}", exc_info=True)
            return jsonify({"status": "error", "message": str(exc)}), 500

    @flask_app.route('/api/changelog', methods=['GET'])
    def get_changelog():
        """
        Retrieve changelog entries.
        Query params:
            - limit: number of versions to return (default: 10)
            - version: specific version to retrieve
        """
        try:
            limit = request.args.get('limit', 10, type=int)
            version = request.args.get('version')
            
            with get_db_connection() as conn:
                cursor = conn.cursor()
                db_type = get_database_type()
                
                if version:
                    # Get specific version
                    if db_type == 'postgresql':
                        cursor.execute('''
                            SELECT id, version, date, user_agent, received_at
                            FROM changelog_versions
                            WHERE version = %s
                        ''', (version,))
                    else:
                        cursor.execute('''
                            SELECT id, version, date, user_agent, received_at
                            FROM changelog_versions
                            WHERE version = ?
                        ''', (version,))
                    
                    version_row = cursor.fetchone()
                    if not version_row:
                        return jsonify({"error": "Version not found"}), 404
                    
                    versions = [version_row]
                else:
                    # Get recent versions
                    if db_type == 'postgresql':
                        cursor.execute('''
                            SELECT id, version, date, user_agent, received_at
                            FROM changelog_versions
                            ORDER BY received_at DESC
                            LIMIT %s
                        ''', (limit,))
                    else:
                        cursor.execute('''
                            SELECT id, version, date, user_agent, received_at
                            FROM changelog_versions
                            ORDER BY received_at DESC
                            LIMIT ?
                        ''', (limit,))
                    
                    versions = cursor.fetchall()
                
                # Build response
                changelog_data = []
                for version_row in versions:
                    if db_type == 'postgresql':
                        version_id = version_row[0]
                        version_info = {
                            'version': version_row[1],
                            'date': version_row[2],
                            'user_agent': version_row[3],
                            'received_at': version_row[4].isoformat() if version_row[4] else None
                        }
                    else:
                        version_id = version_row['id']
                        version_info = {
                            'version': version_row['version'],
                            'date': version_row['date'],
                            'user_agent': version_row['user_agent'],
                            'received_at': version_row['received_at']
                        }
                    
                    # Get entries for this version
                    placeholder = '%s' if db_type == 'postgresql' else '?'
                    cursor.execute(f'''
                        SELECT category, description
                        FROM changelog_entries
                        WHERE version_id = {placeholder}
                        ORDER BY id
                    ''', (version_id,))
                    
                    entries = cursor.fetchall()
                    changes = {}
                    for entry in entries:
                        if db_type == 'postgresql':
                            category = entry[0]
                            description = entry[1]
                        else:
                            category = entry['category']
                            description = entry['description']
                        
                        if category not in changes:
                            changes[category] = []
                        changes[category].append(description)
                    
                    version_info['changes'] = changes
                    changelog_data.append(version_info)
                
                return jsonify({
                    "status": "success",
                    "count": len(changelog_data),
                    "changelog": changelog_data
                }), 200
                
        except Exception as exc:
            logger = logging.getLogger(__name__)
            logger.error(f"Exception in get_changelog: {str(exc)}", exc_info=True)
            return jsonify({"error": str(exc)}), 500

    return flask_app

# ========================================================================
# Signature Verification for Ingestion Endpoints
# ========================================================================

import hashlib
import hmac
import time
import json

def verify_ingest_signature(request):
    """
    Verify HMAC signature for ingestion endpoints.
    Returns (is_valid, error_message, signing_key_record)
    """
    try:
        # Get signature headers
        key_id = request.headers.get('X-Ingest-Key-Id')
        timestamp = request.headers.get('X-Ingest-Timestamp')
        signature = request.headers.get('X-Ingest-Signature')
        
        if not all([key_id, timestamp, signature]):
            return False, "Missing required signature headers (X-Ingest-Key-Id, X-Ingest-Timestamp, X-Ingest-Signature)", None
        
        # Check timestamp (reject requests older than 5 minutes)
        try:
            request_time = int(timestamp)
            current_time = int(time.time())
            if abs(current_time - request_time) > 300:  # 5 minutes
                return False, "Request timestamp too old or too far in future", None
        except ValueError:
            return False, "Invalid timestamp format", None
        
        # Look up the signing key in the database
        from auth_models import SigningKey
        signing_key = SigningKey.query.filter_by(key_id=key_id).first()
        if not signing_key:
            return False, "Invalid signing key ID", None
        if signing_key.revoked_at:
            return False, "Signing key has been revoked", None
        secret = signing_key.secret
        
        # Reconstruct the message that should have been signed
        method = request.method.upper()
        path = request.path
        
        # Get request body and compute hash
        body = request.get_json()
        if body is None:
            body = {}
        
        body_json = json.dumps(body, separators=(",", ":"), ensure_ascii=False)
        body_hash = hashlib.sha256(body_json.encode("utf-8")).hexdigest()
        
        # Create message to verify: timestamp.METHOD.path.body_hash
        message = f"{timestamp}.{method}.{path}.{body_hash}"
        
        # Compute expected signature
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            message.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        # Compare signatures (timing-safe comparison)
        if not hmac.compare_digest(signature, expected_sig):
            return False, "Invalid signature", None
        
        key_record = (signing_key.id, signing_key.user_id, signing_key.secret, signing_key.key_id, signing_key.revoked_at)
        
        return True, None, key_record
        
    except Exception as e:
        return False, f"Signature verification error: {str(e)}", None

# ========================================================================
# Data Import Functions
# ========================================================================

def import_cache_data(cache_data):
    """Import data from cache.json structure"""
    logger = logging.getLogger(__name__)
    logger.info(f"Starting cache data import. DB type: {get_database_type()}")
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        try:
            db_type = get_database_type()
            placeholder = '%s' if db_type == 'postgresql' else '?'
            logger.info(f"Using database type: {db_type}, placeholder: {placeholder}")
            
            # Import committees
            if 'committee_contacts' in cache_data:
                logger.info(f"Importing {len(cache_data['committee_contacts'])} committees")
                for comm_id, comm_data in cache_data['committee_contacts'].items():
                    if db_type == 'postgresql':
                        # PostgreSQL: Use INSERT ... ON CONFLICT ... DO UPDATE
                        cursor.execute(f'''
                            INSERT INTO committees 
                            (committee_id, name, chamber, url, house_room, house_address, house_phone,
                             senate_room, senate_address, senate_phone, house_chair_name, house_chair_email,
                             house_vice_chair_name, house_vice_chair_email, senate_chair_name, senate_chair_email,
                             senate_vice_chair_name, senate_vice_chair_email, updated_at)
                            VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, 
                                    {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder},
                                    {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder},
                                    {placeholder}, {placeholder}, {placeholder}, {placeholder})
                            ON CONFLICT (committee_id) DO UPDATE SET
                                name = EXCLUDED.name,
                                chamber = EXCLUDED.chamber,
                                url = EXCLUDED.url,
                                house_room = EXCLUDED.house_room,
                                house_address = EXCLUDED.house_address,
                                house_phone = EXCLUDED.house_phone,
                                senate_room = EXCLUDED.senate_room,
                                senate_address = EXCLUDED.senate_address,
                                senate_phone = EXCLUDED.senate_phone,
                                house_chair_name = EXCLUDED.house_chair_name,
                                house_chair_email = EXCLUDED.house_chair_email,
                                house_vice_chair_name = EXCLUDED.house_vice_chair_name,
                                house_vice_chair_email = EXCLUDED.house_vice_chair_email,
                                senate_chair_name = EXCLUDED.senate_chair_name,
                                senate_chair_email = EXCLUDED.senate_chair_email,
                                senate_vice_chair_name = EXCLUDED.senate_vice_chair_name,
                                senate_vice_chair_email = EXCLUDED.senate_vice_chair_email,
                                updated_at = EXCLUDED.updated_at
                        ''',
                        (
                            comm_data.get('committee_id', comm_id),
                            comm_data.get('name', ''),
                            comm_data.get('chamber', 'Joint'),
                            comm_data.get('url', ''),
                            comm_data.get('house_room'),
                            comm_data.get('house_address'),
                            comm_data.get('house_phone'),
                            comm_data.get('senate_room'),
                            comm_data.get('senate_address'),
                            comm_data.get('senate_phone'),
                            comm_data.get('house_chair_name', ''),
                            comm_data.get('house_chair_email', ''),
                            comm_data.get('house_vice_chair_name', ''),
                            comm_data.get('house_vice_chair_email', ''),
                            comm_data.get('senate_chair_name', ''),
                            comm_data.get('senate_chair_email', ''),
                            comm_data.get('senate_vice_chair_name', ''),
                            comm_data.get('senate_vice_chair_email', ''),
                            comm_data.get('updated_at', datetime.utcnow().isoformat() + 'Z')
                        ))
                    else:
                        # SQLite: Use INSERT OR REPLACE
                        cursor.execute(
                            'INSERT OR REPLACE INTO committees '
                            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '
                            '?, ?, ?, ?, ?, ?, ?, ?, ?)',
                            (
                                comm_data.get('committee_id', comm_id),
                                comm_data.get('name', ''),
                                comm_data.get('chamber', 'Joint'),
                                comm_data.get('url', ''),
                                comm_data.get('house_room'),
                                comm_data.get('house_address'),
                                comm_data.get('house_phone'),
                                comm_data.get('senate_room'),
                                comm_data.get('senate_address'),
                                comm_data.get('senate_phone'),
                                comm_data.get('house_chair_name', ''),
                                comm_data.get('house_chair_email', ''),
                                comm_data.get('house_vice_chair_name', ''),
                                comm_data.get('house_vice_chair_email', ''),
                                comm_data.get('senate_chair_name', ''),
                                comm_data.get('senate_chair_email', ''),
                                comm_data.get('senate_vice_chair_name', ''),
                                comm_data.get('senate_vice_chair_email', ''),
                                comm_data.get('updated_at', datetime.utcnow().isoformat() + 'Z')
                            ))

            # Import bills
            if 'bill_parsers' in cache_data:
                logger.info(f"Importing {len(cache_data['bill_parsers'])} bills")
                for bill_id, bill_data in cache_data['bill_parsers'].items():
                    # Insert basic bill info
                    title = bill_data.get('title', {})
                    if db_type == 'postgresql':
                        # PostgreSQL: Use INSERT ... ON CONFLICT ... DO UPDATE
                        cursor.execute(f'''
                            INSERT INTO bills (bill_id, bill_title, bill_url, updated_at)
                            VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})
                            ON CONFLICT (bill_id) DO UPDATE SET
                                bill_title = EXCLUDED.bill_title,
                                bill_url = EXCLUDED.bill_url,
                                updated_at = EXCLUDED.updated_at
                        ''',
                        (
                            bill_id,
                            title.get('value') if isinstance(title, dict) else title,
                            bill_data.get('bill_url'),
                            title.get('updated_at') if isinstance(title, dict) else datetime.utcnow().isoformat() + 'Z'
                        ))
                    else:
                        # SQLite: Use INSERT OR REPLACE
                        cursor.execute(
                            'INSERT OR REPLACE INTO bills '
                            '(bill_id, bill_title, bill_url, updated_at) '
                            'VALUES (?, ?, ?, ?)',
                            (
                                bill_id,
                                title.get('value') if isinstance(title, dict) else title,
                                bill_data.get('bill_url'),
                                title.get('updated_at') if isinstance(title, dict) else datetime.utcnow().isoformat() + 'Z'
                            ))

            conn.commit()  # Explicit commit
            logger.info("Cache data import completed successfully")
            return {
                "status": "success",
                "message": "Successfully imported cache data"
            }

        except Exception as e:
            logger.error(f"Cache data import failed: {str(e)}", exc_info=True)
            conn.rollback()
            return {
                "status": "error",
                "message": f"Database error: {str(e)}"
            }

def import_changelog_data(data):
    """
    Import changelog data into the database.
    
    Args:
        data: Dictionary containing current_version, user_agent, and changelog list
    
    Returns:
        dict: Status and results of the import
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Starting changelog import for version {data.get('current_version')}")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            db_type = get_database_type()
            placeholder = '%s' if db_type == 'postgresql' else '?'
            
            current_version = data.get('current_version')
            user_agent = data.get('user_agent')
            changelog_entries = data.get('changelog', [])
            
            versions_imported = 0
            entries_imported = 0
            
            for entry in changelog_entries:
                version = entry.get('version')
                date = entry.get('date')
                changes = entry.get('changes', {})
                
                if not version or not date:
                    logger.warning(f"Skipping entry with missing version or date: {entry}")
                    continue
                
                # Check if version already exists
                cursor.execute(f'''
                    SELECT id FROM changelog_versions WHERE version = {placeholder}
                ''', (version,))
                
                existing = cursor.fetchone()
                if existing:
                    if db_type == 'postgresql':
                        version_id = existing[0]
                    else:
                        version_id = existing['id']
                    logger.info(f"Version {version} already exists (id={version_id}), updating...")
                    
                    # Delete old entries for this version
                    cursor.execute(f'''
                        DELETE FROM changelog_entries WHERE version_id = {placeholder}
                    ''', (version_id,))
                    
                    # Update version info
                    cursor.execute(f'''
                        UPDATE changelog_versions
                        SET date = {placeholder}, user_agent = {placeholder}, received_at = CURRENT_TIMESTAMP
                        WHERE id = {placeholder}
                    ''', (date, user_agent, version_id))
                else:
                    # Insert new version
                    if db_type == 'postgresql':
                        cursor.execute('''
                            INSERT INTO changelog_versions (version, date, user_agent)
                            VALUES (%s, %s, %s)
                            RETURNING id
                        ''', (version, date, user_agent))
                        version_id = cursor.fetchone()[0]
                    else:
                        cursor.execute('''
                            INSERT INTO changelog_versions (version, date, user_agent)
                            VALUES (?, ?, ?)
                        ''', (version, date, user_agent))
                        version_id = cursor.lastrowid
                    
                    versions_imported += 1
                    logger.info(f"Inserted new version {version} with id={version_id}")
                
                # Insert changelog entries
                for category, descriptions in changes.items():
                    if not isinstance(descriptions, list):
                        descriptions = [descriptions]
                    
                    for description in descriptions:
                        cursor.execute(f'''
                            INSERT INTO changelog_entries (version_id, category, description)
                            VALUES ({placeholder}, {placeholder}, {placeholder})
                        ''', (version_id, category, description))
                        entries_imported += 1
            
            logger.info(f"Changelog import complete: {versions_imported} versions, {entries_imported} entries")
            
            return {
                'status': 'success',
                'message': 'Changelog received successfully',
                'version': current_version,
                'versions_imported': versions_imported,
                'entries_imported': entries_imported
            }
            
    except Exception as e:
        logger.error(f"Error importing changelog: {str(e)}", exc_info=True)
        return {
            'status': 'error',
            'message': f"Failed to import changelog: {str(e)}"
        }

def import_compliance_report(committee_id, bills_data, diff_report=None, analysis=None):
    """Import compliance report data for a specific committee"""
    logger = logging.getLogger(__name__)
    logger.info(f"Starting compliance report import for committee {committee_id}")
    logger.info(f"Number of bills to import: {len(bills_data)}")
    logger.info(f"Database type: {get_database_type()}")
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        try:
            db_type = get_database_type()
            placeholder = '%s' if db_type == 'postgresql' else '?'
            logger.info(f"Using placeholder: {placeholder}")
            
            # Ensure committee exists (auto-create if needed)
            logger.info(f"Checking if committee {committee_id} exists...")
            cursor.execute(f'SELECT COUNT(*) FROM committees WHERE committee_id = {placeholder}', (committee_id,))
            committee_exists = cursor.fetchone()[0] > 0
            
            if not committee_exists:
                logger.info(f"Committee {committee_id} not found, creating...")
                if db_type == 'postgresql':
                    cursor.execute(f'''
                        INSERT INTO committees 
                        (committee_id, name, chamber, url, updated_at)
                        VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                        ON CONFLICT (committee_id) DO NOTHING
                    ''', (
                        committee_id,
                        f"Committee {committee_id}",
                        'Joint',
                        f"https://malegislature.gov/Committees/{committee_id}",
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                else:
                    cursor.execute('''
                        INSERT OR IGNORE INTO committees 
                        (committee_id, name, chamber, url, updated_at)
                        VALUES (?, ?, ?, ?, ?)
                    ''', (
                        committee_id,
                        f"Committee {committee_id}",
                        'Joint',
                        f"https://malegislature.gov/Committees/{committee_id}",
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                logger.info(f"Committee {committee_id} created")
            else:
                logger.info(f"Committee {committee_id} exists")
            
            imported_count = 0
            
            for bill in bills_data:
                logger.debug(f"Importing bill: {bill.get('bill_id')}")
                # Upsert bill basic info
                if db_type == 'postgresql':
                    # PostgreSQL: Use INSERT ... ON CONFLICT ... DO UPDATE
                    cursor.execute(f'''
                        INSERT INTO bills (bill_id, bill_title, bill_url, updated_at)
                        VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder})
                        ON CONFLICT (bill_id) DO UPDATE SET
                            bill_title = EXCLUDED.bill_title,
                            bill_url = EXCLUDED.bill_url,
                            updated_at = EXCLUDED.updated_at
                    ''',
                    (
                        bill.get('bill_id'),
                        bill.get('bill_title'),
                        bill.get('bill_url'),
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                else:
                    # SQLite: Use INSERT OR REPLACE
                    cursor.execute(
                        'INSERT OR REPLACE INTO bills '
                        '(bill_id, bill_title, bill_url, updated_at) '
                        'VALUES (?, ?, ?, ?)',
                        (
                            bill.get('bill_id'),
                            bill.get('bill_title'),
                            bill.get('bill_url'),
                            datetime.utcnow().isoformat() + 'Z'
                        ))

                # Insert compliance record
                if db_type == 'postgresql':
                    cursor.execute(f'''
                        INSERT INTO bill_compliance (
                            committee_id, bill_id, hearing_date, deadline_60, 
                            effective_deadline, extension_order_url, extension_date, 
                            reported_out, summary_present, summary_url, 
                            votes_present, votes_url, state, reason, 
                            notice_status, notice_gap_days, announcement_date, 
                            scheduled_hearing_date, generated_at
                        ) VALUES (
                            {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, 
                            {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, 
                            {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, 
                            {placeholder}, {placeholder}, {placeholder}, {placeholder}
                        )
                    ''',
                    (
                        committee_id,
                        bill.get('bill_id'),
                        bill.get('hearing_date'),
                        bill.get('deadline_60'),
                        bill.get('effective_deadline'),
                        bill.get('extension_order_url'),
                        bill.get('extension_date'),
                        1 if bill.get('reported_out') else 0,
                        1 if bill.get('summary_present') else 0,
                        bill.get('summary_url'),
                        1 if bill.get('votes_present') else 0,
                        bill.get('votes_url'),
                        bill.get('state', 'unknown'),
                        bill.get('reason', ''),
                        bill.get('notice_status'),
                        bill.get('notice_gap_days'),
                        bill.get('announcement_date'),
                        bill.get('scheduled_hearing_date'),
                        datetime.utcnow().isoformat() + 'Z'
                    ))
                else:
                    cursor.execute(
                        'INSERT INTO bill_compliance ('
                        'committee_id, bill_id, hearing_date, deadline_60, '
                        'effective_deadline, extension_order_url, extension_date, '
                        'reported_out, summary_present, summary_url, '
                        'votes_present, votes_url, state, reason, '
                        'notice_status, notice_gap_days, announcement_date, '
                        'scheduled_hearing_date, generated_at) '
                        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                        (
                            committee_id,
                            bill.get('bill_id'),
                            bill.get('hearing_date'),
                            bill.get('deadline_60'),
                            bill.get('effective_deadline'),
                            bill.get('extension_order_url'),
                            bill.get('extension_date'),
                            1 if bill.get('reported_out') else 0,
                            1 if bill.get('summary_present') else 0,
                            bill.get('summary_url'),
                            1 if bill.get('votes_present') else 0,
                            bill.get('votes_url'),
                            bill.get('state', 'unknown'),
                            bill.get('reason', ''),
                            bill.get('notice_status'),
                            bill.get('notice_gap_days'),
                            bill.get('announcement_date'),
                            bill.get('scheduled_hearing_date'),
                            datetime.utcnow().isoformat() + 'Z'
                        ))
                imported_count += 1

            # Store diff_report and analysis metadata if present
            if diff_report is not None or analysis is not None:
                logger.info("Storing scan metadata (diff_report and/or analysis)")
                try:
                    scan_date = datetime.utcnow().isoformat() + 'Z'
                    
                    # Serialize diff_report to JSON string for storage
                    diff_report_json = None
                    if diff_report is not None:
                        diff_report_json = json.dumps(diff_report)
                    
                    if db_type == 'postgresql':
                        # PostgreSQL: Store as JSONB (cast string to jsonb)
                        cursor.execute(f'''
                            INSERT INTO compliance_scan_metadata 
                            (committee_id, scan_date, diff_report, analysis)
                            VALUES ({placeholder}, {placeholder}, {placeholder}::jsonb, {placeholder})
                        ''', (
                            committee_id,
                            scan_date,
                            diff_report_json,
                            analysis
                        ))
                    else:
                        # SQLite: Store as TEXT
                        cursor.execute('''
                            INSERT INTO compliance_scan_metadata 
                            (committee_id, scan_date, diff_report, analysis)
                            VALUES (?, ?, ?, ?)
                        ''', (
                            committee_id,
                            scan_date,
                            diff_report_json,
                            analysis
                        ))
                    logger.info(f"Successfully stored scan metadata for committee {committee_id}")
                except Exception as metadata_error:
                    logger.error(f"Failed to store scan metadata for committee {committee_id}: {str(metadata_error)}", exc_info=True)
                    # Don't fail the whole import if metadata storage fails

            conn.commit()  # Explicit commit
            logger.info(f"Successfully imported {imported_count} bills for committee {committee_id}")
            return {
                "status": "success",
                "message": f"Successfully imported {imported_count} bills for committee {committee_id}",
                "imported_count": imported_count
            }

        except Exception as e:
            logger.error(f"Compliance report import failed: {str(e)}", exc_info=True)
            conn.rollback()
            return {
                "status": "error",
                "message": f"Database error: {str(e)}"
            }

# Create the Flask app instance for Gunicorn
app = create_app()

# For direct execution
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


