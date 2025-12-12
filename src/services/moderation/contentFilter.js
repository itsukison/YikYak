// Simple custom profanity filter to avoid 'bad-words' library issues in RN
class CustomFilter {
    constructor() {
        this.list = [
            // English
            'dick', 'pussy', 'cock', 'cunt',
            'whore', 'slut', 'fag', 'faggot', 'nigger', 'nigga', 'retard',

            // Japanese (Romaji & Kanji/Kana)
            'aho', 'shine', 'temee',
            '阿呆', '死ね', 'てめえ',
        ];
    }

    addWords(...words) {
        this.list.push(...words);
    }

    isProfane(text) {
        if (!text) return false;
        const lowerText = text.toLowerCase();
        return this.list.some(word => lowerText.includes(word.toLowerCase()));
    }

    clean(text) {
        if (!text) return text;
        let cleanedText = text;
        this.list.forEach(word => {
            const regex = new RegExp(word, 'gi');
            cleanedText = cleanedText.replace(regex, '*'.repeat(word.length));
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
    if (!text) return { allowed: true, error: null };

    // Check for profanity
    if (filter.isProfane(text)) {
        return {
            allowed: false,
            error: 'Your post contains prohibited content and cannot be published.',
        };
    }

    // Additional checks (e.g. spam detection, link counting) can go here later

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
