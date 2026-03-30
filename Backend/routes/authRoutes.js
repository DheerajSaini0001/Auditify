import express from 'express';
import { body, validationResult } from 'express-validator';
import * as authController from '../controllers/authController.js';
import verifyCaptcha from '../middleware/verifyCaptcha.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import deviceParser from '../middleware/deviceParser.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      code: 'VALIDATION_ERROR', 
      details: errors.array() 
    });
  }
  next();
};

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('email').isEmail().normalizeEmail().isLength({ max: 254 }),
  body('password').isLength({ min: 8, max: 72 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('captchaToken').not().isEmpty().isString(),
  validate
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').not().isEmpty(),
  body('captchaToken').not().isEmpty().isString(),
  validate
];

const changePasswordValidation = [
  body('currentPassword').not().isEmpty(),
  body('newPassword').isLength({ min: 8, max: 72 }).matches(/[A-Z]/).matches(/[0-9]/),
  validate
];

router.post('/register', authLimiter, deviceParser, registerValidation, verifyCaptcha, authController.register);
router.post('/login', authLimiter, deviceParser, loginValidation, verifyCaptcha, authController.login);
router.post('/logout', verifyToken, deviceParser, authController.logout);
router.get('/me', verifyToken, authController.getMe);
router.put('/change-password', verifyToken, changePasswordValidation, authController.changePassword);

export default router;
