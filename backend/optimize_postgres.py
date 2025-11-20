#!/usr/bin/env python3
"""
PostgreSQL Performance Optimization Script for Beacon Hill Tracker

This script implements performance optimizations for heavy ROW_NUMBER() and DELETE queries:
1. Creates optimized index for window partition pattern
2. Creates materialized view for latest bills
3. Provides optimized cleanup query
4. Adds maintenance utilities

Usage:
    python backend/optimize_postgres.py [--create-index] [--create-view] [--refresh-view] [--vacuum]
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import get_db_connection, get_database_type

# Load environment variables
load_dotenv()


def create_partition_index():
    """Create optimized index for ROW_NUMBER() window partition pattern (non-blocking)"""
    db_type = get_database_type()
    if db_type != 'postgresql':
        print("⚠️  This optimization is for PostgreSQL only. Current database type:", db_type)
        return False
    
    print("\n" + "="*60)
    print("CREATING PARTITION INDEX (CONCURRENTLY)")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check if index already exists
        cursor.execute('''
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'bill_compliance' 
                AND indexname = 'bc_latest_idx'
            )
        ''')
        exists = cursor.fetchone()[0]
        
        if exists:
            print("✅ Index 'bc_latest_idx' already exists")
            return True
        
        # Create the optimized index CONCURRENTLY to avoid table lock
        # Note: CONCURRENTLY cannot be used with IF NOT EXISTS, so we check first
        # Using generated_at (actual column name) instead of updated_at
        print("Creating index concurrently (this may take a while on large tables)...")
        print("   This will not lock the table during creation.")
        
        try:
            cursor.execute('''
                CREATE INDEX CONCURRENTLY bc_latest_idx
                ON bill_compliance (bill_id, committee_id, generated_at DESC NULLS LAST)
            ''')
            print("✅ Created index: bc_latest_idx (concurrent)")
            print("   This index optimizes ROW_NUMBER() OVER (PARTITION BY bill_id, committee_id ORDER BY generated_at DESC)")
            print("   NULLS LAST ensures NULL generated_at values are sorted last")
        except Exception as e:
            print(f"⚠️  Error creating index: {e}")
            print("   Index may already exist or be in progress. Check status with --status")
            return False
        
        # Verify index was created
        cursor.execute('''
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'bill_compliance' 
            AND indexname = 'bc_latest_idx'
        ''')
        result = cursor.fetchone()
        if result:
            print(f"   Index definition: {result[1]}")
        
        return True


def create_materialized_view():
    """Create materialized view for latest bills with proper unique index"""
    db_type = get_database_type()
    if db_type != 'postgresql':
        print("⚠️  This optimization is for PostgreSQL only. Current database type:", db_type)
        return False
    
    print("\n" + "="*60)
    print("CREATING MATERIALIZED VIEW")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Drop existing view if it exists (to ensure clean recreation)
        cursor.execute('''
            DROP MATERIALIZED VIEW IF EXISTS latest_bills_mv CASCADE
        ''')
        
        # Create materialized view with DISTINCT ON and proper ordering
        # NULLS LAST ensures NULL generated_at values are sorted last
        cursor.execute('''
            CREATE MATERIALIZED VIEW latest_bills_mv AS
            SELECT DISTINCT ON (bill_id, committee_id)
                bc.id,
                bc.committee_id,
                bc.bill_id,
                bc.hearing_date,
                bc.deadline_60,
                bc.effective_deadline,
                bc.extension_order_url,
                bc.extension_date,
                bc.reported_out,
                bc.summary_present,
                bc.summary_url,
                bc.votes_present,
                bc.votes_url,
                bc.state,
                bc.reason,
                bc.notice_status,
                bc.notice_gap_days,
                bc.announcement_date,
                bc.scheduled_hearing_date,
                bc.generated_at
            FROM bill_compliance bc
            ORDER BY bill_id, committee_id, generated_at DESC NULLS LAST
        ''')
        
        print("✅ Created materialized view: latest_bills_mv")
        
        # REQUIRED: Create unique index for concurrent refresh
        # This MUST exist before REFRESH MATERIALIZED VIEW CONCURRENTLY will work
        cursor.execute('''
            CREATE UNIQUE INDEX latest_bills_mv_uq
            ON latest_bills_mv (bill_id, committee_id)
        ''')
        print("✅ Created unique index: latest_bills_mv_uq (required for concurrent refresh)")
        
        # Create additional indexes for query performance
        cursor.execute('''
            CREATE INDEX latest_bills_mv_committee_idx
            ON latest_bills_mv (committee_id)
        ''')
        print("✅ Created index: latest_bills_mv_committee_idx")
        
        # Get row count
        cursor.execute('SELECT COUNT(*) FROM latest_bills_mv')
        count = cursor.fetchone()[0]
        print(f"   Materialized view contains {count:,} rows")
        
        return True


def refresh_materialized_view():
    """Refresh the materialized view (use CONCURRENTLY to avoid locking)"""
    db_type = get_database_type()
    if db_type != 'postgresql':
        print("⚠️  This optimization is for PostgreSQL only. Current database type:", db_type)
        return False
    
    print("\n" + "="*60)
    print("REFRESHING MATERIALIZED VIEW")
    print("="*60)
    
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
            print("⚠️  Materialized view 'latest_bills_mv' does not exist.")
            print("   Run with --create-view first to create it.")
            return False
        
        # Refresh concurrently (requires unique index, which we have on (bill_id, committee_id))
        try:
            cursor.execute('REFRESH MATERIALIZED VIEW CONCURRENTLY latest_bills_mv')
            print("✅ Refreshed materialized view (concurrent)")
        except Exception as e:
            # If concurrent refresh fails (e.g., no unique index), try regular refresh
            print(f"⚠️  Concurrent refresh failed: {e}")
            print("   Attempting regular refresh (may lock table)...")
            cursor.execute('REFRESH MATERIALIZED VIEW latest_bills_mv')
            print("✅ Refreshed materialized view (regular)")
        
        # Get row count
        cursor.execute('SELECT COUNT(*) FROM latest_bills_mv')
        count = cursor.fetchone()[0]
        print(f"   Materialized view now contains {count:,} rows")
        
        return True


def run_vacuum_analyze():
    """Run VACUUM ANALYZE on bill_compliance table"""
    db_type = get_database_type()
    if db_type != 'postgresql':
        print("⚠️  This optimization is for PostgreSQL only. Current database type:", db_type)
        return False
    
    print("\n" + "="*60)
    print("RUNNING VACUUM ANALYZE")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        print("Running VACUUM ANALYZE on bill_compliance...")
        cursor.execute('VACUUM ANALYZE bill_compliance')
        print("✅ VACUUM ANALYZE completed on bill_compliance")
        
        # Also analyze the materialized view
        print("Running ANALYZE on latest_bills_mv...")
        cursor.execute('ANALYZE latest_bills_mv')
        print("✅ ANALYZE completed on latest_bills_mv")
        print("   This updates table statistics for better query planning")
        
        return True


def get_optimization_status():
    """Check current optimization status"""
    db_type = get_database_type()
    if db_type != 'postgresql':
        print("⚠️  This optimization is for PostgreSQL only. Current database type:", db_type)
        return
    
    print("\n" + "="*60)
    print("OPTIMIZATION STATUS")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Check for partition index (new name)
        cursor.execute('''
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'bill_compliance' 
                AND indexname = 'bc_latest_idx'
            )
        ''')
        has_index = cursor.fetchone()[0]
        print(f"Partition Index (bc_latest_idx): {'✅ Exists' if has_index else '❌ Missing'}")
        
        # Also check for old index name for backwards compatibility
        cursor.execute('''
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = 'bill_compliance' 
                AND indexname = 'bill_compliance_partition_idx'
            )
        ''')
        has_old_index = cursor.fetchone()[0]
        if has_old_index:
            print(f"   (Old index 'bill_compliance_partition_idx' also exists - consider dropping)")
        
        # Check for materialized view
        cursor.execute('''
            SELECT EXISTS (
                SELECT 1 FROM pg_matviews 
                WHERE matviewname = 'latest_bills_mv'
            )
        ''')
        has_view = cursor.fetchone()[0]
        print(f"Materialized View: {'✅ Exists' if has_view else '❌ Missing'}")
        
        if has_view:
            cursor.execute('SELECT COUNT(*) FROM latest_bills_mv')
            view_count = cursor.fetchone()[0]
            cursor.execute('SELECT COUNT(*) FROM bill_compliance')
            table_count = cursor.fetchone()[0]
            print(f"   View rows: {view_count:,}")
            print(f"   Table rows: {table_count:,}")
        
        # Check table statistics
        cursor.execute('''
            SELECT n_live_tup, n_dead_tup, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
            FROM pg_stat_user_tables
            WHERE relname = 'bill_compliance'
        ''')
        stats = cursor.fetchone()
        if stats:
            print(f"\nTable Statistics:")
            print(f"   Live tuples: {stats[0]:,}")
            print(f"   Dead tuples: {stats[1]:,}")
            if stats[2]:
                print(f"   Last vacuum: {stats[2]}")
            if stats[4]:
                print(f"   Last analyze: {stats[4]}")


def main():
    parser = argparse.ArgumentParser(
        description='PostgreSQL Performance Optimization Script',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Check current optimization status
  python backend/optimize_postgres.py --status
  
  # Create all optimizations
  python backend/optimize_postgres.py --create-index --create-view
  
  # Refresh materialized view after data ingest
  python backend/optimize_postgres.py --refresh-view
  
  # Run maintenance
  python backend/optimize_postgres.py --vacuum
  
  # Do everything
  python backend/optimize_postgres.py --all
        """
    )
    parser.add_argument('--create-index', action='store_true',
                       help='Create optimized partition index')
    parser.add_argument('--create-view', action='store_true',
                       help='Create materialized view for latest bills')
    parser.add_argument('--refresh-view', action='store_true',
                       help='Refresh the materialized view')
    parser.add_argument('--vacuum', action='store_true',
                       help='Run VACUUM ANALYZE on bill_compliance')
    parser.add_argument('--status', action='store_true',
                       help='Show current optimization status')
    parser.add_argument('--all', action='store_true',
                       help='Create index, view, and run vacuum')
    
    args = parser.parse_args()
    
    if not any([args.create_index, args.create_view, args.refresh_view, 
                args.vacuum, args.status, args.all]):
        parser.print_help()
        return
    
    print("PostgreSQL Performance Optimization")
    print("="*60)
    
    db_type = get_database_type()
    if db_type != 'postgresql':
        print(f"⚠️  Warning: Current database type is '{db_type}', not PostgreSQL.")
        print("   These optimizations are PostgreSQL-specific.")
        response = input("Continue anyway? (y/N): ")
        if response.lower() != 'y':
            return
    
    try:
        if args.status or args.all:
            get_optimization_status()
        
        if args.create_index or args.all:
            create_partition_index()
        
        if args.create_view or args.all:
            create_materialized_view()
        
        if args.refresh_view:
            refresh_materialized_view()
        
        if args.vacuum or args.all:
            run_vacuum_analyze()
        
        print("\n" + "="*60)
        print("✅ Optimization complete!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during optimization: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

