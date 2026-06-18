import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import AuditLog from '../models/AuditLog.js';
import SingleAuditReport from '../models/singleAuditReport.js';
import auditStore from '../utils/auditStore.js';

export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const userId = req.user.userId;

    // AuditLog is a permanent log of every audit ever run; the actual reports live in
    // SingleAuditReport and are deleted by a Mongo TTL after a few hours. So we only
    // show history rows whose report STILL EXISTS — otherwise the count (e.g. "47
    // results") includes long-gone reports the user can't open.
    //
    // A report "exists" if it's in Mongo OR still held in the in-memory auditStore
    // (in-progress, or completed-but-not-yet-flushed). We union both so e.g. 3 buffered
    // + 4 in Mongo correctly shows 7.
    const singleIds = await SingleAuditReport.find({ userId }).distinct('_id');
    const memoryIds = auditStore.liveReportIdsForUser(userId);
    const existingSingleIds = [...singleIds, ...memoryIds];

    const query = {
      userId,
      status: { $in: ['success', 'pending', 'failed'] },
      reportId: { $in: existingSingleIds },
    };

    if (search && typeof search === 'string') {
      // Escape special regex characters safely (excluding slashes to prevent PCRE compilation errors)
      const escapedSearch = search.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
      query.url = { $regex: escapedSearch, $options: 'i' };
    }

    const [audits, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      AuditLog.countDocuments(query),
    ]);

    // Every returned row was matched against an existing report above.
    const auditsWithExistence = audits.map((audit) => ({
      ...audit.toObject(),
      reportExists: true,
    }));

    res.json({
      audits: auditsWithExistence,
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

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters', code: 'INVALID_NAME' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    user.name = name.trim();
    await user.save();

    // Log update
    await ActivityLog.create({
      userId: user._id,
      sessionId: 'N/A',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0',
      action: 'PROFILE_UPDATE',
      metadata: { newName: user.name },
    });

    // Return only safe fields — never the password hash or stored OAuth tokens.
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
