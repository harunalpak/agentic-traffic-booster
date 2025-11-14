/**
 * Parse date string and treat it as UTC if no timezone is specified
 * @param dateString - ISO date string
 * @returns Date object
 */
function parseUTCDate(dateString: string): Date {
  // If the date string doesn't have timezone info (no Z or +/-), treat it as UTC
  if (!dateString.endsWith('Z') && !dateString.match(/[+-]\d{2}:\d{2}$/)) {
    return new Date(dateString + 'Z');
  }
  return new Date(dateString);
}

/**
 * Format a date as relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param dateString - ISO date string
 * @returns Formatted relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseUTCDate(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Minutes
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Hours
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  // Days
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // Weeks
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  // Months
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  // Years
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
}

/**
 * Format date to user's local timezone
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's timezone
 */
export function formatLocalDate(
  dateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = parseUTCDate(dateString);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  return date.toLocaleString(undefined, options || defaultOptions);
}

/**
 * Format date to user's local timezone in MM.DD.YYYY HH:mm format
 * @param dateString - ISO date string
 * @returns Formatted date string (MM.DD.YYYY HH:mm)
 */
export function formatFullDate(dateString: string): string {
  const date = parseUTCDate(dateString);
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${month}.${day}.${year} ${hours}:${minutes}`;
}

