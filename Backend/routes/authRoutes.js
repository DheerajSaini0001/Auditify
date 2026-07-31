import express from 'express';
import passport from 'passport';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
  otpLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// 4.8.1 Auth endpoints — each guarded by an IP-based rate limiter. The captcha
// that used to sit in front of register/login/forgot-password was removed; the
// per-IP limiters above are now the only bot speed bump on this surface.
router.post('/register', registerLimiter, authController.register);
router.post('/verify-otp', otpLimiter, authController.verifyOTP);
router.post('/resend-otp', otpLimiter, authController.resendOTP);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/reset-password', passwordResetLimiter, authController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/webmasters'],
    accessType: 'offline', // ensure we get a refresh token
    prompt: 'consent'      // always show consent screen to get refresh token
}));

router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    authController.googleCallback
);

// Get me
router.get('/me', protect, authController.getMe);

export default router;
