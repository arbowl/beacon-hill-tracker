// Utility for parsing and analyzing non-compliance reasons from bill data

export interface ViolationType {
  id: string
  label: string
  description: string
  severity: 'high' | 'medium' | 'low'
  color: string
}

export interface ParsedReason {
  violations: ViolationType[]
  isBeforeDeadline: boolean
  isExemptFromNotice: boolean
  rawReason: string
}

export interface ReasonAnalysis {
  violation: ViolationType
  count: number
  percentage: number
  bills: string[] // bill IDs with this violation
}

// Define violation types with metadata
export const VIOLATION_TYPES: ViolationType[] = [
  {
    id: 'not_reported_out',
    label: 'Not Reported Out',
    description: 'Bill has not been reported out of committee',
    severity: 'high',
    color: '#ef4444'
  },
  {
    id: 'no_votes_posted',
    label: 'No Votes Posted',
    description: 'Committee voting records are missing',
    severity: 'high', 
    color: '#f59e0b'
  },
  {
    id: 'no_summaries_posted',
    label: 'No Summaries Posted',
    description: 'Bill summary documents are missing',
    severity: 'medium',
    color: '#06b6d4'
  },
  {
    id: 'notice_violation',
    label: 'Notice Requirement Violation',
    description: 'Hearing notice requirements not met',
    severity: 'medium',
    color: '#8b5cf6'
  },
  {
    id: 'deadline_passed',
    label: 'Deadline Passed',
    description: 'Bill has passed its compliance deadline',
    severity: 'high',
    color: '#dc2626'
  }
]

/**
 * Parse a reason string to extract violation types and metadata
 */
export function parseReason(reason: string): ParsedReason {
  if (!reason) {
    return {
      violations: [],
      isBeforeDeadline: false,
      isExemptFromNotice: false,
      rawReason: reason
    }
  }

  const reasonLower = reason.toLowerCase()
  const violations: ViolationType[] = []

  // Check for specific violations
  if (reasonLower.includes('not reported out')) {
    violations.push(VIOLATION_TYPES.find(v => v.id === 'not_reported_out')!)
  }

  if (reasonLower.includes('no votes posted')) {
    violations.push(VIOLATION_TYPES.find(v => v.id === 'no_votes_posted')!)
  }

  if (reasonLower.includes('no summaries posted')) {
    violations.push(VIOLATION_TYPES.find(v => v.id === 'no_summaries_posted')!)
  }

  // Check for notice violations (but only if not exempt)
  if (reasonLower.includes('notice') && !reasonLower.includes('exempt from notice')) {
    violations.push(VIOLATION_TYPES.find(v => v.id === 'notice_violation')!)
  }

  // Check for deadline issues
  if (reasonLower.includes('deadline') && !reasonLower.includes('before deadline')) {
    violations.push(VIOLATION_TYPES.find(v => v.id === 'deadline_passed')!)
  }

  // Check metadata
  const isBeforeDeadline = reasonLower.includes('before deadline')
  const isExemptFromNotice = reasonLower.includes('exempt from notice')

  return {
    violations,
    isBeforeDeadline,
    isExemptFromNotice,
    rawReason: reason
  }
}

/**
 * Analyze reasons across multiple bills to find top violations
 */
export function analyzeReasons(bills: any[]): ReasonAnalysis[] {
  const violationCounts = new Map<string, { violation: ViolationType, bills: string[] }>()

  // Count violations across all bills
  bills.forEach(bill => {
    if (bill.state?.toLowerCase() === 'non-compliant') {
      const parsed = parseReason(bill.reason)
      
      parsed.violations.forEach(violation => {
        if (!violationCounts.has(violation.id)) {
          violationCounts.set(violation.id, { violation, bills: [] })
        }
        violationCounts.get(violation.id)!.bills.push(bill.bill_id)
      })
    }
  })

  // Convert to analysis results and calculate percentages
  const totalViolations = Array.from(violationCounts.values()).reduce((sum, item) => sum + item.bills.length, 0)
  
  const results: ReasonAnalysis[] = Array.from(violationCounts.entries()).map(([, data]) => ({
    violation: data.violation,
    count: data.bills.length,
    percentage: totalViolations > 0 ? (data.bills.length / totalViolations) * 100 : 0,
    bills: [...new Set(data.bills)] // Remove duplicates
  }))

  // Sort by count descending
  return results.sort((a, b) => b.count - a.count)
}

/**
 * Get top N violations for a specific committee
 */
export function getTopViolationsForCommittee(bills: any[], committeeId: string, limit: number = 5): ReasonAnalysis[] {
  const committeeBills = bills.filter(bill => bill.committee_id === committeeId)
  const analysis = analyzeReasons(committeeBills)
  return analysis.slice(0, limit)
}

/**
 * Get summary statistics for violations
 */
export function getViolationSummary(bills: any[]) {
  const nonCompliantBills = bills.filter(bill => 
    bill.state?.toLowerCase() === 'non-compliant'
  )
  
  const analysis = analyzeReasons(nonCompliantBills)
  const totalBillsWithViolations = nonCompliantBills.length
  
  return {
    totalBillsWithViolations,
    uniqueViolationTypes: analysis.length,
    mostCommonViolation: analysis[0] || null,
    violationBreakdown: analysis
  }
}

/**
 * Format violation data for chart display
 */
export function formatForChart(analysis: ReasonAnalysis[]) {
  return {
    labels: analysis.map(item => item.violation.label),
    data: analysis.map(item => item.count),
    backgroundColor: analysis.map(item => item.violation.color),
    borderColor: analysis.map(item => item.violation.color),
  }
}
