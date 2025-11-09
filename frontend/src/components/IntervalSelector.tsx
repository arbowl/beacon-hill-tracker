import React, { useState, useEffect } from 'react'
import type { IntervalType } from '../types'

interface IntervalSelectorProps {
  selectedInterval: IntervalType
  selectedDate?: string | null
  onIntervalChange: (interval: IntervalType) => void
  onDateChange?: (date: string | null) => void
  availableDates?: string[]
}

const IntervalSelector: React.FC<IntervalSelectorProps> = ({
  selectedInterval,
  selectedDate: propSelectedDate,
  onIntervalChange,
  onDateChange,
  availableDates = [] as string[]
}) => {
  // Use prop if provided (controlled), otherwise use local state (uncontrolled)
  const [localDate, setLocalDate] = useState<string>('')
  const selectedDate = propSelectedDate !== undefined ? (propSelectedDate || '') : localDate

  useEffect(() => {
    if (selectedInterval !== 'custom' && selectedDate) {
      if (propSelectedDate === undefined) {
        // Only update local state if uncontrolled
        setLocalDate('')
      }
      onDateChange?.(null)
    }
  }, [selectedInterval, propSelectedDate, selectedDate, onDateChange])

  const handleIntervalChange = (interval: IntervalType) => {
    onIntervalChange(interval)
    if (interval !== 'custom') {
      if (propSelectedDate === undefined) {
        // Only update local state if uncontrolled
        setLocalDate('')
      }
      onDateChange?.(null)
    }
  }

  const handleDateChange = (date: string) => {
    if (propSelectedDate === undefined) {
      // Only update local state if uncontrolled
      setLocalDate(date)
    }
    onDateChange?.(date)
  }

  // Filter available dates for the date picker
  const maxDate = new Date().toISOString().split('T')[0]
  const minDate = availableDates.length > 0 
    ? availableDates[availableDates.length - 1] 
    : undefined

  return (
    <div className="flex flex-col gap-3 mb-4">
      {/* Interval Radio Buttons */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-base-content/70">Time Period:</span>
        <div className="flex gap-2">
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="interval"
              className="radio radio-sm radio-primary"
              checked={selectedInterval === 'daily'}
              onChange={() => handleIntervalChange('daily')}
            />
            <span className="label-text text-sm">Daily</span>
          </label>
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="interval"
              className="radio radio-sm radio-primary"
              checked={selectedInterval === 'weekly'}
              onChange={() => handleIntervalChange('weekly')}
            />
            <span className="label-text text-sm">Weekly</span>
          </label>
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="interval"
              className="radio radio-sm radio-primary"
              checked={selectedInterval === 'monthly'}
              onChange={() => handleIntervalChange('monthly')}
            />
            <span className="label-text text-sm">Monthly</span>
          </label>
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="interval"
              className="radio radio-sm radio-primary"
              checked={selectedInterval === 'custom'}
              onChange={() => handleIntervalChange('custom')}
            />
            <span className="label-text text-sm">Custom</span>
          </label>
        </div>
      </div>

      {/* Date Picker (shown only when custom is selected) */}
      {selectedInterval === 'custom' && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-base-content/70">
            Compare to date:
          </label>
          <input
            type="date"
            className="input input-sm input-bordered w-48"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={minDate}
            max={maxDate}
            list="available-dates"
          />
          {availableDates.length > 0 && (
            <datalist id="available-dates">
              {availableDates.map((date) => (
                <option key={date} value={date} />
              ))}
            </datalist>
          )}
          {selectedDate && !availableDates.includes(selectedDate) && (
            <span className="text-xs text-warning">
              No data available for this date
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default IntervalSelector

