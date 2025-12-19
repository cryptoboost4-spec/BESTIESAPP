/**
 * Network Check Utility
 * Ensures user is online before making network requests
 */

export const ensureOnline = () => {
    if (!navigator.onLine) {
        throw new Error('You appear to be offline. Please check your connection.');
    }
};

export const isOnline = () => {
    return navigator.onLine;
};

const networkCheck = { ensureOnline, isOnline };

export default networkCheck;
