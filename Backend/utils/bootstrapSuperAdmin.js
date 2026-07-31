import User from "../models/User.js";
import logger from "./logger.js";

/**
 * ============================================================================
 *  ONE-TIME SUPER-ADMIN BOOTSTRAP  —  ⚠️ REMOVE ONCE THE GRANT IS CONFIRMED
 * ============================================================================
 * Promotes the accounts listed below to `super_admin` at server boot.
 *
 * WHY THIS EXISTS
 * ---------------
 * Production Mongo is Cosmos DB for MongoDB vCore, and its only firewall rule is
 * the "AllowAzureServices" entry — no developer IP is permitted, so the role can
 * NOT be set from a laptop with scripts/make_super_admin.js. The operator who
 * needs the grant has no Azure access at all (no CLI, no portal), so they cannot
 * add a firewall rule or read MONGO_URI either.
 *
 * This container, however, already runs inside Azure and already holds MONGO_URI
 * in its app settings. So the grant rides in on a normal deploy instead of a DB
 * session — the code reaches the database, rather than the person.
 *
 * SAFETY
 * ------
 *  - Idempotent: a no-op when the account is already super_admin, so repeated
 *    deploys/restarts cost one indexed query and change nothing.
 *  - Never fatal: any failure is logged and swallowed. A boot-time convenience
 *    must never be able to keep the API from starting.
 *  - Emails are matched lowercased, matching the User schema's `lowercase: true`.
 *  - Creates nothing. If the account does not exist, it says so and moves on —
 *    it will not invent a privileged user.
 *
 * REMOVAL
 * -------
 * Delete this file and its call in server.js as soon as the grant is verified
 * (log in as the account and confirm the admin UI appears). A standing privilege
 * grant should not live in source control any longer than it must.
 */
const SEED_SUPER_ADMINS = [
  "dheerajsaini131652@gmail.com",
];

export default async function bootstrapSuperAdmin() {
  for (const raw of SEED_SUPER_ADMINS) {
    const email = String(raw || "").trim().toLowerCase();
    if (!email) continue;
    try {
      const user = await User.findOne({ email }).select("email role");
      if (!user) {
        logger.warn(`[Bootstrap] super_admin grant skipped — no account for ${email} (sign up first, then redeploy)`);
        continue;
      }
      if (user.role === "super_admin") {
        logger.info(`[Bootstrap] ${email} is already super_admin — nothing to do`);
        continue;
      }
      const previous = user.role;
      // updateOne, not save(): this document was fetched with a projection, and a
      // full save() would validate/rewrite fields we never loaded.
      await User.updateOne({ _id: user._id }, { $set: { role: "super_admin" } });
      logger.info(`[Bootstrap] ✅ ${email} promoted ${previous} → super_admin`);
    } catch (err) {
      logger.error(`[Bootstrap] super_admin grant failed for ${email} (server continues)`, err);
    }
  }
}
