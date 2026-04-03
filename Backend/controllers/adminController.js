import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';

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
      { $project: { numberOfWebsites: { $size: "$websites" } } },
      { $group: { _id: null, total: { $sum: "$numberOfWebsites" } } }
    ]);
    const totalProjects = projectAggregation[0]?.total || 0;

    // Active Today (unique users logged in last 24h)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeToday = await User.countDocuments({ lastLogin: { $gte: last24h } });

    res.json({
      success: true,
      totalUsers: totalUsers || 0,
      totalAudits: totalAudits || 0,
      totalDownloads: totalDownloads || 0,
      totalProjects: totalProjects || 0,
      activeToday: activeToday || 0
    });
  } catch (error) {
    console.error('getStats Error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
