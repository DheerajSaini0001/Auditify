import express from 'express';
import passport from 'passport';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 4.8.1 Auth endpoints
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/webmasters.readonly'],
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
