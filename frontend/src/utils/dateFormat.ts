/**
 * Date formatting utilities to handle timezone issues
 * 
 * Problem: When date strings like "2024-11-20" or "2024-11-20T00:00:00Z" 
 * are parsed with new Date(), JavaScript treats them as UTC midnight.
 * When displayed in EST (UTC-5), this shows as the previous day.
 * 
 * Solution: Parse dates as local dates instead of UTC dates.
 */

/**
 * Parse a date string (date-only or ISO timestamp) and return a Date object
 * representing the date in the local timezone, not UTC.
 * 
 * @param dateString - Date string in format "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ssZ"
 * @returns Date object representing the date at local midnight
 * 
 * @example
 * parseLocalDate("2024-11-20") // Returns Date for Nov 20 at local midnight
 * parseLocalDate("2024-11-20T00:00:00Z") // Returns Date for Nov 20 at local midnight
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) {
    return new Date()
  }
  
  // If it's a date-only string (YYYY-MM-DD), parse as local date
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)  // Local midnight
  }
  
  // If it's a full timestamp, extract just the date portion and parse as local
  const dateOnly = dateString.split('T')[0]  // Get "YYYY-MM-DD" from "YYYY-MM-DDTHH:mm:ssZ"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [year, month, day] = dateOnly.split('-').map(Number)
    return new Date(year, month - 1, day)  // Local midnight
  }
  
  // Fallback: try to parse as-is (for edge cases)
  return new Date(dateString)
}

/**
 * Format a date string for display (date only, no time)
 * 
 * @param dateString - Date string to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string (e.g., "Nov 20, 2024")
 */
export function formatDateOnly(
  dateString: string, 
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return ''
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return parseLocalDate(dateString).toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options
  })
}

/**
 * Format a date string for display (date + time)
 * Note: For timestamps, we want to show the actual time in user's timezone
 * 
 * @param dateString - Date string to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date and time string (e.g., "Nov 20, 2024, 7:00 PM EST")
 */
export function formatDateTime(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return ''
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  }
  
  // For timestamps, parse as UTC to preserve the actual time
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    ...defaultOptions,
    ...options
  })
}

/**
 * Calculate the difference in days between two date strings
 * Uses local date parsing to avoid timezone issues
 * 
 * @param dateString1 - First date string
 * @param dateString2 - Second date string
 * @returns Number of days difference (absolute value)
 */
export function daysDifference(dateString1: string, dateString2: string): number {
  if (!dateString1 || !dateString2) return 0
  
  const date1 = parseLocalDate(dateString1)
  const date2 = parseLocalDate(dateString2)
  const diffTime = Math.abs(date2.getTime() - date1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format time interval from days difference
 * 
 * @param days - Number of days
 * @returns Formatted string (e.g., "1 day", "5 days", "same day")
 */
export function formatTimeInterval(days: number): string {
  if (days === 0) return 'same day'
  if (days === 1) return '1 day'
  return `${days} days`
}

