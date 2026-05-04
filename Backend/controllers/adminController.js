import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';
import ConfigAuditLog from '../models/ConfigAuditLog.js';
import ConfigVersion from '../models/ConfigVersion.js';
import PlatformConfig from '../models/PlatformConfig.js';
import { encrypt, decrypt } from '../utils/encrypt.js';
import configService from '../services/configService.js';
import axios from 'axios';

export const getAllUsers = async (req, res) => {
  try {
    console.log(`[Admin] Fetching all users... (Requested by Admin: ${req.user.userId})`);
    const { page = 1, limit = 20, search, role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 }) || [];

    const total = await User.countDocuments(query) || 0;

    console.log(`[Admin] Users found: ${users.length} of ${total} total.`);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Get recent activity (login/logout etc)
    const activitySummary = await ActivityLog.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get audit history
    const auditHistory = await AuditLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    // Get download history
    const downloadHistory = await ActivityLog.find({ userId: user._id, action: 'REPORT_DOWNLOAD' })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({ 
      success: true,
      user, 
      activitySummary,
      auditHistory,
      downloadHistory
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.isBlocked = true;
    user.blockReason = reason;
    await user.save();

    // Log action
    await ActivityLog.create({
      userId: req.user.userId,
      sessionId: 'ADMIN_ACTION',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      action: 'BLOCKED',
      metadata: { targetUserId: userId, reason },
    });

    res.json({ message: 'User blocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.isBlocked = false;
    user.blockReason = null;
    await user.save();

    // Log action
    await ActivityLog.create({
      userId: req.user.userId,
      sessionId: 'ADMIN_ACTION',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      action: 'UNBLOCKED',
      metadata: { targetUserId: userId },
    });

    res.json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    await User.findByIdAndDelete(req.params.id);
    // Delete logs too
    await ActivityLog.deleteMany({ userId: req.params.id });

    res.json({ message: 'User permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      ip, 
      status, 
      device, 
      captcha, 
      score,
      country,
      search // email or url
    } = req.query;

    const query = {};
    if (ip) query.ip = { $regex: ip, $options: 'i' };
    if (status) query.status = status;
    if (device) query.device = device;
    if (country) query.country = { $regex: country, $options: 'i' };
    
    if (captcha === 'true') {
      query.captchaPassed = true;
    } else if (captcha === 'false') {
      query.captchaPassed = { $ne: true };
    }

    if (score) {
      const [min, max] = score.split('-').map(Number);
      query.score = { $gte: min, $lte: max };
    }

    if (search) {
      // Find matching users first
      const matchingUsers = await User.find({ 
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ] 
      }).select('_id');
      
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
          { url: { $regex: search, $options: 'i' } },
          { userId: { $in: userIds } }
      ];
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      logs: logs || [],
      total: total || 0,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('getAuditLogs Critical Error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    
    // Total audits (scans)
    const totalAudits = await AuditLog.countDocuments();
    
    // Total reports downloaded from ActivityLog
    const totalDownloads = await ActivityLog.countDocuments({ action: 'REPORT_DOWNLOAD' });
    
    // Total projects (websites) added across all users
    const projectAggregation = await User.aggregate([
      { $project: { numberOfWebsites: { $size: { $ifNull: ["$websites", []] } } } },
      { $group: { _id: null, total: { $sum: "$numberOfWebsites" } } }
    ]);
    const totalProjects = projectAggregation[0]?.total || 0;

    // Average Score across all successful audits
    const avgScoreAggregation = await AuditLog.aggregate([
      { $match: { status: 'success', score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$score" } } }
    ]);
    const avgScore = Math.round(avgScoreAggregation[0]?.avg || 0);

    // Get today's active users (activeToday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: today } });

    res.json({
      success: true,
      totalUsers: totalUsers || 0,
      totalAudits: totalAudits || 0,
      totalDownloads: totalDownloads || 0,
      totalProjects: totalProjects || 0,
      activeToday: activeToday || 0,
      avgScore: avgScore || 0
    });
  } catch (error) {
    console.error('getStats Error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getOverviewStats = async (req, res) => {
  try {
    const today = new Date();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(today.getDate() - 14);

    // 1. Mini Stats
    const totalUsers = await User.countDocuments();
    const totalAudits = await AuditLog.countDocuments();
    const activeToday = await User.countDocuments({ updatedAt: { $gte: new Date().setHours(0,0,0,0) } });
    
    const avgScoreResult = await AuditLog.aggregate([
      { $match: { status: 'success', score: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$score" } } }
    ]);
    const avgScore = Math.round(avgScoreResult[0]?.avg || 0);

    const totalDownloads = await ActivityLog.countDocuments({ action: 'REPORT_DOWNLOAD' });

    const guestCountResult = await AuditLog.aggregate([
      { $match: { userId: null } },
      { $group: { _id: "$sessionId" } },
      { $count: "total" }
    ]);
    const totalGuests = guestCountResult[0]?.total || 0;

    // 1.6 Avg Audit Processing Time
    const avgDurationResult = await AuditLog.aggregate([
      { $match: { status: 'success', auditDuration: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$auditDuration" } } }
    ]);
    const avgDuration = Math.round((avgDurationResult[0]?.avg || 0) / 1000); // in seconds

    // 1.7 Failed Audits (%)
    const totalFailed = await AuditLog.countDocuments({ status: 'failed' });
    const failedRate = totalAudits > 0 ? Math.round((totalFailed / totalAudits) * 100) : 0;

    // 2. Volume Data (Last 14 days)
    const volumeData = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // 2.5 Score Trend (Avg Score per day)
    const scoreTrend = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo }, status: 'success' } },
      {
        $group: {
          _id: { $dateToString: { format: "%m/%d", date: "$createdAt" } },
          score: { $avg: "$score" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          _id: 1,
          score: { $round: ["$score", 0] },
          count: 1
        }
      }
    ]);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const auditsToday = await AuditLog.countDocuments({ createdAt: { $gte: startOfToday } });

    // 2.7 Country Split
    const countrySplit = await AuditLog.aggregate([
      {
        $group: {
          _id: "$country",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // 3. Score Distribution
    const distribution = await AuditLog.aggregate([
      {
        $group: {
          _id: null,
          good: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "success"] }, { $gte: ["$score", 80] }] }, 1, 0] } },
          average: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "success"] }, { $gte: ["$score", 50] }, { $lt: ["$score", 80] }] }, 1, 0] } },
          poor: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "success"] }, { $lt: ["$score", 50] }] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } }
        }
      }
    ]);

    // 4. Device Split
    const deviceSplit = await AuditLog.aggregate([
      {
        $group: {
          _id: { $toLower: "$device" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 5. Recent Audits
    const recentAudits = await AuditLog.find()
      .select('url score createdAt status device')
      .sort({ createdAt: -1 })
      .limit(5);

    // 6. Recent Activity (from ActivityLog)
    const recentActivity = await ActivityLog.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(10);

    // 7. Active Users (All Users with stats)
    const activeUsers = await User.aggregate([
      {
        $lookup: {
          from: "auditlogs",
          localField: "_id",
          foreignField: "userId",
          as: "audits"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          lastLogin: 1,
          role: 1,
          auditsRun: { $size: "$audits" },
          avgScore: { $avg: "$audits.score" }
        }
      },
      { $sort: { auditsRun: -1, lastLogin: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          lastLogin: 1,
          role: 1,
          auditsRun: 1,
          avgScore: { $round: ["$avgScore", 0] }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAudits,
        activeToday,
        avgScore,
        totalDownloads,
        totalGuests,
        avgDuration,
        failedRate,
        auditsToday
      },
      volumeData: volumeData.map(v => ({ name: v._id, completed: v.completed, failed: v.failed })),
      scoreTrend: scoreTrend.map(s => ({ name: s._id, score: s.score, count: s.count })),
      distribution: distribution[0] || { good: 0, average: 0, poor: 0, failed: 0 },
      countrySplit: countrySplit.map(c => ({ name: c._id || 'Unknown', count: c.count })),
      deviceSplit: deviceSplit.map(d => ({ 
        name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Unknown', 
        count: d.count 
      })),
      recentAudits,
      recentActivity,
      activeUsers
    });
  } catch (error) {
    console.error('getOverviewStats Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ── Dynamic Platform Configuration System ───────────────────

/**
 * Fetch all platform configurations.
 * Masks secret values (e.g., 'sk-****') for UI safety.
 */
export const getConfigs = async (req, res) => {
  try {
    const configs = await PlatformConfig.find().sort({ group: 1, key: 1 });
    
    const maskedConfigs = configs.map(c => {
      const configObj = c.toObject();
      if (c.isSecret && configObj.value) {
        const plainValue = decrypt(configObj.value);
        if (plainValue && plainValue.length > 6) {
          configObj.value = `${plainValue.substring(0, 3)}••••${plainValue.substring(plainValue.length - 3)}`;
        } else {
          configObj.value = '••••••••';
        }
      }
      return configObj;
    });

    res.json({ success: true, configs: maskedConfigs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch configurations' });
  }
};

/**
 * Save or update a platform configuration.
 * Automatically encrypts if isSecret is true and increments version.
 */
export const saveConfig = async (req, res) => {
  const { key, value, label, group, isSecret, changeReason } = req.body;
  
  if (!key || value === undefined) {
    return res.status(400).json({ success: false, message: 'Key and value are required' });
  }

  try {
    const upperKey = key.toUpperCase();
    const valueToSave = isSecret ? encrypt(value) : value;
    
    let config = await PlatformConfig.findOne({ key: upperKey });
    let isCreate = !config;
    let newVersion = 1;

    if (config) {
      // ── Save version snapshot before overwriting ──
      await ConfigVersion.create({
        key: config.key,
        value: config.value,           // stores as currently encrypted in DB
        version: config.version || 1,
        isSensitive: config.isSecret,
        changedBy: req.user.userId,
        changeReason: changeReason || 'Updated via Admin UI'
      });

      newVersion = (config.version || 1) + 1;
      
      config.value = valueToSave;
      config.label = label || config.label;
      config.group = group || config.group;
      config.isSecret = isSecret !== undefined ? isSecret : config.isSecret;
      config.version = newVersion;
      config.updatedBy = req.user.userId;
      
      await config.save();
    } else {
      config = new PlatformConfig({
        key: upperKey,
        value: valueToSave,
        label: label || key,
        group: group || 'general',
        isSecret: isSecret !== undefined ? isSecret : false,
        version: 1,
        updatedBy: req.user.userId
      });
      await config.save();
    }

    // ── Audit Log ──
    await ConfigAuditLog.create({
      key: upperKey,
      action: isCreate ? 'CREATE' : 'UPDATE',
      version: newVersion,
      updatedBy: req.user.userId,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { action: isCreate ? 'Initial Sync' : 'Manual Update' }
    });

    // Refresh the in-memory cache
    await configService.refreshCache();

    res.json({ 
      success: true, 
      message: `Configuration for ${upperKey} ${isCreate ? 'created' : 'updated'} to v${newVersion}`,
      config: {
        ...config.toObject(),
        value: isSecret ? '••••••••' : value
      }
    });
  } catch (error) {
    console.error('saveConfig error:', error);
    res.status(500).json({ success: false, error: 'Failed to save configuration' });
  }
};

/**
 * Optional: Test a configuration (e.g., verify API key validity).
 */
export const testConfig = async (req, res) => {
  const { key } = req.body;
  if (!key) return res.status(400).json({ success: false, message: 'Key is required to test' });

  try {
    const value = await configService.get(key);
    
    if (key.toUpperCase() === 'GEMINI_API_KEY') {
      try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${value}`, {
          contents: [{ parts: [{ text: 'hi' }] }]
        });
        if (response.data) {
          return res.json({ success: true, message: 'Gemini API Key is valid!' });
        }
      } catch (axErr) {
        return res.status(400).json({ 
          success: false, 
          message: 'Gemini API key validation failed', 
          error: axErr.response?.data?.error?.message || axErr.message 
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Value for ${key} retrieved from system. No automated test integration yet for this key.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Test failed', details: error.message });
  }
};

/**
 * Reveal a secret configuration value.
 * Decrypts and logs the access for auditing.
 */
export const revealConfig = async (req, res) => {
  const { key } = req.params;
  if (!key) return res.status(400).json({ success: false, message: 'Key is required' });

  try {
    const config = await PlatformConfig.findOne({ key: key.toUpperCase() });
    
    if (!config) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }

    if (!config.isSecret) {
      return res.json({ success: true, value: config.value });
    }

    const decryptedValue = decrypt(config.value);

    // Audit Log for security compliance using the dedicated ConfigAuditLog model
    await ConfigAuditLog.create({
      key: key.toUpperCase(),
      action: 'REVEAL',
      updatedBy: req.user.userId,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      userAgent: req.headers['user-agent'] || 'unknown',
      metadata: { timestamp: new Date() },
    });

    res.json({ success: true, value: decryptedValue });
  } catch (error) {
    console.error('revealConfig error:', error);
    res.status(500).json({ success: false, error: 'Failed to decrypt value. Key might be corrupt or ENCRYPTION_KEY has changed.' });
  }
};
