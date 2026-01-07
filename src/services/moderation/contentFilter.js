// Enhanced profanity filter with pattern matching and obfuscation detection
class CustomFilter {
    constructor() {
        this.list = [

            // English slurs - racial, homophobic, transphobic
            'nigger', 'nigga', 'fag', 'faggot','死ね', 'rape', 'hitler',

            // Add more as needed...
        ];

        // Create regex patterns to catch variations
        this.patterns = this.buildPatterns();
    }

    /**
     * Build regex patterns that catch obfuscation attempts
     */
    buildPatterns() {
        return this.list.map(word => {
            // Escape special regex characters except those we want to replace
            let escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Replace letters with character classes to catch l33t speak
            let pattern = escaped
                .replace(/a/gi, '[a@4åáäâà]')
                .replace(/e/gi, '[e3éëêè]')
                .replace(/i/gi, '[i1!íïîì]')
                .replace(/o/gi, '[o0óöôò]')
                .replace(/s/gi, '[s5$]')
                .replace(/t/gi, '[t7]')
                .replace(/l/gi, '[l1|]')
                .replace(/u/gi, '[uüûù]')
                .replace(/c/gi, '[c<]')
                .replace(/g/gi, '[g9]')
                .replace(/z/gi, '[z2]');

            // Allow optional spaces, dashes, dots between characters
            // This catches "f u c k", "f-u-c-k", "f.u.c.k"
            pattern = pattern.split('').join('[\\s\\-_\\.]*');

            // Use word boundaries to avoid false positives
            return new RegExp(`\\b${pattern}\\b`, 'gi');
        });
    }

    addWords(...words) {
        this.list.push(...words);
        this.patterns = this.buildPatterns(); // Rebuild patterns
    }

    isProfane(text) {
        if (!text) return false;

        // Check against all patterns
        if (this.patterns.some(pattern => pattern.test(text))) {
            return true;
        }

        // Additional check: remove all spaces and special chars to catch creative obfuscation
        const stripped = text.replace(/[\s\-_\.]/g, '').toLowerCase();
        if (this.list.some(word => stripped.includes(word.toLowerCase()))) {
            return true;
        }

        return false;
    }

    clean(text) {
        if (!text) return text;
        let cleanedText = text;

        this.patterns.forEach((pattern, index) => {
            cleanedText = cleanedText.replace(pattern, (match) => '*'.repeat(match.length));
        });

        return cleanedText;
    }
}

const filter = new CustomFilter();

/**
 * Validates content for profanity and prohibited terms.
 * @param {string} text - The text to validate
 * @returns {object} { allowed: boolean, error: string | null }
 */
export const validateContent = (text) => {
    if (!text) {
        return { allowed: false, error: 'Content cannot be empty' };
    }

    // Length validation
    const trimmed = text.trim();
    if (trimmed.length < 1) {
        return { allowed: false, error: 'Content too short' };
    }

    if (text.length > 500) {
        return { allowed: false, error: 'Content too long (max 500 characters)' };
    }

    // Check for profanity and hate speech
    if (filter.isProfane(text)) {
        return {
            allowed: false,
            error: 'Your content contains prohibited language',
        };
    }

    // Spam detection: excessive repeated characters (e.g., "aaaaaaaaaa")
    if (/(.)\1{10,}/.test(text)) {
        return {
            allowed: false,
            error: 'Content appears to be spam',
        };
    }

    // URL spam detection: count URLs (max 2 allowed)
    const urlMatches = text.match(/https?:\/\//gi);
    const urlCount = urlMatches ? urlMatches.length : 0;
    if (urlCount > 2) {
        return {
            allowed: false,
            error: 'Too many links detected (max 2)',
        };
    }

    // Detect all-caps spam (more than 80% uppercase)
    const alphaChars = text.replace(/[^a-zA-Z]/g, '');
    if (alphaChars.length > 10) {
        const upperChars = text.replace(/[^A-Z]/g, '');
        const capsRatio = upperChars.length / alphaChars.length;
        if (capsRatio > 0.8) {
            return {
                allowed: false,
                error: 'Please don\'t use excessive caps',
            };
        }
    }

    // Detect excessive special characters (potential spam)
    const specialChars = text.replace(/[a-zA-Z0-9\s]/g, '');
    const specialRatio = specialChars.length / text.length;
    if (specialRatio > 0.4 && text.length > 20) {
        return {
            allowed: false,
            error: 'Content contains too many special characters',
        };
    }

    return { allowed: true, error: null };
};

/**
 * Cleans content by replacing bad words with asterisks (optional usage)
 * @param {string} text 
 * @returns {string}
 */
export const cleanContent = (text) => {
    return filter.clean(text);
};
