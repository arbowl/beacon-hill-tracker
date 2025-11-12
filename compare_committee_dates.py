#!/usr/bin/env python3
"""
Tool to compare committee compliance between two dates and print detailed stats.

Usage:
    python compare_committee_dates.py <committee_id> <date1> <date2>
    
Example:
    python compare_committee_dates.py J10 2024-11-09 2024-11-10
    
Or run interactively:
    python compare_committee_dates.py
"""

import sys
import os
import json
from datetime import datetime, timedelta
from pathlib import Path

# Add backend directory to path to import database utilities
sys.path.insert(0, str(Path(__file__).parent / 'backend'))

from database import get_db_connection, get_database_type


def get_bills_at_date(cursor, committee_id, target_date, db_type):
    """Get bills for a committee at or before a specific date"""
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    if db_type == 'postgresql':
        cursor.execute(f'''
            WITH latest_bills AS (
                SELECT bc.*,
                       ROW_NUMBER() OVER (PARTITION BY bc.bill_id ORDER BY bc.generated_at DESC) as rn
                FROM bill_compliance bc
                WHERE bc.committee_id = {placeholder}
                  AND bc.generated_at <= {placeholder}
            )
            SELECT bill_id, hearing_date, reported_out, summary_present, 
                   votes_present, state, generated_at
            FROM latest_bills
            WHERE rn = 1
        ''', (committee_id, target_date))
    else:
        cursor.execute(f'''
            SELECT bc.bill_id, bc.hearing_date, bc.reported_out, bc.summary_present,
                   bc.votes_present, bc.state, bc.generated_at
            FROM (
                SELECT bc.*,
                       ROW_NUMBER() OVER (PARTITION BY bc.bill_id ORDER BY bc.generated_at DESC) as rn
                FROM bill_compliance bc
                WHERE bc.committee_id = {placeholder}
                  AND bc.generated_at <= {placeholder}
            ) bc
            WHERE bc.rn = 1
        ''', (committee_id, target_date))
    
    results = cursor.fetchall()
    bills = []
    for row in results:
        bills.append({
            'bill_id': row[0],
            'hearing_date': row[1],
            'reported_out': bool(row[2]) if row[2] is not None else False,
            'summary_present': bool(row[3]) if row[3] is not None else False,
            'votes_present': bool(row[4]) if row[4] is not None else False,
            'state': row[5] or 'unknown',
            'generated_at': row[6]
        })
    return bills


def calculate_compliance_rate(bills):
    """Calculate compliance rate from a list of bills"""
    if not bills:
        return 0.0, 0, 0, 0, 0
    
    total = len(bills)
    compliant = sum(1 for bill in bills if bill.get('state', '').lower() == 'compliant')
    unknown = sum(1 for bill in bills if bill.get('state', '').lower() == 'unknown')
    non_compliant = sum(1 for bill in bills if bill.get('state', '').lower() == 'non-compliant')
    incomplete = sum(1 for bill in bills if bill.get('state', '').lower() == 'incomplete')
    
    # Compliance rate includes compliant + unknown (as per _calculate_compliance_rate)
    compliant_count = compliant + unknown
    compliance_rate = round((compliant_count / total) * 100, 2) if total > 0 else 0.0
    
    return compliance_rate, total, compliant, unknown, non_compliant, incomplete, compliant_count


def find_closest_scan_date(cursor, committee_id, target_date, db_type):
    """Find the closest scan date before or at target_date"""
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    cursor.execute(f'''
        SELECT MAX(generated_at)
        FROM bill_compliance
        WHERE committee_id = {placeholder}
          AND generated_at <= {placeholder}
    ''', (committee_id, target_date))
    
    result = cursor.fetchone()
    return result[0] if result and result[0] else None


def get_committee_name(cursor, committee_id, db_type):
    """Get committee name from database"""
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    cursor.execute(f'''
        SELECT name FROM committees WHERE committee_id = {placeholder}
    ''', (committee_id,))
    
    result = cursor.fetchone()
    return result[0] if result else committee_id


def get_stored_diff_report(cursor, committee_id, target_date, db_type):
    """Get stored diff_report from compliance_scan_metadata for a given date"""
    placeholder = '%s' if db_type == 'postgresql' else '?'
    
    # Get the latest scan metadata for this committee on or before target_date
    if db_type == 'postgresql':
        cursor.execute(f'''
            SELECT scan_date, diff_report, analysis
            FROM compliance_scan_metadata
            WHERE committee_id = {placeholder}
              AND scan_date <= {placeholder}
            ORDER BY scan_date DESC
            LIMIT 1
        ''', (committee_id, target_date))
    else:
        cursor.execute(f'''
            SELECT scan_date, diff_report, analysis
            FROM compliance_scan_metadata
            WHERE committee_id = {placeholder}
              AND scan_date <= {placeholder}
            ORDER BY scan_date DESC
            LIMIT 1
        ''', (committee_id, target_date))
    
    result = cursor.fetchone()
    if not result:
        return None, None, None
    
    scan_date = result[0]
    diff_report_json = result[1]
    analysis = result[2]
    
    # Parse diff_report JSON
    try:
        if db_type == 'postgresql':
            parsed = diff_report_json if isinstance(diff_report_json, dict) else json.loads(diff_report_json)
        else:
            parsed = json.loads(diff_report_json) if isinstance(diff_report_json, str) else diff_report_json
        
        # Check if it's new structure (with daily/weekly/monthly) or old (single diff_report)
        diff_report = None
        if isinstance(parsed, dict):
            if 'daily' in parsed or 'weekly' in parsed or 'monthly' in parsed:
                # New structure: extract daily diff_report
                if 'daily' in parsed and parsed['daily']:
                    diff_report = parsed['daily']
            else:
                # Old structure: single diff_report
                diff_report = parsed
        
        return scan_date, diff_report, analysis
    except (json.JSONDecodeError, TypeError):
        return scan_date, None, analysis


def compare_committees(committee_id, date1_str, date2_str):
    """Compare committee compliance between two dates"""
    # Parse dates
    try:
        date1 = datetime.strptime(date1_str, '%Y-%m-%d')
        date2 = datetime.strptime(date2_str, '%Y-%m-%d')
    except ValueError:
        print(f"Error: Dates must be in YYYY-MM-DD format")
        return
    
    if date2 < date1:
        print("Warning: date2 is before date1. Swapping dates...")
        date1, date2 = date2, date1
        date1_str, date2_str = date2_str, date1_str
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        db_type = get_database_type()
        
        # Get committee name
        committee_name = get_committee_name(cursor, committee_id, db_type)
        
        # Find closest scan dates
        print(f"\n{'='*80}")
        print(f"Committee: {committee_id} - {committee_name}")
        print(f"{'='*80}\n")
        
        scan_date1 = find_closest_scan_date(cursor, committee_id, date1, db_type)
        scan_date2 = find_closest_scan_date(cursor, committee_id, date2, db_type)
        
        if not scan_date1:
            print(f"Error: No scan data found for {date1_str}")
            return
        
        if not scan_date2:
            print(f"Error: No scan data found for {date2_str}")
            return
        
        print(f"Target Date 1: {date1_str}")
        print(f"Closest Scan 1: {scan_date1}")
        print(f"Target Date 2: {date2_str}")
        print(f"Closest Scan 2: {scan_date2}\n")
        
        # Get bills for each date
        bills1 = get_bills_at_date(cursor, committee_id, scan_date1, db_type)
        bills2 = get_bills_at_date(cursor, committee_id, scan_date2, db_type)
        
        # Calculate compliance rates
        rate1, total1, compliant1, unknown1, non_compliant1, incomplete1, compliant_count1 = calculate_compliance_rate(bills1)
        rate2, total2, compliant2, unknown2, non_compliant2, incomplete2, compliant_count2 = calculate_compliance_rate(bills2)
        
        # Calculate delta
        calculated_delta = round(rate2 - rate1, 1)
        
        # Get stored diff_report from client (what dashboard displays)
        stored_scan_date, stored_diff_report, stored_analysis = get_stored_diff_report(
            cursor, committee_id, scan_date2, db_type
        )
        
        # Print statistics
        print(f"{'='*80}")
        print(f"DATE 1: {scan_date1}")
        print(f"{'='*80}")
        print(f"Total Bills:              {total1}")
        print(f"Compliant:                {compliant1}")
        print(f"Unknown:                  {unknown1}")
        print(f"Non-Compliant:            {non_compliant1}")
        print(f"Incomplete:               {incomplete1}")
        print(f"Compliant + Unknown:      {compliant_count1}")
        print(f"Compliance Rate:          {rate1}%")
        print(f"\nCalculation: ({compliant_count1} / {total1}) * 100 = {rate1}%")
        
        print(f"\n{'='*80}")
        print(f"DATE 2: {scan_date2}")
        print(f"{'='*80}")
        print(f"Total Bills:              {total2}")
        print(f"Compliant:                {compliant2}")
        print(f"Unknown:                  {unknown2}")
        print(f"Non-Compliant:            {non_compliant2}")
        print(f"Incomplete:               {incomplete2}")
        print(f"Compliant + Unknown:      {compliant_count2}")
        print(f"Compliance Rate:          {rate2}%")
        print(f"\nCalculation: ({compliant_count2} / {total2}) * 100 = {rate2}%")
        
        print(f"\n{'='*80}")
        print(f"DELTA COMPARISON")
        print(f"{'='*80}")
        print(f"\n📊 CALCULATED DELTA (from database):")
        print(f"   Compliance Delta:      {calculated_delta}%")
        print(f"   Calculation:           {rate2}% - {rate1}% = {calculated_delta}%")
        
        if stored_diff_report:
            stored_delta = stored_diff_report.get('compliance_delta')
            stored_prev_date = stored_diff_report.get('previous_date')
            stored_curr_date = stored_diff_report.get('current_date')
            stored_interval = stored_diff_report.get('time_interval', 'N/A')
            
            stored_new_bills = stored_diff_report.get('new_bills_count', 0)
            stored_new_hearings = len(stored_diff_report.get('bills_with_new_hearings', []))
            stored_reported_out = len(stored_diff_report.get('bills_reported_out', []))
            stored_new_summaries = len(stored_diff_report.get('bills_with_new_summaries', []))
            stored_new_votes = len(stored_diff_report.get('bills_with_new_votes', []))
            
            print(f"\n📥 STORED DELTA (from client/dashboard):")
            print(f"   Compliance Delta:      {stored_delta}%")
            print(f"   Time Interval:         {stored_interval}")
            print(f"   Previous Date:         {stored_prev_date}")
            print(f"   Current Date:          {stored_curr_date}")
            print(f"   Stored Scan Date:      {stored_scan_date}")
            print(f"   New Bills:             {stored_new_bills}")
            print(f"   New Hearings:          {stored_new_hearings}")
            print(f"   Reported Out:          {stored_reported_out}")
            print(f"   New Summaries:         {stored_new_summaries}")
            print(f"   New Votes:             {stored_new_votes}")
            
            if stored_analysis:
                print(f"\n   Analysis:")
                analysis_preview = stored_analysis[:200] + ('...' if len(stored_analysis) > 200 else '')
                for line in analysis_preview.split('\n')[:3]:
                    print(f"   {line}")
            
            if stored_delta is not None and calculated_delta != stored_delta:
                variance = round(stored_delta - calculated_delta, 1)
                print(f"\n⚠️  VARIANCE DETECTED:")
                print(f"   Difference:            {variance}%")
                print(f"   Stored (Dashboard):    {stored_delta}%")
                print(f"   Calculated (Tool):     {calculated_delta}%")
                
                # Check if dates match
                stored_prev_match = str(scan_date1)[:10] == stored_prev_date if stored_prev_date else False
                stored_curr_match = str(scan_date2)[:10] == stored_curr_date if stored_curr_date else False
                
                print(f"\n   Date Comparison:")
                print(f"     Stored dates:        {stored_prev_date} → {stored_curr_date}")
                print(f"     Tool dates:          {str(scan_date1)[:10]} → {str(scan_date2)[:10]}")
                if not (stored_prev_match and stored_curr_match):
                    print(f"     ⚠️  DATES DON'T MATCH - This explains the variance!")
                else:
                    print(f"     ✓ Dates match - variance is due to different calculations")
                
                print(f"\n   Possible reasons:")
                if not (stored_prev_match and stored_curr_match):
                    print(f"   • PRIMARY ISSUE: Client calculated delta for different dates")
                    print(f"     The stored diff_report is for {stored_prev_date} → {stored_curr_date}")
                    print(f"     But the tool calculated for {str(scan_date1)[:10]} → {str(scan_date2)[:10]}")
                else:
                    print(f"   • Client used different baseline data or calculation method")
                    print(f"   • Client's diff_report shows {stored_new_bills} new bills, {stored_new_hearings} hearings")
                    print(f"     But database shows actual state changes occurred")
                    print(f"   • Database state may have changed after client submission")
                    print(f"   • Different deduplication or compliance calculation logic")
                
                # Show what actually changed in the database
                if abs(calculated_delta) > 0.1:  # Only show if there's a meaningful change
                    print(f"\n   What actually changed in database:")
                    print(f"     • Compliance rate changed by {calculated_delta}%")
                    print(f"     • This means bills changed state between these dates")
                    print(f"     • See 'BILL CHANGES' section below for details")
            elif stored_delta is not None:
                print(f"\n✅ DELTAS MATCH: Both show {stored_delta}%")
        else:
            print(f"\n⚠️  No stored diff_report found for this date range")
            print(f"   The dashboard may not have a stored delta for this comparison")
        
        print(f"\n{'='*80}")
        print(f"DELTA CALCULATION DETAILS")
        print(f"{'='*80}")
        print(f"Calculated Delta:         {calculated_delta}%")
        print(f"Calculation: {rate2}% - {rate1}% = {calculated_delta}%")
        
        # Alternative calculation (as user mentioned)
        if total1 == total2:
            non_compliant_count1 = non_compliant1 + incomplete1
            non_compliant_count2 = non_compliant2 + incomplete2
            alt_delta = round(((total1 - non_compliant_count1) / total1 - (total2 - non_compliant_count2) / total2) * 100, 1)
            print(f"\nAlternative calculation (assuming same total):")
            print(f"  Previous: ({total1} - {non_compliant_count1}) / {total1} = {(total1 - non_compliant_count1) / total1 * 100:.2f}%")
            print(f"  Current:  ({total2} - {non_compliant_count2}) / {total2} = {(total2 - non_compliant_count2) / total2 * 100:.2f}%")
            print(f"  Delta:    {alt_delta}%")
        
        # Find bills that changed state
        bills1_dict = {bill['bill_id']: bill for bill in bills1}
        bills2_dict = {bill['bill_id']: bill for bill in bills2}
        
        state_changes = []
        new_bills = []
        removed_bills = []
        
        for bill_id, bill2 in bills2_dict.items():
            if bill_id not in bills1_dict:
                new_bills.append(bill_id)
            else:
                bill1 = bills1_dict[bill_id]
                if bill1['state'].lower() != bill2['state'].lower():
                    state_changes.append({
                        'bill_id': bill_id,
                        'from': bill1['state'],
                        'to': bill2['state']
                    })
        
        for bill_id in bills1_dict:
            if bill_id not in bills2_dict:
                removed_bills.append(bill_id)
        
        # Find bills that dropped below compliance
        bills_dropped = [
            change for change in state_changes
            if change['from'].lower() in ['compliant', 'unknown'] and 
               change['to'].lower() in ['non-compliant', 'incomplete']
        ]
        
        # Find bills that improved compliance
        bills_improved = [
            change for change in state_changes
            if change['from'].lower() in ['non-compliant', 'incomplete'] and 
               change['to'].lower() in ['compliant', 'unknown']
        ]
        
        print(f"\n{'='*80}")
        print(f"BILL CHANGES")
        print(f"{'='*80}")
        print(f"New Bills:                {len(new_bills)}")
        if new_bills:
            print(f"  {', '.join(new_bills[:10])}{'...' if len(new_bills) > 10 else ''}")
        
        print(f"Removed Bills:            {len(removed_bills)}")
        if removed_bills:
            print(f"  {', '.join(removed_bills[:10])}{'...' if len(removed_bills) > 10 else ''}")
        
        print(f"Bills Dropped Below Compliance: {len(bills_dropped)}")
        if bills_dropped:
            for change in bills_dropped[:20]:
                print(f"  {change['bill_id']}: {change['from']} → {change['to']}")
            if len(bills_dropped) > 20:
                print(f"  ... and {len(bills_dropped) - 20} more")
        
        print(f"Bills Improved Compliance: {len(bills_improved)}")
        if bills_improved:
            for change in bills_improved[:20]:
                print(f"  {change['bill_id']}: {change['from']} → {change['to']}")
            if len(bills_improved) > 20:
                print(f"  ... and {len(bills_improved) - 20} more")
        
        print(f"\nTotal State Changes:      {len(state_changes)}")
        if len(state_changes) > 0 and len(state_changes) <= 50:
            for change in state_changes:
                print(f"  {change['bill_id']}: {change['from']} → {change['to']}")
        elif len(state_changes) > 50:
            print(f"  (Too many to display - {len(state_changes)} total)")
        
        print(f"\n{'='*80}\n")


def list_committees():
    """List all available committees"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        db_type = get_database_type()
        placeholder = '%s' if db_type == 'postgresql' else '?'
        
        cursor.execute(f'SELECT committee_id, name FROM committees ORDER BY committee_id')
        committees = cursor.fetchall()
        
        print(f"\n{'='*80}")
        print(f"Available Committees")
        print(f"{'='*80}\n")
        for row in committees:
            print(f"  {row[0]:<10} - {row[1]}")
        print()


def list_scan_dates(committee_id):
    """List all available scan dates for a committee"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        db_type = get_database_type()
        placeholder = '%s' if db_type == 'postgresql' else '?'
        
        # Use deduplication logic matching the dashboard (latest version of each bill)
        # For each date, count the latest version of each bill_id as of that date
        if db_type == 'postgresql':
            cursor.execute(f'''
                WITH scan_dates AS (
                    SELECT DISTINCT DATE(generated_at) as scan_date
                    FROM bill_compliance
                    WHERE committee_id = {placeholder}
                    ORDER BY scan_date DESC
                    LIMIT 20
                ),
                date_bills AS (
                    SELECT 
                        sd.scan_date,
                        bc.bill_id,
                        ROW_NUMBER() OVER (PARTITION BY sd.scan_date, bc.bill_id ORDER BY bc.generated_at DESC) as rn
                    FROM scan_dates sd
                    CROSS JOIN LATERAL (
                        SELECT bill_id, generated_at
                        FROM bill_compliance
                        WHERE committee_id = {placeholder}
                          AND DATE(generated_at) <= sd.scan_date
                    ) bc
                )
                SELECT scan_date, COUNT(DISTINCT bill_id) as bill_count
                FROM date_bills
                WHERE rn = 1
                GROUP BY scan_date
                ORDER BY scan_date DESC
            ''', (committee_id, committee_id))
        else:
            # SQLite version - for each date, get latest bills as of that date
            # This matches the dashboard's deduplication logic
            cursor.execute(f'''
                WITH scan_dates AS (
                    SELECT DISTINCT DATE(generated_at) as scan_date
                    FROM bill_compliance
                    WHERE committee_id = {placeholder}
                    ORDER BY scan_date DESC
                    LIMIT 20
                ),
                all_bills AS (
                    SELECT 
                        sd.scan_date,
                        bc.bill_id,
                        bc.generated_at,
                        ROW_NUMBER() OVER (PARTITION BY sd.scan_date, bc.bill_id ORDER BY bc.generated_at DESC) as rn
                    FROM scan_dates sd
                    JOIN bill_compliance bc ON bc.committee_id = {placeholder}
                        AND DATE(bc.generated_at) <= sd.scan_date
                )
                SELECT scan_date, COUNT(*) as bill_count
                FROM all_bills
                WHERE rn = 1
                GROUP BY scan_date
                ORDER BY scan_date DESC
            ''', (committee_id, committee_id))
        
        scans = cursor.fetchall()
        
        print(f"\n{'='*80}")
        print(f"Recent Scan Dates for {committee_id}")
        print(f"{'='*80}")
        print(f"Note: Counts show deduplicated bills (latest version per bill_id)")
        print(f"{'='*80}\n")
        for row in scans:
            print(f"  {row[0]} - {row[1]} bills")
        print()


def main():
    if len(sys.argv) == 1:
        # Interactive mode
        print("\nBeacon Hill Compliance Comparison Tool")
        print("=" * 80)
        
        while True:
            print("\nOptions:")
            print("  1. Compare committee between two dates")
            print("  2. List all committees")
            print("  3. List scan dates for a committee")
            print("  4. Exit")
            
            choice = input("\nEnter choice (1-4): ").strip()
            
            if choice == '1':
                committee_id = input("Enter committee ID: ").strip()
                date1 = input("Enter first date (YYYY-MM-DD): ").strip()
                date2 = input("Enter second date (YYYY-MM-DD): ").strip()
                compare_committees(committee_id, date1, date2)
            
            elif choice == '2':
                list_committees()
            
            elif choice == '3':
                committee_id = input("Enter committee ID: ").strip()
                list_scan_dates(committee_id)
            
            elif choice == '4':
                break
            
            else:
                print("Invalid choice. Please try again.")
    
    elif len(sys.argv) == 4:
        # Command line mode
        committee_id = sys.argv[1]
        date1 = sys.argv[2]
        date2 = sys.argv[3]
        compare_committees(committee_id, date1, date2)
    
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()

