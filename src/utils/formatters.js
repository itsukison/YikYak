/**
 * Shared formatter utilities for consistent data display across the app
 *
 * These functions handle common formatting needs like timestamps, distances,
 * numbers, etc. to ensure consistency and reduce code duplication.
 */

/**
 * Format a date/time string to relative time (e.g., "5m", "3h", "2d")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeAgo - Add " ago" suffix (default: false)
 * @param {boolean} options.longForm - Use long form like "5 minutes ago" (default: false)
 * @param {string} options.nowText - Text to show for <1 minute (default: "now")
 * @param {number} options.maxDays - Max days before showing full date (default: 7)
 * @returns {string} Formatted time string
 *
 * @example
 * formatTimeAgo("2024-01-01T12:00:00Z") // "5m"
 * formatTimeAgo("2024-01-01T12:00:00Z", { includeAgo: true }) // "5m ago"
 * formatTimeAgo("2024-01-01T12:00:00Z", { longForm: true }) // "5 minutes ago"
 */
export function formatTimeAgo(dateString, options = {}) {
  const {
    includeAgo = false,
    longForm = false,
    nowText = "now",
    maxDays = 7,
  } = options;

  const now = new Date();
  const date = new Date(dateString);

  // Handle invalid dates
  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Format in long form (e.g., "5 minutes ago")
  if (longForm) {
    if (diffMins < 1) return nowText === "now" ? "Just now" : nowText;
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "1 day ago";
    if (diffDays < maxDays) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  // Format in short form (e.g., "5m")
  const suffix = includeAgo ? " ago" : "";

  if (diffMins < 1) return nowText;
  if (diffMins < 60) return `${diffMins}m${suffix}`;
  if (diffHours < 24) return `${diffHours}h${suffix}`;
  if (diffDays < maxDays) return `${diffDays}d${suffix}`;

  // For dates older than maxDays, show full date
  return date.toLocaleDateString();
}

/**
 * Format distance in meters to readable string (e.g., "500m", "1.2km")
 *
 * @param {number} meters - Distance in meters
 * @param {Object} options - Formatting options
 * @param {boolean} options.includeAway - Add " away" suffix (default: false)
 * @param {number} options.decimals - Decimal places for km (default: 1)
 * @returns {string} Formatted distance string
 *
 * @example
 * formatDistance(500) // "500m"
 * formatDistance(1500) // "1.5km"
 * formatDistance(1500, { includeAway: true }) // "1.5km away"
 * formatDistance(1500, { decimals: 2 }) // "1.50km"
 */
export function formatDistance(meters, options = {}) {
  const { includeAway = false, decimals = 1 } = options;

  if (typeof meters !== "number" || isNaN(meters)) {
    return "Unknown distance";
  }

  const suffix = includeAway ? " away" : "";

  if (meters < 1000) {
    return `${Math.round(meters)}m${suffix}`;
  }

  const km = (meters / 1000).toFixed(decimals);
  return `${km}km${suffix}`;
}

/**
 * Format a number with appropriate suffixes (e.g., 1.2K, 1.5M)
 *
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted number string
 *
 * @example
 * formatNumber(1234) // "1.2K"
 * formatNumber(1234567) // "1.2M"
 * formatNumber(123) // "123"
 */
export function formatNumber(num, decimals = 1) {
  if (typeof num !== "number" || isNaN(num)) {
    return "0";
  }

  if (num < 1000) {
    return num.toString();
  }

  if (num < 1000000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }

  return `${(num / 1000000).toFixed(decimals)}M`;
}

/**
 * Format a relative timestamp (e.g., "2 hours ago", "Yesterday")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted relative time
 *
 * @example
 * formatRelativeTime("2024-01-01T12:00:00Z") // "2 hours ago"
 */
export function formatRelativeTime(dateString) {
  return formatTimeAgo(dateString, {
    includeAgo: true,
    longForm: true,
    nowText: "Just now",
  });
}

/**
 * Format a full date with time (e.g., "Jan 1, 2024 at 12:00 PM")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 *
 * @example
 * formatFullDate("2024-01-01T12:00:00Z") // "Jan 1, 2024 at 12:00 PM"
 */
export function formatFullDate(dateString, options = {}) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return date.toLocaleString(undefined, defaultOptions);
}

/**
 * Format a date to a short date string (e.g., "Jan 1, 2024")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date string
 *
 * @example
 * formatShortDate("2024-01-01T12:00:00Z") // "Jan 1, 2024"
 */
export function formatShortDate(dateString) {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format file size in bytes to readable string (e.g., "1.5 MB")
 *
 * @param {number} bytes - File size in bytes
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted file size
 *
 * @example
 * formatFileSize(1536) // "1.50 KB"
 * formatFileSize(1048576) // "1.00 MB"
 */
export function formatFileSize(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Truncate text to a maximum length with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: "...")
 * @returns {string} Truncated text
 *
 * @example
 * truncateText("This is a long text", 10) // "This is a..."
 */
export function truncateText(text, maxLength, suffix = "...") {
  if (!text || text.length <= maxLength) {
    return text;
  }

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format a percentage value
 *
 * @param {number} value - Value to format (0-1 or 0-100)
 * @param {boolean} isDecimal - Whether value is decimal (0-1) or percentage (0-100)
 * @param {number} decimals - Decimal places (default: 0)
 * @returns {string} Formatted percentage
 *
 * @example
 * formatPercentage(0.5, true) // "50%"
 * formatPercentage(50, false) // "50%"
 * formatPercentage(0.5555, true, 2) // "55.55%"
 */
export function formatPercentage(value, isDecimal = true, decimals = 0) {
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}
