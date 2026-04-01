import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';

export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    // Use AuditLog for granular audit details
    const audits = await AuditLog.find({ 
      userId: req.user.userId, 
      status: { $in: ['success', 'pending', 'failed'] }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    const total = await AuditLog.countDocuments({ 
      userId: req.user.userId, 
      status: { $in: ['success', 'pending', 'failed'] }
    });

    res.json({
      audits,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getActivity = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const logs = await ActivityLog.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ActivityLog.countDocuments({ userId: req.user.userId });

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.name = name;
    await user.save();

    // Log update
    await ActivityLog.create({
      userId: user._id,
      sessionId: 'N/A',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      action: 'PROFILE_UPDATE',
      metadata: { newName: name },
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
