import jwt from 'jsonwebtoken';
import configService from '../services/configService.js';
import User from '../models/User.js';

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
    const decoded = jwt.verify(token, jwtSecret);

    // Re-check the account against the DB so a blocked/deleted user's still-valid
    // token is rejected, and so role changes take effect without waiting for expiry.
    const account = await User.findById(decoded.userId).select('role isBlocked');
    if (!account) {
      return res.status(401).json({ error: 'Account no longer exists', code: 'NO_ACCOUNT' });
    }
    if (account.isBlocked) {
      return res.status(403).json({ error: 'Account suspended', code: 'ACCOUNT_BLOCKED' });
    }

    req.user = { ...decoded, role: account.role }; // role refreshed from source of truth
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

const checkRole = (...allowedRoles) => (req, res, next) => {
  console.log(`[Role Check] User: ${req.user.email} | Role: ${req.user.role} | Allowed: [${allowedRoles.join(', ')}]`);
  
  const isAllowed = allowedRoles.includes(req.user.role) || (allowedRoles.includes('admin') && req.user.role === 'super_admin');
  
  if (!req.user || !isAllowed) {
    console.warn(`[Role Check] Access Denied: User ${req.user.userId} (Role: ${req.user.role}) attempted restricted action.`);
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
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // { userId, role }
    } catch (error) {
      // Ignore token errors for optional authentication
    }
  }
  next();
};

export { verifyToken, checkRole, tryAuthenticate };
