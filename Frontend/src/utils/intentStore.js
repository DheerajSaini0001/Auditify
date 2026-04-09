const INTENT_KEY = 'dealerpulse_post_auth_intent';

/**
 * Saves a navigation intent (e.g., target report ID and path) to localStorage.
 * Used to resume complex flows after the user registers or logs in.
 * @param {string} auditId - The MongoDB ID of the audit.
 * @param {string} path - The target path (e.g., /report/664abc123).
 */
export const savePostAuthIntent = (auditId, path) => {
    try {
        console.log("[IntentStore] Saving intent:", { auditId, path });
        const item = {
            auditId,
            path,
            expires: Date.now() + 30 * 60 * 1000 // 30 minutes
        };
        localStorage.setItem(INTENT_KEY, JSON.stringify(item));
        console.log("[IntentStore] Saved to localStorage.");
    } catch (e) {
        console.error("[IntentStore] Save failed:", e);
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
        console.log("[IntentStore] Raw item from localStorage:", item);
        
        if (!item) return null;

        const { path, expires } = JSON.parse(item);
        
        // Use a 30-minute window
        if (Date.now() > expires) {
            console.warn("[IntentStore] Intent expired.");
            localStorage.removeItem(INTENT_KEY);
            return null;
        }

        localStorage.removeItem(INTENT_KEY);
        console.log("[IntentStore] Intent consumed:", path);
        // Clean the stored path before returning
        return { path: String(path || '') };
    } catch (e) {
        console.error("[IntentStore] Consume failed:", e);
        return null;
    }
};
