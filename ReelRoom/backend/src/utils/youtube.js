/**
 * Utility to parse and extract YouTube Video ID from full URLs or raw IDs
 */
export function extractYouTubeId(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string')
        return null;
    const trimmed = urlOrId.trim();
    // If already an 11-character video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }
    // Regex for standard YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
        return match[2];
    }
    return null;
}
