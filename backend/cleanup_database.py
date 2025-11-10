#!/usr/bin/env python3
"""
Database Cleanup Script for Beacon Hill Tracker

This script helps reduce database size by:
1. Keeping only the latest entry per committee per day in bill_compliance
2. Cleaning up old compliance_scan_metadata entries (keeping only latest per day)
3. Optionally archiving very old data

Usage:
    python backend/cleanup_database.py [--dry-run] [--keep-days=30] [--archive-older-than=365]
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from database import get_db_connection, get_database_type

# Load environment variables
load_dotenv()


def cleanup_bill_compliance(dry_run=True, keep_days=None):
    """
    Delete duplicate bill_compliance entries, keeping only the latest per committee per day.
    
    Args:
        dry_run: If True, only show what would be deleted without actually deleting
        keep_days: If specified, only process entries older than this many days
    """
    db_type = get_database_type()
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    print("\n" + "="*60)
    print("CLEANING UP bill_compliance TABLE")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # First, get statistics
        cursor.execute('SELECT COUNT(*) FROM bill_compliance')
        total_before = cursor.fetchone()[0]
        print(f"Total entries before cleanup: {total_before:,}")
        
        # Get count of entries that would be kept (latest per committee per day)
        if keep_days:
            cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
            if db_type == 'postgresql':
                date_filter = f"AND generated_at < {placeholder}"
                date_params = (cutoff_date,)
            else:
                # SQLite stores as ISO string
                cutoff_date_str = cutoff_date.isoformat() + 'Z'
                date_filter = f"AND generated_at < {placeholder}"
                date_params = (cutoff_date_str,)
        else:
            date_filter = ""
            date_params = ()
        
        # Count entries to keep
        if db_type == 'postgresql':
            cursor.execute(f'''
                SELECT COUNT(*)
                FROM (
                    SELECT DISTINCT ON (committee_id, bill_id, DATE(generated_at))
                        id
                    FROM bill_compliance
                    WHERE 1=1 {date_filter}
                    ORDER BY committee_id, bill_id, DATE(generated_at), generated_at DESC
                ) latest
            ''', date_params)
        else:
            cursor.execute(f'''
                SELECT COUNT(*)
                FROM (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY committee_id, bill_id, DATE(generated_at)
                                   ORDER BY generated_at DESC
                               ) as rn
                        FROM bill_compliance
                        WHERE 1=1 {date_filter}
                    )
                    WHERE rn = 1
                )
            ''', date_params)
        
        to_keep = cursor.fetchone()[0]
        to_delete = total_before - to_keep
        print(f"Entries to keep (latest per committee/bill/day): {to_keep:,}")
        print(f"Entries to delete: {to_delete:,}")
        
        if to_delete == 0:
            print("✅ No cleanup needed!")
            return 0
        
        if dry_run:
            print(f"\n🔍 DRY RUN: Would delete {to_delete:,} entries")
            print("   Run without --dry-run to actually delete")
            return to_delete
        
        # Actually delete duplicates
        print(f"\n🗑️  Deleting {to_delete:,} duplicate entries...")
        
        if db_type == 'postgresql':
            # PostgreSQL: Delete all except the latest per committee/bill/day
            cursor.execute(f'''
                DELETE FROM bill_compliance
                WHERE id NOT IN (
                    SELECT DISTINCT ON (committee_id, bill_id, DATE(generated_at))
                        id
                    FROM bill_compliance
                    WHERE 1=1 {date_filter}
                    ORDER BY committee_id, bill_id, DATE(generated_at), generated_at DESC
                )
                AND 1=1 {date_filter}
            ''', date_params)
        else:
            # SQLite: Delete all except the latest per committee/bill/day
            cursor.execute(f'''
                DELETE FROM bill_compliance
                WHERE id NOT IN (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY committee_id, bill_id, DATE(generated_at)
                                   ORDER BY generated_at DESC
                               ) as rn
                        FROM bill_compliance
                        WHERE 1=1 {date_filter}
                    )
                    WHERE rn = 1
                )
            ''', date_params)
        
        deleted_count = cursor.rowcount
        conn.commit()
        
        # Verify
        cursor.execute('SELECT COUNT(*) FROM bill_compliance')
        total_after = cursor.fetchone()[0]
        
        print(f"✅ Deleted {deleted_count:,} entries")
        print(f"   Total entries after cleanup: {total_after:,}")
        print(f"   Space saved: {to_delete:,} rows")
        
        return deleted_count


def cleanup_scan_metadata(dry_run=True, keep_days=None):
    """
    Clean up compliance_scan_metadata, keeping only the latest entry per committee per day.
    
    Args:
        dry_run: If True, only show what would be deleted without actually deleting
        keep_days: If specified, only process entries older than this many days
    """
    db_type = get_database_type()
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    print("\n" + "="*60)
    print("CLEANING UP compliance_scan_metadata TABLE")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # First, get statistics
        cursor.execute('SELECT COUNT(*) FROM compliance_scan_metadata')
        total_before = cursor.fetchone()[0]
        print(f"Total entries before cleanup: {total_before:,}")
        
        if keep_days:
            cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
            if db_type == 'postgresql':
                date_filter = f"AND scan_date < {placeholder}"
                date_params = (cutoff_date,)
            else:
                # SQLite stores as ISO string
                cutoff_date_str = cutoff_date.isoformat() + 'Z'
                date_filter = f"AND scan_date < {placeholder}"
                date_params = (cutoff_date_str,)
        else:
            date_filter = ""
            date_params = ()
        
        # Count entries to keep (latest per committee per day)
        if db_type == 'postgresql':
            cursor.execute(f'''
                SELECT COUNT(*)
                FROM (
                    SELECT DISTINCT ON (committee_id, DATE(scan_date))
                        id
                    FROM compliance_scan_metadata
                    WHERE 1=1 {date_filter}
                    ORDER BY committee_id, DATE(scan_date), scan_date DESC
                ) latest
            ''', date_params)
        else:
            cursor.execute(f'''
                SELECT COUNT(*)
                FROM (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY committee_id, DATE(scan_date)
                                   ORDER BY scan_date DESC
                               ) as rn
                        FROM compliance_scan_metadata
                        WHERE 1=1 {date_filter}
                    )
                    WHERE rn = 1
                )
            ''', date_params)
        
        to_keep = cursor.fetchone()[0]
        to_delete = total_before - to_keep
        print(f"Entries to keep (latest per committee/day): {to_keep:,}")
        print(f"Entries to delete: {to_delete:,}")
        
        if to_delete == 0:
            print("✅ No cleanup needed!")
            return 0
        
        if dry_run:
            print(f"\n🔍 DRY RUN: Would delete {to_delete:,} entries")
            print("   Run without --dry-run to actually delete")
            return to_delete
        
        # Actually delete duplicates
        print(f"\n🗑️  Deleting {to_delete:,} duplicate entries...")
        
        if db_type == 'postgresql':
            cursor.execute(f'''
                DELETE FROM compliance_scan_metadata
                WHERE id NOT IN (
                    SELECT DISTINCT ON (committee_id, DATE(scan_date))
                        id
                    FROM compliance_scan_metadata
                    WHERE 1=1 {date_filter}
                    ORDER BY committee_id, DATE(scan_date), scan_date DESC
                )
                AND 1=1 {date_filter}
            ''', date_params)
        else:
            cursor.execute(f'''
                DELETE FROM compliance_scan_metadata
                WHERE id NOT IN (
                    SELECT id
                    FROM (
                        SELECT id,
                               ROW_NUMBER() OVER (
                                   PARTITION BY committee_id, DATE(scan_date)
                                   ORDER BY scan_date DESC
                               ) as rn
                        FROM compliance_scan_metadata
                        WHERE 1=1 {date_filter}
                    )
                    WHERE rn = 1
                )
            ''', date_params)
        
        deleted_count = cursor.rowcount
        conn.commit()
        
        # Verify
        cursor.execute('SELECT COUNT(*) FROM compliance_scan_metadata')
        total_after = cursor.fetchone()[0]
        
        print(f"✅ Deleted {deleted_count:,} entries")
        print(f"   Total entries after cleanup: {total_after:,}")
        print(f"   Space saved: {to_delete:,} rows")
        
        return deleted_count


def get_database_stats():
    """Print current database statistics"""
    print("\n" + "="*60)
    print("DATABASE STATISTICS")
    print("="*60)
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # bill_compliance stats
        cursor.execute('SELECT COUNT(*) FROM bill_compliance')
        bc_total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(DISTINCT committee_id || '|' || bill_id || '|' || DATE(generated_at))
            FROM bill_compliance
        ''')
        bc_unique = cursor.fetchone()[0]
        
        print(f"\nbill_compliance:")
        print(f"  Total entries: {bc_total:,}")
        print(f"  Unique (committee/bill/day): {bc_unique:,}")
        print(f"  Duplicates: {bc_total - bc_unique:,}")
        
        # compliance_scan_metadata stats
        cursor.execute('SELECT COUNT(*) FROM compliance_scan_metadata')
        csm_total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT COUNT(DISTINCT committee_id || '|' || DATE(scan_date))
            FROM compliance_scan_metadata
        ''')
        csm_unique = cursor.fetchone()[0]
        
        print(f"\ncompliance_scan_metadata:")
        print(f"  Total entries: {csm_total:,}")
        print(f"  Unique (committee/day): {csm_unique:,}")
        print(f"  Duplicates: {csm_total - csm_unique:,}")
        
        # Date ranges
        cursor.execute('SELECT MIN(generated_at), MAX(generated_at) FROM bill_compliance')
        bc_dates = cursor.fetchone()
        if bc_dates[0]:
            print(f"\nDate range (bill_compliance):")
            print(f"  Oldest: {bc_dates[0]}")
            print(f"  Newest: {bc_dates[1]}")


def main():
    parser = argparse.ArgumentParser(
        description='Clean up database by removing duplicate entries',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run to see what would be deleted
  python backend/cleanup_database.py --dry-run
  
  # Actually clean up (keeping only latest per day)
  python backend/cleanup_database.py
  
  # Clean up only entries older than 30 days
  python backend/cleanup_database.py --keep-days=30
  
  # Just show statistics
  python backend/cleanup_database.py --stats-only
        """
    )
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be deleted without actually deleting')
    parser.add_argument('--keep-days', type=int, default=None,
                       help='Only process entries older than this many days')
    parser.add_argument('--stats-only', action='store_true',
                       help='Only show database statistics, do not clean')
    
    args = parser.parse_args()
    
    print("Beacon Hill Tracker - Database Cleanup Script")
    print("="*60)
    
    # Show stats first
    get_database_stats()
    
    if args.stats_only:
        print("\n✅ Statistics complete. Use without --stats-only to perform cleanup.")
        return
    
    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No changes will be made")
    
    if args.keep_days:
        print(f"\n📅 Only processing entries older than {args.keep_days} days")
    
    # Perform cleanup
    try:
        deleted_bc = cleanup_bill_compliance(dry_run=args.dry_run, keep_days=args.keep_days)
        deleted_csm = cleanup_scan_metadata(dry_run=args.dry_run, keep_days=args.keep_days)
        
        total_deleted = deleted_bc + deleted_csm
        
        print("\n" + "="*60)
        print("CLEANUP SUMMARY")
        print("="*60)
        print(f"Total entries deleted: {total_deleted:,}")
        
        if args.dry_run:
            print("\n⚠️  This was a dry run. Run without --dry-run to actually delete.")
        else:
            print("\n✅ Cleanup complete!")
            print("\n💡 Tip: Run this script regularly (e.g., weekly) to keep database size manageable")
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

