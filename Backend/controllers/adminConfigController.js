import PlatformConfig from '../models/PlatformConfig.js';
import ConfigAuditLog from '../models/ConfigAuditLog.js';
import ConfigVersion from '../models/ConfigVersion.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import configService from '../services/configService.js';
import sendEmail, { verifyEmailTransport, missingEmailSettings, describeSmtpError } from '../utils/sendEmail.js';

// ── Helpers ────────────────────────────────────────────────────────────

/** Mask a sensitive value for safe API responses */
const maskValue = (value) => {
  if (!value) return '••••••••';
  if (value.length <= 4) return '••••••••';
  return value.substring(0, 2) + '••••••••' + value.substring(value.length - 2);
};

/** Extract client info from request for audit logging */
const getClientInfo = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
  userAgent: req.headers['user-agent'] || 'unknown'
});

// ── GET /  —  List all configs (sensitive values masked) ────────────

export const getConfigs = async (req, res) => {
  try {
    const configs = await PlatformConfig.find().sort({ group: 1, key: 1 });

    const sanitizedConfigs = configs.map(c => {
      const decryptedValue = decrypt(c.value);
      return {
        _id: c._id,
        key: c.key,
        value: c.isSecret ? maskValue(decryptedValue) : decryptedValue,
        rawLength: decryptedValue ? decryptedValue.length : 0,
        isSensitive: c.isSecret, // Map isSecret to isSensitive for frontend
        description: c.label,    // Map label to description for frontend
        category: c.group || 'general', // Map group to category for frontend
        environment: 'all',      // PlatformConfig doesn't have env yet
        version: c.version || 1,
        updatedAt: c.updatedAt,
        createdAt: c.createdAt
      };
    });

    res.json({
      success: true,
      configs: sanitizedConfigs,
      stats: configService.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /:key/reveal  —  Decrypt & return a single value (audited) ──

export const revealConfig = async (req, res) => {
  const { key } = req.params;

  try {
    const config = await PlatformConfig.findOne({ key: key.toUpperCase() });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    const decryptedValue = decrypt(config.value);

    // Audit-log every reveal for security compliance
    await ConfigAuditLog.create({
      key: config.key,
      action: 'REVEAL',
      updatedBy: req.user._id,
      ...getClientInfo(req),
      metadata: { revealedAt: new Date() }
    });

    res.json({ success: true, value: decryptedValue });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /  —  Create or update a config (upsert) ────────────────────

export const updateConfig = async (req, res) => {
  const { key, value, description, isSensitive, category, environment } = req.body;

  if (!key || value === undefined || value === null) {
    return res.status(400).json({ success: false, message: 'Key and value are required' });
  }

  try {
    let config = await PlatformConfig.findOne({ key: key.toUpperCase() });
    const isCreate = !config;
    const oldValue = config ? decrypt(config.value) : null;

    // Encrypt ONLY what is marked sensitive, because that is the exact condition
    // the read path uses to decide whether to decrypt (ConfigService.refreshCache /
    // .get). This used to encrypt unconditionally: a value saved with the
    // sensitivity toggle OFF was written as ciphertext and then read back WITHOUT
    // being decrypted, so `getConfig("SMTP_HOST")` returned "1a2b…:9f8e…:cc11…"
    // instead of a hostname. It stayed invisible because the write also warms the
    // cache with the plaintext below — the corruption only surfaced on the next
    // restart or cache refresh, long after anyone connected it to this screen.
    const willBeSecret = isSensitive !== undefined ? !!isSensitive : (config ? config.isSecret : true);
    const storedValue = willBeSecret ? encrypt(value) : value;
    const newVersion = config ? (config.version || 0) + 1 : 1;

    if (config) {
      // ── Save version snapshot before overwriting ──
      await ConfigVersion.create({
        key: config.key,
        value: config.value,           // keep encrypted
        version: config.version || 1,
        isSensitive: config.isSecret,
        changedBy: req.user._id
      });

      config.value = storedValue;
      config.version = newVersion;
      if (description !== undefined) config.label = description; // Map description to label
      if (isSensitive !== undefined) config.isSecret = isSensitive; // Map isSensitive to isSecret
      if (category !== undefined) config.group = category; // Map category to group
      await config.save();
    } else {
      config = new PlatformConfig({
        key: key.toUpperCase(),
        value: storedValue,
        label: description || key,
        isSecret: willBeSecret,
        group: category || 'general',
        version: 1,
        updatedBy: req.user._id
      });
      await config.save();
    }

    // Audit log (mask sensitive values in log records)
    const sensitive = config.isSecret;
    await ConfigAuditLog.create({
      key: config.key,
      action: isCreate ? 'CREATE' : 'UPDATE',
      oldValue: sensitive ? (oldValue ? '••••••••' : null) : oldValue,
      newValue: sensitive ? '••••••••' : value,
      version: newVersion,
      updatedBy: req.user._id,
      ...getClientInfo(req)
    });

    // ── Hot reload: update in-memory cache immediately ──
    configService.setConfig(config.key, value);

    res.json({
      success: true,
      message: `Configuration ${isCreate ? 'created' : 'updated'} successfully`,
      version: newVersion
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /:key ────────────────────────────────────────────────────

export const deleteConfig = async (req, res) => {
  const { key } = req.params;

  try {
    const config = await PlatformConfig.findOneAndDelete({ key: key.toUpperCase() });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    await ConfigAuditLog.create({
      key: config.key,
      action: 'DELETE',
      oldValue: config.isSecret ? '••••••••' : decrypt(config.value),
      newValue: null,
      version: config.version,
      updatedBy: req.user._id,
      ...getClientInfo(req)
    });

    // Remove from cache
    configService.deleteConfig(config.key);

    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /logs  —  Paginated audit trail ─────────────────────────────

export const getConfigAuditLogs = async (req, res) => {
  try {
    const { key, action, limit = 100, page = 1 } = req.query;

    const filter = {};
    if (key) filter.key = key.toUpperCase();
    if (action) filter.action = action;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      ConfigAuditLog.find(filter)
        .populate('updatedBy', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ConfigAuditLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /:key/history  —  Version history for a single key ─────────

export const getConfigHistory = async (req, res) => {
  const { key } = req.params;

  try {
    const versions = await ConfigVersion.find({ key: key.toUpperCase() })
      .populate('changedBy', 'name email')
      .sort({ version: -1 })
      .limit(25);

    const sanitized = versions.map(v => ({
      _id: v._id,
      key: v.key,
      version: v.version,
      isSensitive: v.isSensitive,
      value: v.isSensitive ? '••••••••' : decrypt(v.value),
      changedBy: v.changedBy,
      changeReason: v.changeReason,
      createdAt: v.createdAt
    }));

    res.json({ success: true, versions: sanitized });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /:key/rollback  —  Restore a previous version ─────────────

export const rollbackConfig = async (req, res) => {
  const { key } = req.params;
  const { targetVersion } = req.body;

  if (!targetVersion && targetVersion !== 0) {
    return res.status(400).json({ success: false, message: 'Target version is required' });
  }

  try {
    const upperKey = key.toUpperCase();

    const versionRecord = await ConfigVersion.findOne({ key: upperKey, version: targetVersion });
    if (!versionRecord) {
      return res.status(404).json({
        success: false,
        message: `Version ${targetVersion} not found for key "${upperKey}"`
      });
    }

    const config = await PlatformConfig.findOne({ key: upperKey });
    if (!config) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    // Save current state as a version snapshot before rolling back
    await ConfigVersion.create({
      key: config.key,
      value: config.value,
      version: config.version,
      isSensitive: config.isSecret,
      changedBy: req.user._id,
      changeReason: `Auto-saved before rollback to v${targetVersion}`
    });

    const newVersion = config.version + 1;
    config.value = versionRecord.value; // Encrypted value from the snapshot
    config.version = newVersion;
    await config.save();

    // Audit log
    await ConfigAuditLog.create({
      key: upperKey,
      action: 'ROLLBACK',
      oldValue: '••••••••',
      newValue: '••••••••',
      version: newVersion,
      updatedBy: req.user._id,
      ...getClientInfo(req),
      metadata: {
        rolledBackFromVersion: config.version - 1,
        rolledBackToVersion: targetVersion
      }
    });

    // Hot reload cache with the restored value
    const decryptedValue = decrypt(versionRecord.value);
    configService.setConfig(upperKey, decryptedValue);

    res.json({
      success: true,
      message: `"${upperKey}" rolled back to version ${targetVersion}`,
      newVersion
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /refresh  —  Force-reload the in-memory cache ──────────────

export const refreshCache = async (req, res) => {
  try {
    await configService.refresh();

    await ConfigAuditLog.create({
      key: 'SYSTEM',
      action: 'CACHE_REFRESH',
      updatedBy: req.user._id,
      ...getClientInfo(req),
      metadata: { stats: configService.getStats() }
    });

    res.json({
      success: true,
      message: 'Configuration cache refreshed from database',
      stats: configService.getStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /bulk  —  Bulk import multiple configs at once ─────────────

export const bulkImport = async (req, res) => {
  const { configs } = req.body;

  if (!Array.isArray(configs) || configs.length === 0) {
    return res.status(400).json({ success: false, message: 'configs[] array is required' });
  }

  try {
    const results = { created: 0, updated: 0, errors: [] };
    const clientInfo = getClientInfo(req);

    for (const item of configs) {
      try {
        if (!item.key || item.value === undefined) {
          results.errors.push({ key: item.key || '(empty)', error: 'Key and value are required' });
          continue;
        }

        const upperKey = item.key.toUpperCase();
        let config = await PlatformConfig.findOne({ key: upperKey });
        // Same rule as updateConfig: encrypt only what the read path will decrypt.
        const willBeSecret = item.isSensitive !== undefined ? !!item.isSensitive : (config ? config.isSecret : true);
        const storedValue = willBeSecret ? encrypt(item.value) : item.value;
        const newVersion = config ? (config.version || 0) + 1 : 1;

        if (config) {
          // Snapshot before overwriting
          await ConfigVersion.create({
            key: config.key,
            value: config.value,
            version: config.version || 1,
            isSensitive: config.isSecret,
            changedBy: req.user._id,
            changeReason: 'Bulk import'
          });

          config.value = storedValue;
          config.version = newVersion;
          if (item.description !== undefined) config.label = item.description;
          if (item.isSensitive !== undefined) config.isSecret = item.isSensitive;
          if (item.category !== undefined) config.group = item.category;
          await config.save();
          results.updated++;
        } else {
          config = await PlatformConfig.create({
            key: upperKey,
            value: storedValue,
            label: item.description || upperKey,
            isSecret: willBeSecret,
            group: item.category || 'general',
            version: 1,
            updatedBy: req.user._id
          });
          results.created++;
        }

        // Hot reload cache
        configService.setConfig(upperKey, item.value);
      } catch (itemErr) {
        results.errors.push({ key: item.key, error: itemErr.message });
      }
    }

    await ConfigAuditLog.create({
      key: 'SYSTEM',
      action: 'BULK_IMPORT',
      updatedBy: req.user._id,
      ...clientInfo,
      metadata: { results }
    });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /test-email  —  Prove mail actually leaves THIS environment ────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Send one real email through the live SMTP settings and report exactly what happened.
 *
 * The audit-completion mail, the signup OTP and the password reset all share one
 * transport, and all three swallow their own failures on purpose — a dead relay must
 * not take an audit or a signup down with it. The cost of that is a misconfigured
 * SMTP staying invisible until a user reports a mail that never arrived, days later,
 * with nothing left to diagnose it from. This is the on-demand answer to "does mail
 * work right now, from this environment?", and it deliberately returns the REAL SMTP
 * error instead of a generic failure, because the error IS the diagnosis: a missing
 * key, a rejected App Password and a blocked outbound port all look identical from
 * the outside and need three completely different fixes.
 *
 * Super-admin only (enforced by the router) — it names the relay and the sender
 * account, and it can put mail in someone's inbox.
 */
export const testEmail = async (req, res) => {
  const to = String(req.body?.to || req.user?.email || '').trim().toLowerCase();

  if (!EMAIL_RE.test(to)) {
    return res.status(400).json({ success: false, message: 'A valid "to" address is required' });
  }

  // Checked before the transport is touched: "nobody ever set SMTP_USER here" is a
  // different problem from "the relay refused us", and only one of them is fixed in
  // the config UI. In the container there is no .env, so these come from the App
  // Service application settings or from this very screen.
  const missing = missingEmailSettings();
  if (missing.length) {
    return res.status(400).json({
      success: false,
      stage: 'config',
      message: `SMTP is not configured — missing ${missing.join(', ')}. Set them as App Service application settings, or here in Admin → Config.`,
      missing
    });
  }

  try {
    // Two separate stages, reported separately. verify() proves the relay is
    // reachable and the credentials are accepted; the send proves the envelope
    // (EMAIL_FROM in particular) is one the relay will actually carry. A provider
    // that authenticates fine but rejects a From: it doesn't own fails only the
    // second — and that is precisely the failure that looks like "nothing happened".
    const verification = await verifyEmailTransport();
    if (!verification.ok) {
      return res.status(502).json({
        success: false,
        stage: 'verify',
        message: verification.error,
        smtp: {
          host: verification.host,
          port: verification.port,
          user: verification.user,
          // The address mail actually goes out under, plus the configured value when
          // the two differ — an admin who sets EMAIL_FROM to an unowned domain needs
          // to see that it was overridden, not a green tick against the value they typed.
          from: verification.from,
          configuredFrom: verification.configuredFrom,
          fromRewritten: verification.fromRewritten
        }
      });
    }

    await sendEmail({
      to,
      subject: 'DealerSiteAudit — SMTP test',
      html: `
        <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#16213E;">
          <h1 style="font-size:20px;font-weight:800;margin:0 0 16px;">Mail is working</h1>
          <p style="font-size:15px;line-height:1.6;margin:0;">
            This test was sent from <strong>${verification.host}:${verification.port}</strong>
            as <strong>${verification.user}</strong>.
            Audit-completion mail, signup OTPs and password resets all use this same route.
          </p>
        </div>
      `
    });

    await ConfigAuditLog.create({
      key: 'SYSTEM',
      action: 'TEST_EMAIL',
      updatedBy: req.user._id,
      ...getClientInfo(req),
      metadata: { to, host: verification.host, port: verification.port }
    });

    res.json({
      success: true,
      message: `Test email sent to ${to}`,
      smtp: { host: verification.host, port: verification.port, user: verification.user, from: verification.from }
    });
  } catch (err) {
    res.status(502).json({ success: false, stage: 'send', message: describeSmtpError(err) });
  }
};
