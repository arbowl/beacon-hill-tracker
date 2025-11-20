"""
Database connection utilities for Beacon Hill Compliance Tracker
Supports both SQLite (development) and PostgreSQL (production)
"""

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path


def get_database_type():
    """Determine database type from DATABASE_URL environment variable"""
    db_url = os.getenv('DATABASE_URL', 'sqlite:///compliance_tracker.db')
    if db_url.startswith('postgres'):
        return 'postgresql'
    return 'sqlite'


@contextmanager
def get_db_connection():
    """
    Context manager for database connections.
    Automatically uses PostgreSQL or SQLite based on DATABASE_URL.
    
    Usage:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ...")
            results = cursor.fetchall()
    """
    db_url = os.getenv('DATABASE_URL', 'sqlite:///compliance_tracker.db')
    db_type = get_database_type()
    
    if db_type == 'postgresql':
        import psycopg2
        import psycopg2.extras
        
        # Render provides postgres://, but psycopg2 needs postgresql://
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        
        # Connect with dictionary cursor for easy column access
        conn = psycopg2.connect(db_url)
        # Note: psycopg2 doesn't have row_factory, handle in queries if needed
        
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        # SQLite for local development
        # Extract path from sqlite:///path
        if db_url.startswith('sqlite:///'):
            db_path = db_url.replace('sqlite:///', '')
        else:
            db_path = db_url
            
        # Create parent directory if it doesn't exist
        db_file = Path(db_path)
        db_file.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def init_compliance_database():
    """Initialize the compliance database schema (works for both SQLite and PostgreSQL)"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        db_type = get_database_type()
        
        # Adjust schema based on database type
        if db_type == 'postgresql':
            # PostgreSQL-specific schema
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS committees (
                    committee_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    chamber TEXT NOT NULL CHECK(chamber IN ('Joint', 'House', 'Senate')),
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

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bills (
                    bill_id TEXT PRIMARY KEY,
                    bill_title TEXT,
                    bill_url TEXT,
                    updated_at TEXT
                )
            ''')

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bill_compliance (
                    id SERIAL PRIMARY KEY,
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
                    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (committee_id) REFERENCES committees(committee_id) ON DELETE CASCADE,
                    FOREIGN KEY (bill_id) REFERENCES bills(bill_id) ON DELETE CASCADE
                )
            ''')
            
            # Create indexes for better query performance
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_committee 
                ON bill_compliance(committee_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_bill 
                ON bill_compliance(bill_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_date 
                ON bill_compliance(generated_at DESC)
            ''')
            
            # Composite index for window function optimization (ROW_NUMBER OVER PARTITION BY)
            # This dramatically improves performance for stats queries that deduplicate bills
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_bill_committee_date 
                ON bill_compliance(bill_id, committee_id, generated_at DESC)
            ''')
            
            # Index for state filtering (PostgreSQL)
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_state 
                ON bill_compliance(state)
            ''')
            
            # Changelog tables (PostgreSQL)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS changelog_versions (
                    id SERIAL PRIMARY KEY,
                    version TEXT NOT NULL UNIQUE,
                    date TEXT NOT NULL,
                    user_agent TEXT,
                    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS changelog_entries (
                    id SERIAL PRIMARY KEY,
                    version_id INTEGER NOT NULL,
                    category TEXT NOT NULL CHECK(category IN ('added', 'changed', 'fixed', 'removed', 'deprecated', 'security')),
                    description TEXT NOT NULL,
                    FOREIGN KEY (version_id) REFERENCES changelog_versions(id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_changelog_versions_date 
                ON changelog_versions(received_at DESC)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_changelog_entries_version 
                ON changelog_entries(version_id)
            ''')
            
            # Compliance scan metadata table (stores diff_report and analysis)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS compliance_scan_metadata (
                    id SERIAL PRIMARY KEY,
                    committee_id TEXT NOT NULL,
                    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    diff_report JSONB,
                    analysis TEXT,
                    FOREIGN KEY (committee_id) REFERENCES committees(committee_id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_compliance_scan_metadata_committee 
                ON compliance_scan_metadata(committee_id, scan_date DESC)
            ''')
            
            # Global stats cache table (stores pre-calculated global statistics)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS global_stats_cache (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    total_committees INTEGER NOT NULL,
                    total_bills INTEGER NOT NULL,
                    compliant_bills INTEGER NOT NULL,
                    incomplete_bills INTEGER NOT NULL,
                    non_compliant_bills INTEGER NOT NULL,
                    unknown_bills INTEGER NOT NULL,
                    overall_compliance_rate NUMERIC(5, 2) NOT NULL,
                    latest_report_date TIMESTAMP,
                    data_timestamp TIMESTAMP NOT NULL,
                    cache_generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT single_row CHECK (id = 1)
                )
            ''')
            
        else:
            # SQLite schema (original)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS committees (
                    committee_id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    chamber TEXT NOT NULL CHECK(chamber IN ('Joint', 'House', 'Senate')),
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

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bills (
                    bill_id TEXT PRIMARY KEY,
                    bill_title TEXT,
                    bill_url TEXT,
                    updated_at TEXT
                )
            ''')

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
            
            # Create indexes for better query performance (SQLite)
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_committee 
                ON bill_compliance(committee_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_bill 
                ON bill_compliance(bill_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_date 
                ON bill_compliance(generated_at DESC)
            ''')
            
            # Composite index for window function optimization (ROW_NUMBER OVER PARTITION BY)
            # This dramatically improves performance for stats queries that deduplicate bills
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_bill_committee_date 
                ON bill_compliance(bill_id, committee_id, generated_at DESC)
            ''')
            
            # Index for state filtering (SQLite)
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bill_compliance_state 
                ON bill_compliance(state)
            ''')
            
            # Changelog tables (SQLite)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS changelog_versions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version TEXT NOT NULL UNIQUE,
                    date TEXT NOT NULL,
                    user_agent TEXT,
                    received_at TEXT DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS changelog_entries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    version_id INTEGER NOT NULL,
                    category TEXT NOT NULL CHECK(category IN ('added', 'changed', 'fixed', 'removed', 'deprecated', 'security')),
                    description TEXT NOT NULL,
                    FOREIGN KEY (version_id) REFERENCES changelog_versions(id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_changelog_versions_date 
                ON changelog_versions(received_at DESC)
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_changelog_entries_version 
                ON changelog_entries(version_id)
            ''')
            
            # Compliance scan metadata table (stores diff_report and analysis)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS compliance_scan_metadata (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    committee_id TEXT NOT NULL,
                    scan_date TEXT DEFAULT CURRENT_TIMESTAMP,
                    diff_report TEXT,
                    analysis TEXT,
                    FOREIGN KEY (committee_id) REFERENCES committees(committee_id) ON DELETE CASCADE
                )
            ''')
            
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_compliance_scan_metadata_committee 
                ON compliance_scan_metadata(committee_id, scan_date DESC)
            ''')
            
            # Global stats cache table (stores pre-calculated global statistics)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS global_stats_cache (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    total_committees INTEGER NOT NULL,
                    total_bills INTEGER NOT NULL,
                    compliant_bills INTEGER NOT NULL,
                    incomplete_bills INTEGER NOT NULL,
                    non_compliant_bills INTEGER NOT NULL,
                    unknown_bills INTEGER NOT NULL,
                    overall_compliance_rate NUMERIC(5, 2) NOT NULL,
                    latest_report_date TEXT,
                    data_timestamp TEXT NOT NULL,
                    cache_generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT single_row CHECK (id = 1)
                )
            ''')
        
        print(f"✅ Compliance database schema initialized ({db_type})")


def refresh_latest_bills_materialized_view():
    """
    Refresh the latest_bills_mv materialized view.
    Should be called after data ingest operations to keep the view up to date.
    
    Returns:
        bool: True if successful, False otherwise
    """
    db_type = get_database_type()
    if db_type != 'postgresql':
        # Materialized views are PostgreSQL-only, skip for SQLite
        return True
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Check if view exists
            cursor.execute('''
                SELECT EXISTS (
                    SELECT 1 FROM pg_matviews 
                    WHERE matviewname = 'latest_bills_mv'
                )
            ''')
            exists = cursor.fetchone()[0]
            
            if not exists:
                # View doesn't exist yet, that's okay
                return True
            
            # Try concurrent refresh first (requires unique index)
            try:
                cursor.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY latest_bills_mv')
                # Note: During concurrent refresh, readers see the OLD view until refresh completes
                # Application caches should be invalidated after refresh
            except Exception as e:
                # If concurrent fails (e.g., no unique index), use regular refresh
                # Regular refresh will briefly lock the view
                cursor.execute('REFRESH MATERIALIZED VIEW latest_bills_mv')
            
            return True
    except Exception:
        # Don't fail the main operation if view refresh fails
        return False


# Export public functions
__all__ = ['get_db_connection', 'get_database_type', 'init_compliance_database', 'refresh_latest_bills_materialized_view']

