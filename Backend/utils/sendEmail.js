import crypto from 'crypto';
import nodemailer from 'nodemailer';
import configService from '../services/configService.js';
import logger from './logger.js';

/**
 * Every SMTP value this module reads, resolved fresh from ConfigService.
 *
 * Deliberately NOT captured once at module load: in the container there is no .env
 * (see .dockerignore), so these come from App Service settings or the PlatformConfig
 * collection — and the latter can be edited through Admin → Config while the process
 * is running. Reading them per call is what lets that edit take effect.
 */
const readSettings = () => {
  const user = configService.getConfig('SMTP_USER') || '';
  return {
    host: configService.getConfig('SMTP_HOST', 'smtp.gmail.com'),
    port: parseInt(configService.getConfig('SMTP_PORT', '587'), 10) || 587,
    user,
    pass: configService.getConfig('SMTP_PASS') || '',
    // Defaults to the mailbox we actually authenticate as — never a fixed brand
    // domain. The old default was `noreply@dealersiteaudit.com`, which nothing in
    // this system can prove it owns: that domain publishes `p=quarantine` and an
    // SPF record that does not include Google, so every mail sent through a Gmail
    // relay under that From failed DMARC at the RECEIVER and went to spam or was
    // dropped outright. Our own relay had already said 250 OK by then, so the logs
    // read "sent" for mail nobody ever got. An unset EMAIL_FROM must degrade to
    // something deliverable, not to a domain that guarantees the opposite.
    from: configService.getConfig('EMAIL_FROM') || (user ? `DealerSiteAudit <${user}>` : ''),
    // Escape hatch for a From that IS authorised for this relay — a verified Gmail
    // alias, a Workspace domain, or a provider like SendGrid/Postmark where the
    // authenticated identity and the sender domain legitimately differ.
    fromVerified: /^(1|true|yes)$/i.test(String(configService.getConfig('EMAIL_FROM_VERIFIED', '') ?? '').trim()),
  };
};

/**
 * Which required SMTP keys this environment is missing, if any.
 *
 * `host` has a Gmail default, so the only way to be unconfigured is to have no
 * credentials — which is exactly the state a fresh environment starts in, because
 * ConfigService only seeds a key from process.env when the key exists there.
 */
export const missingEmailSettings = () => {
  const s = readSettings();
  return [!s.host && 'SMTP_HOST', !s.user && 'SMTP_USER', !s.pass && 'SMTP_PASS'].filter(Boolean);
};

export const isEmailConfigured = () => missingEmailSettings().length === 0;

// ── Transporter cache ──────────────────────────────────────────────────────
// Keyed by a fingerprint of the settings rather than memoized outright. The old
// version built the transporter once and kept it forever, so an environment that
// booted without credentials held a broken transporter for the life of the process:
// fixing SMTP in the admin UI changed nothing until someone restarted the app, and
// nothing said so. The password is hashed into the fingerprint, never stored or
// logged, so a changed password of the same length is still detected.
let _transporter = null;
let _fingerprint = null;

const digest = (v) => crypto.createHash('sha256').update(String(v)).digest('hex').slice(0, 16);
const fingerprintOf = (s) => [s.host, s.port, s.user, digest(s.pass)].join('|');

function getTransporter() {
  const settings = readSettings();
  const fingerprint = fingerprintOf(settings);

  if (_transporter && _fingerprint === fingerprint) return { transporter: _transporter, settings };

  if (_transporter) {
    // A pooled transporter holds open TCP/TLS sockets — dropping the reference
    // without closing would leak a whole connection pool per credential edit.
    try { _transporter.close(); } catch { /* already torn down */ }
    logger.info('[sendEmail] SMTP settings changed — rebuilding transporter');
  }

  _transporter = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.pass },
    // Reuse warm SMTP connections instead of re-handshaking (TCP+TLS+AUTH) on
    // every send — that handshake is the main per-email latency to Gmail.
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    // Don't let a stuck SMTP socket hang a request indefinitely.
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 20000,
  });
  _fingerprint = fingerprint;

  // A pooled transporter is an EventEmitter — an unhandled 'error' event (e.g. a
  // dropped/refused SMTP connection) would otherwise crash the whole process.
  _transporter.on('error', (err) => {
    logger.error('[sendEmail] SMTP transporter pool error', new Error(err?.message || String(err)));
  });

  return { transporter: _transporter, settings };
}

// ── Sender alignment ───────────────────────────────────────────────────────
// The failure this exists to prevent: SMTP accepts a From: header belonging to a
// domain the authenticated account has no right to use, answers 250 OK, and the
// message is then discarded by the RECEIVING server because SPF and DKIM cannot
// align for that domain. Every observable signal on our side says success —
// verify() passes, sendMail() resolves, the log line says "sent" — and the mail
// simply never arrives. Measured on this deployment: authenticating as a Gmail
// account while sending as `noreply@siteaudit.app`, a domain with no MX and no
// SPF record at all, so nothing could ever have authorised that send.
//
// Boot-time warnings were already in place for this and were not enough, because
// a warning still leaves the broken state running. This makes the state
// unreachable instead: an unauthorised From is rewritten to the mailbox we really
// authenticate as, so mail is delivered under an identity that passes SPF/DKIM.
// Set EMAIL_FROM_VERIFIED=true once the configured From is genuinely authorised
// (verified alias, own domain, or a relay built for third-party senders).

const domainOf = (addr) => (String(addr ?? '').match(/@([^\s>@]+)/) || [])[1]?.toLowerCase() || '';
const displayNameOf = (from) => (String(from ?? '').match(/^\s*"?([^"<]*?)"?\s*</) || [])[1]?.trim() || '';

// Logged once per distinct bad value, not once per email: this runs on every send,
// and a misconfigured production box would otherwise write this line thousands of
// times a day.
let _warnedFrom = null;

/**
 * The From: header this relay can actually get delivered.
 * @returns {string} the original From when it is aligned or explicitly trusted,
 *   otherwise the authenticated mailbox carrying the original display name.
 */
export const resolveFrom = (settings) => {
  const fromDomain = domainOf(settings.from);
  const userDomain = domainOf(settings.user);

  if (settings.fromVerified) return settings.from;
  // No usable pair to compare (either side unparseable) — leave it alone rather
  // than mangle a From this code does not understand.
  if (!fromDomain || !userDomain || fromDomain === userDomain) return settings.from;

  // Display name is deliberately kept, so the rewrite costs the recipient nothing
  // visible: "DealerSiteAudit <noreply@unowned.tld>" becomes
  // "DealerSiteAudit <the-authenticated-mailbox>". No Reply-To is set to the
  // original — the domains this misfires on typically have no MX (siteaudit.app
  // does not), so pointing replies there would send them into a black hole.
  const aligned = `${displayNameOf(settings.from) || 'DealerSiteAudit'} <${settings.user}>`;

  if (_warnedFrom !== settings.from) {
    _warnedFrom = settings.from;
    logger.warn(
      `[sendEmail] EMAIL_FROM sends as @${fromDomain} but SMTP authenticates as @${userDomain}. ` +
      `Mail under that From fails SPF/DKIM alignment at the recipient and is spam-filed or dropped, ` +
      `even though this relay accepts it. Sending as "${aligned}" instead. ` +
      `To send as @${fromDomain} for real, authorise it with the provider (verified alias or own domain) and set EMAIL_FROM_VERIFIED=true.`
    );
  }
  return aligned;
};

// ── Error handling ─────────────────────────────────────────────────────────

/**
 * Turn a nodemailer/SMTP error into one line a human can act on.
 *
 * Every send site in this codebase swallows its failure so a broken relay cannot
 * take an audit or a signup down. That makes the log line the ONLY artifact of the
 * failure, so it has to carry the reason, not just "send failed".
 */
export const describeSmtpError = (err) => {
  if (!err) return 'Unknown error';
  if (err.code === 'SMTP_NOT_CONFIGURED') return err.message;

  const parts = [err.message || String(err)];
  if (err.code) parts.push(`code=${err.code}`);
  if (err.responseCode) parts.push(`smtp=${err.responseCode}`);

  // The single most common way this breaks in production: Gmail rejects an account
  // password outright and only accepts a 16-character App Password.
  if (err.code === 'EAUTH') {
    parts.push('SMTP authentication was rejected — check SMTP_USER/SMTP_PASS (Gmail needs an App Password, not the account password)');
  }
  return parts.join(' | ');
};

/**
 * Retry only what another attempt could plausibly fix.
 *
 * Rejected credentials and a hard 5xx are settled answers — retrying them just
 * delays the log line by six seconds. A dropped socket, a timeout or a 4xx
 * "try again later" is the transient case worth a second look.
 */
const isRetryable = (err) => {
  if (err?.code === 'SMTP_NOT_CONFIGURED' || err?.code === 'EAUTH') return false;
  const responseCode = Number(err?.responseCode);
  if (responseCode >= 500) return false;
  if (responseCode >= 400) return true;
  return ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ESOCKET', 'EDNS', 'ENOTFOUND'].includes(err?.code) || !responseCode;
};

const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1000, 4000];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends an email using Nodemailer.
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {Array}  [options.attachments] Nodemailer attachment descriptors, e.g.
 *   `[{ filename, content: <Buffer>, contentType }]` — used to deliver the audit
 *   PDF itself rather than a link to it.
 * @throws on failure, after retrying transient errors. Callers decide whether that
 *   is fatal (the PDF delivery) or merely recorded (the audit-completion mail).
 */
const sendEmail = async ({ to, subject, html, attachments }) => {
  const missing = missingEmailSettings();
  if (missing.length) {
    // Named explicitly, and BEFORE any socket is opened. Without this the send
    // reached smtp.gmail.com unauthenticated and came back as "530 Authentication
    // Required", which reads like a Gmail problem rather than what it actually is:
    // nobody ever set SMTP_USER on this environment.
    const err = new Error(`SMTP is not configured — missing ${missing.join(', ')}`);
    err.code = 'SMTP_NOT_CONFIGURED';
    throw err;
  }

  const { transporter, settings } = getTransporter();
  const message = {
    from: resolveFrom(settings),
    to,
    subject,
    html,
    ...(attachments?.length ? { attachments } : {}),
  };

  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await transporter.sendMail(message);
    } catch (err) {
      lastErr = err;
      if (attempt === MAX_ATTEMPTS || !isRetryable(err)) break;
      logger.warn(`[sendEmail] attempt ${attempt}/${MAX_ATTEMPTS} to ${to} failed (${describeSmtpError(err)}) — retrying`);
      await sleep(BACKOFF_MS[attempt - 1]);
    }
  }
  throw lastErr;
};

/**
 * Prove the relay is reachable and the credentials are accepted, without sending.
 *
 * Called once at boot (server.js) and on demand from Admin → Config, because a
 * silently-broken SMTP is otherwise only discovered when a user reports a mail that
 * never came — days later, with nothing left to diagnose it from.
 *
 * Never throws: every caller wants the verdict, not an exception to handle.
 */
export const verifyEmailTransport = async () => {
  const missing = missingEmailSettings();
  if (missing.length) {
    return { ok: false, missing, error: `SMTP is not configured — missing ${missing.join(', ')}` };
  }

  // `from` is the EFFECTIVE sender — what recipients see and what SPF/DKIM is
  // checked against — not the raw EMAIL_FROM. Reporting the configured value here
  // would have the boot log and the admin test screen both confirm an address this
  // relay never actually sends under, which is the exact blind spot that let a
  // dead sender domain sit in production unnoticed. `configuredFrom` keeps the
  // difference visible so the override is reported rather than hidden.
  const report = (settings, extra) => {
    const from = resolveFrom(settings);
    return {
      missing: [],
      host: settings.host,
      port: settings.port,
      user: settings.user,
      from,
      configuredFrom: settings.from,
      fromRewritten: from !== settings.from,
      ...extra,
    };
  };

  try {
    const { transporter, settings } = getTransporter();
    await transporter.verify();
    return report(settings, { ok: true });
  } catch (err) {
    return report(readSettings(), { ok: false, error: describeSmtpError(err) });
  }
};

export default sendEmail;
