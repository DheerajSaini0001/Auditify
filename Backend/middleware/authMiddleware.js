import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Middleware: protect
 * Verifies JWT from Authorization header and attaches user object to req.user.
 * Rejects with 401 if token is missing, invalid, or user not found.
 */
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach fresh user object (minus password)
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    // For compatibility with any code expecting req.user.userId
    req.user.userId = user._id; 
    
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};
