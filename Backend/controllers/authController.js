import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '1d',
  });
};

const logActivity = async (userId, sessionId, action, deviceInfo, metadata = {}) => {
  try {
    await ActivityLog.create({
      userId,
      sessionId,
      ip: deviceInfo.ip,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      action,
      metadata,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_EXISTS' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken(user._id, user.role);

    // Log registration
    await logActivity(user._id, 'N/A', 'REGISTER', req.deviceInfo);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password', code: 'WRONG_CREDENTIALS' });
    }

    // Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        error: 'Account suspended', 
        code: 'ACCOUNT_BLOCKED',
        reason: user.blockReason 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Log failed login
      await ActivityLog.create({
        userId: user._id,
        sessionId: 'N/A',
        ip: req.deviceInfo.ip,
        action: 'FAILED_LOGIN',
        metadata: { attemptedEmail: email }
      });
      return res.status(401).json({ error: 'Invalid email or password', code: 'WRONG_CREDENTIALS' });
    }

    const sessionId = uuidv4();
    const token = generateToken(user._id, user.role);

    // Update user stats
    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    // Log login
    await logActivity(user._id, sessionId, 'LOGIN', req.deviceInfo, { sessionId });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const logout = async (req, res) => {
  try {
    // Log logout if possible
    if (req.user) {
      await logActivity(req.user.userId, 'N/A', 'LOGOUT', req.deviceInfo || { ip: 'N/A' });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid current password', code: 'VALIDATION_ERROR' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
