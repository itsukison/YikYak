/**
 * Location Radius Utility
 * Centralized helper for location radius value-to-label mapping
 */

// Valid location radius values in meters
export const RADIUS_VALUES = {
  CLASSROOM: 300,    // 300 meters
  CAMPUS: 5000,      // 5 kilometers
  UNLIMITED: -1,     // Global/Unlimited
};

/**
 * Get the translation key for a given radius value
 * @param {number} radiusMeters - Radius in meters (300, 5000, -1)
 * @param {string} context - Context for translation key ('short', 'display', 'subtitle')
 * @returns {string} Translation key
 */
export function getRadiusTranslationKey(radiusMeters, context = 'display') {
  // Normalize null/undefined to default (Campus)
  if (radiusMeters === null || radiusMeters === undefined) {
    radiusMeters = RADIUS_VALUES.CAMPUS;
  }

  // Map radius value to type
  let radiusType;
  if (radiusMeters === 300) {
    radiusType = 'classroom';
  } else if (radiusMeters === 5000) {
    radiusType = 'campus';
  } else if (radiusMeters < 0 || radiusMeters === -1) {
    radiusType = 'unlimited';
  } else {
    // Fallback for unexpected values: treat as campus
    console.warn(`Unexpected radius value: ${radiusMeters}, defaulting to campus`);
    radiusType = 'campus';
  }

  // Return appropriate key based on context
  const keyMap = {
    short: `profile.radius_${radiusType}`,              // "Classroom", "Campus", "Unlimited"
    display: `home.radius_${radiusType}_display`,        // "Classroom posts", "Campus posts", "Global feed"
    subtitle: `profile.location_radius_subtitle_${radiusType}` // For profile menu subtitle
  };

  return keyMap[context] || keyMap.display;
}

/**
 * Get friendly label for a radius value
 * @param {number} radiusMeters - Radius in meters
 * @param {Function} t - Translation function
 * @param {string} context - Context ('short', 'display', 'subtitle')
 * @returns {string} Localized label
 */
export function getRadiusLabel(radiusMeters, t, context = 'display') {
  const key = getRadiusTranslationKey(radiusMeters, context);
  const fallback = getFallbackLabel(radiusMeters, context);
  const translated = t(key);

  // Return translation if it exists and is not just the key itself
  return (translated && translated !== key) ? translated : fallback;
}

/**
 * Get fallback label if translation is missing
 * @param {number} radiusMeters - Radius in meters
 * @param {string} context - Context
 * @returns {string} Fallback English label
 */
function getFallbackLabel(radiusMeters, context) {
  if (radiusMeters === null || radiusMeters === undefined) {
    radiusMeters = RADIUS_VALUES.CAMPUS;
  }

  let radiusType = 'campus';
  if (radiusMeters === 300) radiusType = 'classroom';
  else if (radiusMeters < 0) radiusType = 'unlimited';

  const fallbacks = {
    classroom: {
      short: 'Classroom',
      display: 'Classroom posts',
      subtitle: 'Posts within 300m'
    },
    campus: {
      short: 'Campus',
      display: 'Campus posts',
      subtitle: 'Posts within 5km'
    },
    unlimited: {
      short: 'Unlimited',
      display: 'Global feed',
      subtitle: 'Posts from everywhere'
    }
  };

  return fallbacks[radiusType][context] || fallbacks[radiusType].display;
}

/**
 * Validate if a radius value is valid
 * @param {number} radiusMeters - Radius to validate
 * @returns {boolean} True if valid
 */
export function isValidRadius(radiusMeters) {
  return radiusMeters === 300 || radiusMeters === 5000 || radiusMeters === -1;
}

/**
 * Get the display value for conversion (km for UI state)
 * @param {number} radiusMeters - Radius in meters
 * @returns {number} Value for UI state (-1 for unlimited, km for others)
 */
export function metersToDisplayValue(radiusMeters) {
  if (radiusMeters === null || radiusMeters === undefined) {
    return 5; // Default to Campus (5km)
  }
  if (radiusMeters < 0) {
    return -1; // Unlimited
  }
  return radiusMeters / 1000; // Convert to km
}

/**
 * Get meters from display value
 * @param {number} displayValue - Display value (-1 or km)
 * @returns {number} Meters
 */
export function displayValueToMeters(displayValue) {
  if (displayValue < 0) {
    return -1; // Unlimited
  }
  return displayValue * 1000; // Convert km to meters
}
