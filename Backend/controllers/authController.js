import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import PasswordReset from '../models/PasswordReset.js';
import sendEmail from '../utils/sendEmail.js';
import generateOTP from '../utils/generateOTP.js';

// 4.4.1 Register user (local auth)
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters long' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Wait! Invalid email address.' });
    }

    // Validate password
    const passRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passRegex.test(password)) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters with 1 uppercase and 1 number' });
    }

    // Check existing email
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(409).json({ success: false, message: 'Email already registered and verified' });
      } else {
        // If not verified, we can allow re-registration (overwrite or update)
        await User.deleteOne({ _id: existingUser._id });
        console.log(`[Registration] Overwriting unverified account for ${email.toLowerCase()}`);
      }
    }

    // Create user (Pre-save hook handles hashing)
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      authProvider: 'local',
      isEmailVerified: false
    });

    // Generate 6-digit OTP
    const rawOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(rawOTP, 10);

    // Store in OTP collection (10 minutes)
    await OTP.deleteMany({ email: email.toLowerCase() }); // Clear old OTPs
    await OTP.create({
      email: email.toLowerCase(),
      otp: hashedOTP,
      purpose: 'email_verify',
      expiresAt: new Date(Date.now() + 600000)
    });

    // Send OTP email
    await sendEmail({
      to: email.toLowerCase(),
      subject: `Verify your Dealerpulse account – OTP: ${rawOTP}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1e3a8a;">Verify your account</h2>
          <p>Please enter the following 6-digit code to verify your Dealerpulse account. This code is valid for 10 minutes.</p>
          <div style="background: #f3f4f6; color: #1e3a8a; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; padding: 15px; margin: 20px 0; border-radius: 5px; font-family: monospace;">
            ${rawOTP}
          </div>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `
    });

    res.status(201).json({
      success: true,
      message: 'OTP sent to email. Please verify to activate account.',
      email: email.toLowerCase()
    });

  } catch (err) {
    console.error('[Registration] Failed:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.4.2 Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Missing email or OTP' });
    }

    const doc = await OTP.findOne({ email: email.toLowerCase(), purpose: 'email_verify' });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'OTP expired or not found. Request a new one.' });
    }

    if (new Date(doc.expiresAt) < new Date()) {
      await OTP.deleteOne({ _id: doc._id });
      return res.status(410).json({ success: false, message: 'OTP expired' });
    }

    // Increment attempts
    doc.attempts += 1;
    if (doc.attempts > 5) {
      await OTP.deleteOne({ _id: doc._id });
      return res.status(429).json({ success: false, message: 'Too many attempts. Request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, doc.otp);
    if (!isMatch) {
      await doc.save();
      return res.status(400).json({ success: false, message: 'Invalid OTP', attemptsLeft: 5 - doc.attempts });
    }

    // Successful Verification
    await OTP.deleteOne({ _id: doc._id });
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isEmailVerified: true },
      { new: true }
    );

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      message: 'Email verified!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (err) {
    console.error('[Verification] Failed:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.4.3 Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'User not found or already verified' });
    }

    // Rate limiting: wait 60s
    const lastOTP = await OTP.findOne({ email: email.toLowerCase() }).sort({ createdAt: -1 });
    if (lastOTP && (Date.now() - new Date(lastOTP.createdAt).getTime()) < 60000) {
      return res.status(429).json({ success: false, message: 'Please wait 60 seconds before requesting a new OTP' });
    }

    await OTP.deleteMany({ email: email.toLowerCase() });
    
    const rawOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(rawOTP, 10);

    await OTP.create({
      email: email.toLowerCase(),
      otp: hashedOTP,
      expiresAt: new Date(Date.now() + 600000)
    });

    await sendEmail({
      to: email.toLowerCase(),
      subject: `Verify your Dealerpulse account – New OTP: ${rawOTP}`,
      html: `<h2>Verify your account</h2><p>Your new code is: <b>${rawOTP}</b>. Expired in 10 minutes.</p>`
    });

    res.status(200).json({ success: true, message: 'New OTP sent to your email.' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.4.4 Local login (Email + Password)
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email?.toLowerCase(); // Case-insensitive email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ success: false, message: 'This account uses Google Sign-In. Please log in with Google.' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please check your inbox for the OTP.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        authProvider: user.authProvider,
        avatar: user.avatar,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.4.5 Forgot password initiation
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Safety rule: Always return 200 to prevent email enumeration
    res.status(200).json({ success: true, message: 'If that email is registered, a reset link has been sent.' });

    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || user.authProvider === 'google') return;

    const rawToken = uuidv4();
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.deleteMany({ email: email.toLowerCase() });
    await PasswordReset.create({
      email: email.toLowerCase(),
      token: hashedToken,
      expiresAt: new Date(Date.now() + 3600000)
    });

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(email.toLowerCase())}`;

    await sendEmail({
      to: email.toLowerCase(),
      subject: 'Reset your Dealerpulse password',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
          <h2>Reset Password</h2>
          <p>We received a request to reset your password. Click the button below to proceed.</p>
          <a href="${resetURL}" style="display: inline-block; background: #1e3a8a; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; margin: 20px 0;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        </div>
      `
    });

  } catch (err) {
    console.error('[Forgot Password] error:', err.message);
  }
};

// 4.4.6 Reset password action
export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    const passRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passRegex.test(newPassword)) {
      return res.status(400).json({ success: false, message: 'Password too weak.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const doc = await PasswordReset.findOne({ email: email.toLowerCase(), token: hashedToken, used: false });

    if (!doc) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or expired.' });
    }

    if (new Date(doc.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, message: 'Reset link expired. Request a new one.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    user.password = newPassword;
    user.isEmailVerified = true;
    await user.save();

    doc.used = true;
    await doc.save();

    res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// 4.4.7 Google callback logic
export const googleCallback = (req, res) => {
  const token = jwt.sign(
    { userId: req.user._id, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  // Redirect with hash fragment to keep it out of logs
  const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback#token=${token}`;
  console.log(`[Google OAuth] Redirecting to: ${redirectUrl.split('#')[0]}#token=[REDACTED]`);
  res.redirect(redirectUrl);
};

// Get profile
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
