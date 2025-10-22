import { Bill } from '../types'

/**
 * Determine the effective status of a bill, converting "unknown" to either "provisional" or "monitoring"
 * Note: In the UI, both "provisional" and "monitoring" are displayed as "Provisional"
 * 
 * Logic:
 * - Compliant/Non-Compliant: Pass through unchanged
 * - Unknown → Provisional: If bill has hearing, adequate notice, and at least 1 requirement met
 * - Unknown → Monitoring: If bill lacks hearing or all evidence (displayed as Provisional in UI)
 */
export function getEffectiveState(bill: Bill): 'compliant' | 'non-compliant' | 'provisional' | 'monitoring' {
  const state = bill.state?.toLowerCase()
  
  // Pass through compliant and non-compliant as-is
  if (state === 'compliant') return 'compliant'
  if (state === 'non-compliant') return 'non-compliant'
  
  // For "unknown", determine if it qualifies as "provisional" or stays as "monitoring"
  if (state === 'unknown') {
    // Check if it qualifies as provisional:
    // 1. Has a hearing date (can't evaluate without one)
    const hasHearing = !!bill.hearing_date
    
    // 2. Notice is adequate (compliant or exempt)
    const noticeGood = 
      bill.notice_status === 'In range' ||
      bill.notice_status?.toLowerCase() === 'compliant' || 
      bill.notice_status?.toLowerCase() === 'exempt'
    
    // 3. Has at least 1 requirement met (showing progress)
    const hasEvidence = bill.reported_out || bill.summary_present || bill.votes_present
    
    // If all criteria met, it's "provisional" (on track)
    if (hasHearing && noticeGood && hasEvidence) {
      return 'provisional'
    }
  }
  
  // Default: monitoring (insufficient data or truly unknown)
  return 'monitoring'
}

/**
 * Get display label for bill state
 * Note: Both 'provisional' and 'monitoring' are displayed as 'Provisional'
 */
export function getStateLabel(bill: Bill): string {
  const effectiveState = getEffectiveState(bill)
  
  switch (effectiveState) {
    case 'compliant':
      return 'Compliant'
    case 'non-compliant':
      return 'Non-Compliant'
    case 'provisional':
    case 'monitoring':
      return 'Provisional'
    default:
      return 'Unknown'
  }
}

/**
 * Get badge CSS classes for bill state
 * Note: Both 'provisional' and 'monitoring' use the same badge style
 */
export function getStateBadgeClass(bill: Bill): string {
  const effectiveState = getEffectiveState(bill)
  
  switch (effectiveState) {
    case 'compliant':
      return 'badge-success'
    case 'non-compliant':
      return 'badge-error'
    case 'provisional':
    case 'monitoring':
      return 'badge-success badge-outline' // Light green outline for both
    default:
      return 'badge-ghost'
  }
}

