import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';

export const getAllUsers = async (req, res) => {
  try {
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
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
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

    // Get recent activity
    const activitySummary = await ActivityLog.find({ userId: user._id })
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({ user, activitySummary });
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
    const { page = 1, limit = 20, ip, from, to } = req.query;

    const query = {};
    if (ip) {
      query.ip = { $regex: ip, $options: 'i' };
    }
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await AuditLog.countDocuments(query);
    
    // Aggregate unique IPs count
    const uniqueIps = await AuditLog.distinct('ip');

    res.json({
      logs,
      total,
      uniqueIpsCount: uniqueIps.length,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('getAuditLogs Error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    
    // Total audits from session AuditLog (more accurate for technical monitoring)
    const totalAudits = await AuditLog.countDocuments();
    
    // Unique IPs count from AuditLog
    const uniqueIps = await AuditLog.distinct('ip');
    
    // Active Today (unique users logged in last 24h)
    const today = new Date();
    today.setHours(0,0,0,0);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: today } });

    // Suspicious IPs (e.g. IPs with more than 10 failed audits or high frequency)
    // For now, let's just count failed audits status as suspicious signal
    const suspiciousCount = await AuditLog.countDocuments({ status: 'failed' });

    res.json({
      totalUsers,
      totalAudits,
      activeToday,
      blockedUsers,
      uniqueIpsCount: uniqueIps.length,
      suspiciousCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
