// Admin Authentication Middleware
// Verifies the JWT, loads the user, and requires an admin/super_admin role.
// Fails CLOSED — any missing/invalid token or insufficient role is rejected.

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import configService from '../services/configService.js';

const adminAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const jwtSecret = configService.getConfig('JWT_SECRET');
    const decoded = jwt.verify(header.split(' ')[1], jwtSecret, { algorithms: ['HS256'] });

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: 'Account is blocked' });
    }
    if (typeof decoded.tv === 'number' && decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Access denied: Requires Admin role' });
    }

    req.user = user;
    req.user.userId = user._id;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

export default adminAuth;
