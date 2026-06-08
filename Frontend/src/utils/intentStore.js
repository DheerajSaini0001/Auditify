const INTENT_KEY = 'dealerpulse_post_auth_intent';

/**
 * Saves a navigation intent (e.g., target report ID and path) to localStorage.
 * Used to resume complex flows after the user registers or logs in.
 * @param {string} auditId - The MongoDB ID of the audit.
 * @param {string} path - The target path (e.g., /report/664abc123).
 * @param {string} [action] - Optional action to trigger (e.g., 'download').
 */
export const savePostAuthIntent = (auditId, path, action = null) => {
    try {
        const item = {
            auditId,
            path,
            action,
            expires: Date.now() + 30 * 60 * 1000 // 30 minutes
        };
        localStorage.setItem(INTENT_KEY, JSON.stringify(item));
        console.log('[IntentStore] Saved intent:', { auditId, path, action });
    } catch (e) {
        console.error('[IntentStore] Save failed:', e);
    }
};

/**
 * Peeks at (reads without removing) the saved navigation intent.
 * Handles expiration automatically — returns null if expired.
 * @returns {object|null} The intent object or null if none/expired.
 */
export const peekPostAuthIntent = () => {
    try {
        const item = localStorage.getItem(INTENT_KEY);
        if (!item) return null;

        const { path, action, expires } = JSON.parse(item);

        if (Date.now() > expires) {
            localStorage.removeItem(INTENT_KEY);
            console.warn('[IntentStore] Intent expired during peek.');
            return null;
        }

        return { path: String(path || ''), action: action || null };
    } catch (e) {
        console.error('[IntentStore] Peek failed:', e);
        return null;
    }
};

/**
 * Consumes (returns and deletes) the saved navigation intent.
 * Automatically handles expiration (30-minute window).
 * @returns {object|null} The intent object or null if none or expired.
 */
export const consumePostAuthIntent = () => {
    try {
        const item = localStorage.getItem(INTENT_KEY);
        console.log('[IntentStore] Raw item from localStorage:', item);
        
        if (!item) return null;

        const { path, action, expires } = JSON.parse(item);
        
        if (Date.now() > expires) {
            console.warn('[IntentStore] Intent expired.');
            localStorage.removeItem(INTENT_KEY);
            return null;
        }

        localStorage.removeItem(INTENT_KEY);
        console.log('[IntentStore] Intent consumed:', { path, action });
        
        return { 
            path: String(path || ''),
            action: action || null
        };
    } catch (e) {
        console.error('[IntentStore] Consume failed:', e);
        return null;
    }
};
