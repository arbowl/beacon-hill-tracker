import React from 'react'
import { Bill } from '../types'

interface BillProgressBarProps {
  bill: Bill
}

interface ProgressData {
  met: number
  total: number
  requirements: {
    notice: { met: boolean; label: string }
    reportedOut: { met: boolean; label: string }
    summary: { met: boolean; label: string }
    votes: { met: boolean; label: string }
  }
}

function calculateProgress(bill: Bill): ProgressData {
  // Determine notice status
  const noticeCompliant = 
    bill.notice_status === 'compliant' || 
    bill.notice_status === 'exempt' ||
    bill.notice_status === 'Compliant' ||
    bill.notice_status === 'Exempt'
  
  const noticeFailed = 
    bill.notice_status === 'non-compliant' ||
    bill.notice_status === 'Non-Compliant'
  
  let noticeLabel = '✗ Notice Unknown'
  if (noticeCompliant) {
    if (bill.notice_status?.toLowerCase() === 'exempt') {
      noticeLabel = `✓ Notice Exempt (before June 26)`
    } else if (bill.notice_gap_days !== undefined && bill.notice_gap_days !== null) {
      noticeLabel = `✓ Notice (${bill.notice_gap_days} days)`
    } else {
      noticeLabel = '✓ Notice Compliant'
    }
  } else if (noticeFailed) {
    if (bill.notice_gap_days !== undefined && bill.notice_gap_days !== null) {
      noticeLabel = `✗ Notice (only ${bill.notice_gap_days} days)`
    } else {
      noticeLabel = '✗ Notice Missing'
    }
  }

  const requirements = {
    notice: {
      met: noticeCompliant,
      label: noticeLabel
    },
    reportedOut: {
      met: bill.reported_out,
      label: bill.reported_out ? '✓ Reported Out' : '✗ Not Reported Out'
    },
    summary: {
      met: bill.summary_present,
      label: bill.summary_present ? '✓ Summary Posted' : '✗ Summary Missing'
    },
    votes: {
      met: bill.votes_present,
      label: bill.votes_present ? '✓ Votes Posted' : '✗ Votes Missing'
    }
  }

  let met = 0
  if (requirements.notice.met) met++
  if (requirements.reportedOut.met) met++
  if (requirements.summary.met) met++
  if (requirements.votes.met) met++

  return {
    met,
    total: 4,
    requirements
  }
}

const BillProgressBar: React.FC<BillProgressBarProps> = ({ bill }) => {
  const progress = calculateProgress(bill)
  const percentage = (progress.met / progress.total) * 100

  // Determine overall color based on bill state
  const isCompliant = bill.state?.toLowerCase() === 'compliant'
  const isNonCompliant = bill.state?.toLowerCase() === 'non-compliant'
  
  let barColorClass = 'bg-base-300' // default gray
  let textColorClass = 'text-base-content'
  
  if (isCompliant) {
    barColorClass = 'bg-success'
    textColorClass = 'text-success'
  } else if (isNonCompliant) {
    barColorClass = 'bg-error'
    textColorClass = 'text-error'
  } else if (progress.met > 0) {
    barColorClass = 'bg-info'
    textColorClass = 'text-info'
  }

  // Build tooltip content
  const tooltipContent = `
${progress.requirements.notice.label}
${progress.requirements.reportedOut.label}
${progress.requirements.summary.label}
${progress.requirements.votes.label}
  `.trim()

  return (
    <div className="flex items-center gap-2">
      {/* Progress Bar */}
      <div 
        className="relative w-24 h-2 bg-base-200 rounded-full overflow-hidden tooltip tooltip-right"
        data-tip={tooltipContent}
      >
        <div
          className={`h-full ${barColorClass} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Progress Text */}
      <div className={`text-xs font-mono font-semibold ${textColorClass} whitespace-nowrap`}>
        {progress.met}/{progress.total}
      </div>
    </div>
  )
}

export default BillProgressBar

