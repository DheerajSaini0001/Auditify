import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import configService from '../services/configService.js';

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

  if (!token) {
    return res.status(401).json({
      error: 'No token provided',
      code: 'NO_TOKEN'
    });
  }

  try {
    const jwtSecret = configService.getConfig('JWT_SECRET');
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });

    // Load the live user so role/block/revocation changes take effect immediately.
    const user = await User.findById(decoded.userId).select('role isBlocked tokenVersion email');
    if (!user) {
      return res.status(401).json({ error: 'User not found', code: 'INVALID_TOKEN' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked', code: 'ACCOUNT_BLOCKED' });
    }
    if (typeof decoded.tv === 'number' && decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ error: 'Session expired. Please log in again.', code: 'TOKEN_REVOKED' });
    }

    req.user = { userId: user._id, email: user.email, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

const checkRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NO_AUTH' });
  }

  const isAllowed = allowedRoles.includes(req.user.role) ||
    (allowedRoles.includes('admin') && req.user.role === 'super_admin');

  if (!isAllowed) {
    return res.status(403).json({
      error: 'Access denied: insufficient role',
      code: 'INSUFFICIENT_ROLE'
    });
  }
  next();
};

const tryAuthenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

  if (token) {
    try {
      const jwtSecret = configService.getConfig('JWT_SECRET');
      const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      req.user = decoded; // { userId, role }
    } catch (error) {
      // Ignore token errors for optional authentication
    }
  }
  next();
};

export { verifyToken, checkRole, tryAuthenticate };
