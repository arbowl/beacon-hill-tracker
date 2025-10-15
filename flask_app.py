"""
Beacon Hill Compliance Tracker - Flask Ingest API
Receives JSON data via POST and stores it in SQLite3 database.
"""

from flask import Flask, request, jsonify
import sqlite3
import json
from datetime import datetime

app = Flask(__name__)
DB_PATH = 'compliance_tracker.db'


# ==========================================================================
# Database Initialization
# ==========================================================================


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
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_committees_chamber '
        'ON committees(chamber)')

    # Create bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bills (
            bill_id TEXT PRIMARY KEY,
            bill_title TEXT,
            bill_url TEXT,
            updated_at TEXT
        )
    ''')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bills_title '
        'ON bills(bill_title)')

    # Create bill_details table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bill_details (
            bill_id TEXT PRIMARY KEY,
            extension_date TEXT,
            extension_url TEXT,
            extension_updated_at TEXT,
            announcement_date TEXT,
            scheduled_hearing_date TEXT,
            hearing_updated_at TEXT,
            summary_module TEXT,
            summary_confirmed INTEGER,
            summary_present INTEGER,
            summary_location TEXT,
            summary_needs_review INTEGER,
            summary_source_url TEXT,
            summary_parser_module TEXT,
            summary_updated_at TEXT,
            votes_module TEXT,
            votes_confirmed INTEGER,
            votes_present INTEGER,
            votes_location TEXT,
            votes_needs_review INTEGER,
            votes_source_url TEXT,
            votes_parser_module TEXT,
            votes_updated_at TEXT,
            title_value TEXT,
            title_updated_at TEXT,
            FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
                ON DELETE CASCADE
        )
    ''')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_details_summary_present '
        'ON bill_details(summary_present)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_details_votes_present '
        'ON bill_details(votes_present)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_details_extension_date '
        'ON bill_details(extension_date)')

    # Create committee_bills table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS committee_bills (
            committee_id TEXT NOT NULL,
            bill_id TEXT NOT NULL,
            added_at TEXT DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (committee_id, bill_id),
            FOREIGN KEY (committee_id) REFERENCES committees(committee_id)
                ON DELETE CASCADE,
            FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
                ON DELETE CASCADE
        )
    ''')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_committee_bills_committee '
        'ON committee_bills(committee_id)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_committee_bills_bill '
        'ON committee_bills(bill_id)')

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
            FOREIGN KEY (committee_id) REFERENCES committees(committee_id)
                ON DELETE CASCADE,
            FOREIGN KEY (bill_id) REFERENCES bills(bill_id)
                ON DELETE CASCADE
        )
    ''')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_committee '
        'ON bill_compliance(committee_id)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_bill '
        'ON bill_compliance(bill_id)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_state '
        'ON bill_compliance(state)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_reported_out '
        'ON bill_compliance(reported_out)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_hearing_date '
        'ON bill_compliance(hearing_date)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_deadline '
        'ON bill_compliance(effective_deadline)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_bill_compliance_committee_state '
        'ON bill_compliance(committee_id, state)')

    # Create parser_statistics table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS parser_statistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            committee_id TEXT NOT NULL,
            parser_type TEXT NOT NULL CHECK(parser_type IN
                ('summary', 'votes')),
            parser_module TEXT NOT NULL,
            count INTEGER NOT NULL,
            current_streak INTEGER NOT NULL,
            first_seen TEXT NOT NULL,
            last_used TEXT NOT NULL,
            is_last_used INTEGER DEFAULT 0,
            FOREIGN KEY (committee_id) REFERENCES committees(committee_id)
                ON DELETE CASCADE
        )
    ''')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_parser_stats_committee '
        'ON parser_statistics(committee_id)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_parser_stats_type '
        'ON parser_statistics(parser_type)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_parser_stats_module '
        'ON parser_statistics(parser_module)')
    cursor.execute(
        'CREATE INDEX IF NOT EXISTS idx_parser_stats_committee_type '
        'ON parser_statistics(committee_id, parser_type)')

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


# ==========================================================================
# Data Import Functions
# ==========================================================================


def import_cache_data(cache_data):
    """Import data from cache.json structure"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Import committees
        if 'committee_contacts' in cache_data:
            for comm_id, comm_data in \
                    cache_data['committee_contacts'].items():
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
                        comm_data.get('updated_at',
                                      datetime.utcnow().isoformat() + 'Z')
                    ))

        # Import bills and bill_details
        if 'bill_parsers' in cache_data:
            for bill_id, bill_data in cache_data['bill_parsers'].items():
                # Insert basic bill info
                title = bill_data.get('title', {})
                cursor.execute(
                    'INSERT OR REPLACE INTO bills '
                    '(bill_id, bill_title, bill_url, updated_at) '
                    'VALUES (?, ?, ?, ?)',
                    (
                        bill_id,
                        title.get('value'),
                        bill_data.get('bill_url'),
                        title.get('updated_at')
                    ))

                # Insert bill details
                extensions = bill_data.get('extensions', {})
                hearing = bill_data.get('hearing_announcement', {})
                summary = bill_data.get('summary', {})
                summary_result = summary.get('result', {})
                votes = bill_data.get('votes', {})
                votes_result = votes.get('result', {})

                cursor.execute(
                    'INSERT OR REPLACE INTO bill_details '
                    'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '
                    '?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    (
                        bill_id,
                        extensions.get('extension_date'),
                        extensions.get('extension_url'),
                        extensions.get('updated_at'),
                        hearing.get('announcement_date'),
                        hearing.get('scheduled_hearing_date'),
                        hearing.get('updated_at'),
                        summary.get('module'),
                        1 if summary.get('confirmed') else 0,
                        1 if summary_result.get('present') else 0,
                        summary_result.get('location'),
                        1 if summary_result.get('needs_review') else 0,
                        summary_result.get('source_url'),
                        summary_result.get('parser_module'),
                        summary.get('updated_at'),
                        votes.get('module'),
                        1 if votes.get('confirmed') else 0,
                        1 if votes_result.get('present') else 0,
                        votes_result.get('location'),
                        1 if votes_result.get('needs_review') else 0,
                        votes_result.get('source_url'),
                        votes_result.get('parser_module'),
                        votes.get('updated_at'),
                        title.get('value'),
                        title.get('updated_at')
                    ))

        # Import committee_bills relationships
        if 'committee_bills' in cache_data:
            for comm_id, comm_data in \
                    cache_data['committee_bills'].items():
                for bill_id in comm_data.get('bills', []):
                    cursor.execute(
                        'INSERT OR IGNORE INTO committee_bills '
                        '(committee_id, bill_id) VALUES (?, ?)',
                        (comm_id, bill_id))

        # Import parser statistics
        if 'committee_parsers' in cache_data:
            for comm_id, parsers in \
                    cache_data['committee_parsers'].items():
                for parser_type in ['summary', 'votes']:
                    if parser_type in parsers:
                        last_parser = parsers.get(
                            f'{parser_type}_last_parser')
                        for module, parser_stats in \
                                parsers[parser_type].items():
                            cursor.execute(
                                'INSERT INTO parser_statistics '
                                '(committee_id, parser_type, parser_module, '
                                'count, current_streak, first_seen, '
                                'last_used, is_last_used) '
                                'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                (
                                    comm_id,
                                    parser_type,
                                    module,
                                    parser_stats.get('count', 0),
                                    parser_stats.get('current_streak', 0),
                                    parser_stats.get('first_seen', ''),
                                    parser_stats.get('last_used', ''),
                                    1 if module == last_parser else 0
                                ))

        conn.commit()
        return {
            "status": "success",
            "message": "Cache data imported successfully"
        }

    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}

    finally:
        conn.close()


def import_compliance_report(committee_id, bills_data):
    """Import compliance report data for a specific committee"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        for bill in bills_data:
            # Upsert bill basic info
            cursor.execute(
                'INSERT OR REPLACE INTO bills '
                '(bill_id, bill_title, bill_url) VALUES (?, ?, ?)',
                (
                    bill.get('bill_id'),
                    bill.get('bill_title'),
                    bill.get('bill_url')
                ))

            # Insert compliance record
            cursor.execute(
                'INSERT INTO bill_compliance '
                '(committee_id, bill_id, hearing_date, deadline_60, '
                'effective_deadline, extension_order_url, extension_date, '
                'reported_out, summary_present, summary_url, '
                'votes_present, votes_url, state, reason, '
                'notice_status, notice_gap_days, announcement_date, '
                'scheduled_hearing_date) '
                'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '
                '?, ?, ?, ?)',
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
                    bill.get('scheduled_hearing_date')
                ))

        conn.commit()
        return {
            "status": "success",
            "message": (f"Compliance report for {committee_id} "
                        "imported successfully"),
            "bills_count": len(bills_data)
        }

    except Exception as exc:
        conn.rollback()
        return {"status": "error", "message": str(exc)}

    finally:
        conn.close()


# ==========================================================================
# API Endpoints
# ==========================================================================


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "database": DB_PATH})


@app.route('/ingest/cache', methods=['POST'])
def ingest_cache():
    """
    Ingest endpoint for cache data.
    Expects cache.json structure with bill_parsers, committee_contacts, etc.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No JSON data provided"
            }), 400

        result = import_cache_data(data)
        if result['status'] == 'success':
            return jsonify(result), 200
        return jsonify(result), 500

    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON"
        }), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


@app.route('/ingest/basic', methods=['POST'])
def ingest_basic():
    """
    Ingest endpoint for basic/compliance reports.
    Expects: {"committee_id": "XXX", "run_id": "...", "items": [...]}
    Also accepts "bills" instead of "items" for backwards compatibility.
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "status": "error",
                "message": "No JSON data provided"
            }), 400

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "Expected JSON object with committee_id and items"
            }), 400

        committee_id = data.get('committee_id')
        if not committee_id:
            return jsonify({
                "status": "error",
                "message": "committee_id is required"
            }), 400

        # Accept both 'items' (client) and 'bills' (legacy) keys
        bills_data = data.get('items') or data.get('bills', [])

        if not isinstance(bills_data, list):
            return jsonify({
                "status": "error",
                "message": "items/bills must be an array"
            }), 400

        result = import_compliance_report(committee_id, bills_data)
        if result['status'] == 'success':
            return jsonify(result), 200
        return jsonify(result), 500

    except json.JSONDecodeError:
        return jsonify({
            "status": "error",
            "message": "Invalid JSON"
        }), 400
    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500




@app.route('/stats', methods=['GET'])
def get_stats():
    """Get database statistics"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM committees")
        committee_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM bills")
        bill_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM bill_compliance")
        compliance_count = cursor.fetchone()[0]

        cursor.execute("""
            SELECT state, COUNT(*)
            FROM bill_compliance
            GROUP BY state
        """)
        compliance_by_state = dict(cursor.fetchall())

        conn.close()

        return jsonify({
            "committees": committee_count,
            "bills": bill_count,
            "compliance_records": compliance_count,
            "compliance_by_state": compliance_by_state
        })

    except Exception as exc:
        return jsonify({"status": "error", "message": str(exc)}), 500


# ==========================================================================
# Main
# ==========================================================================


if __name__ == '__main__':
    # Initialize database on startup
    init_database()

    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
