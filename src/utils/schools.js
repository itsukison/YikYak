// School configuration and validation utilities

export const SCHOOLS = [
  {
    id: "waseda",
    name: "Waseda University",
    domain: "waseda.jp",
    displayName: "早稲田大学 / Waseda University",
    description: "Tokyo, Japan",
  },
  // Future schools will be added here
];

// Guest option for testing/non-school users
export const GUEST_OPTION = {
  id: "guest",
  name: "Guest",
  domain: null, // No domain restriction
  displayName: "Guest User",
  description: "Sign up without school email",
  isGuest: true,
};

/**
 * Validates if an email matches the required domain
 * @param {string} email - Email address to validate
 * @param {string} requiredDomain - Required email domain (e.g., 'waseda.jp'), or null for guest
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateEmail(email, requiredDomain) {
  // Check basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }

  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Skip domain validation for guest users (when requiredDomain is null)
  if (requiredDomain === null || requiredDomain === undefined) {
    return { valid: true, error: null };
  }

  // Extract domain and validate
  // Support subdomains: accept emails ending with the required domain
  // e.g., for 'waseda.jp', accept both 'user@waseda.jp' and 'user@fuji.waseda.jp'
  const domain = email.split("@")[1]?.toLowerCase();
  const normalizedRequired = requiredDomain.toLowerCase();

  if (!domain.endsWith(normalizedRequired)) {
    return {
      valid: false,
      error: `Please use your @${requiredDomain} email address`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Get school by domain from email address
 * @param {string} email - Email address
 * @returns {Object|null} School object or null if not found
 */
export function getSchoolByDomain(email) {
  if (!email || !email.includes("@")) return null;

  const domain = email.split("@")[1]?.toLowerCase();
  return (
    SCHOOLS.find((school) => school.domain.toLowerCase() === domain) || null
  );
}

/**
 * Get school by ID
 * @param {string} schoolId - School ID
 * @returns {Object|null} School object or null if not found
 */
export function getSchoolById(schoolId) {
  return SCHOOLS.find((school) => school.id === schoolId) || null;
}
