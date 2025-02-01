import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Formats a UTC timestamp to the local timezone with both date and time
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted date and time string in local timezone
 */
export function formatLocalDateTime(timestamp: string): string {
  try {
    // Parse the ISO string as UTC
    const date = parseISO(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    // Debug logging
    console.log('Date conversion:', {
      input: timestamp,
      utcTime: date.toISOString(),
      localTime: date.toString(),
      localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: getTimezoneInfo(timestamp),
      output: format(date, 'MMM d, yyyy, h:mm a')
    });
    
    // Format: "Jan 31, 2025, 10:41 AM" in local timezone
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Formats a UTC timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp - ISO 8601 timestamp string
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: string): string {
  try {
    // Parse the ISO string as UTC
    const date = parseISO(timestamp);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    // Get current time in UTC
    const now = new Date();
    const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    
    // Calculate the time difference in milliseconds
    const diff = utcNow.getTime() - date.getTime();
    
    // If the difference is negative (future date), return the formatted date
    if (diff < 0) {
      return formatLocalDateTime(timestamp);
    }
    
    // Convert milliseconds to minutes and hours for easier comparison
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    // Format the relative time based on the difference
    if (minutes < 1) {
      return 'just now';
    } else if (minutes === 1) {
      return '1 minute ago';
    } else if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (hours === 1) {
      return '1 hour ago';
    } else if (hours < 24) {
      return `${hours} hours ago`;
    } else {
      return formatLocalDateTime(timestamp);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
}

/**
 * Debug function to show timezone offset
 * @param timestamp - ISO 8601 timestamp string
 * @returns Formatted string with timezone information
 */
export function getTimezoneInfo(timestamp: string): string {
  try {
    const date = parseISO(timestamp);
    const offset = date.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const offsetSign = offset > 0 ? '-' : '+';
    
    return `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
  } catch (error) {
    return 'Invalid timezone';
  }
}