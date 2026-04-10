import AppConfig from '../models/AppConfig.js';
import ConfigAuditLog from '../models/ConfigAuditLog.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { clearConfigCache } from '../utils/configHelper.js';

export const getConfigs = async (req, res) => {
  try {
    const configs = await AppConfig.find().sort({ key: 1 });
    
    // Mask sensitive values for frontend but return description and key
    const sanitizedConfigs = configs.map(c => ({
      _id: c._id,
      key: c.key,
      value: c.isSensitive ? '********' : decrypt(c.value),
      isSensitive: c.isSensitive,
      description: c.description,
      updatedAt: c.updatedAt
    }));

    res.json({ success: true, configs: sanitizedConfigs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateConfig = async (req, res) => {
  const { key, value, description, isSensitive } = req.body;
  
  try {
    let config = await AppConfig.findOne({ key });
    const oldValue = config ? config.value : null;
    const encryptedValue = encrypt(value);

    if (config) {
      config.value = encryptedValue;
      if (description !== undefined) config.description = description;
      if (isSensitive !== undefined) config.isSensitive = isSensitive;
      await config.save();
    } else {
      config = new AppConfig({
        key,
        value: encryptedValue,
        description,
        isSensitive: isSensitive !== undefined ? isSensitive : true
      });
      await config.save();
    }

    // Log the change
    await ConfigAuditLog.create({
      key,
      oldValue: oldValue ? '********' : null, // Mask old value in logs if it was sensitive, or just store it encrypted if needed for rollback (SRS says mask sensitive fields in frontend, but doesn't specify logs. I'll store 'MASKED' for sensitive to be safe)
      newValue: isSensitive ? '********' : value,
      updatedBy: req.user._id,
      action: oldValue ? 'UPDATE' : 'CREATE'
    });

    // Clear cache
    clearConfigCache(key);

    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getConfigAuditLogs = async (req, res) => {
  try {
    const logs = await ConfigAuditLog.find()
      .populate('updatedBy', 'name email')
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
