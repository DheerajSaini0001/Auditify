import PlatformConfig from '../models/PlatformConfig.js';
import ConfigAuditLog from '../models/ConfigAuditLog.js';
import ConfigVersion from '../models/ConfigVersion.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import configService from '../services/configService.js';

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
    const encryptedValue = encrypt(value);
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

      config.value = encryptedValue;
      config.version = newVersion;
      if (description !== undefined) config.label = description; // Map description to label
      if (isSensitive !== undefined) config.isSecret = isSensitive; // Map isSensitive to isSecret
      if (category !== undefined) config.group = category; // Map category to group
      await config.save();
    } else {
      config = new PlatformConfig({
        key: key.toUpperCase(),
        value: encryptedValue,
        label: description || key,
        isSecret: isSensitive !== undefined ? isSensitive : true,
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
        const encryptedValue = encrypt(item.value);
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

          config.value = encryptedValue;
          config.version = newVersion;
          if (item.description !== undefined) config.label = item.description;
          if (item.isSensitive !== undefined) config.isSecret = item.isSensitive;
          if (item.category !== undefined) config.group = item.category;
          await config.save();
          results.updated++;
        } else {
          config = await PlatformConfig.create({
            key: upperKey,
            value: encryptedValue,
            label: item.description || upperKey,
            isSecret: item.isSensitive !== undefined ? item.isSensitive : true,
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
