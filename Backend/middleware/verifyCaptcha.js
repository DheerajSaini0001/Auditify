import axios from 'axios';
import configService from '../services/configService.js';

const verifyCaptcha = async (req, res, next) => {
  const token = req.body?.captchaToken;

  // Skip CAPTCHA for authenticated users
  if (req.user) {
    console.log(`[reCAPTCHA] Skipping for authenticated user: ${req.user.email || req.user.userId}`);
    return next();
  }

  if (!token) {
    return res.status(400).json({
      error: 'CAPTCHA verification required',
      code: 'CAPTCHA_FAILED'
    });
  }

  try {
    const verifyURL = configService.getConfig('RECAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify');
    
    const response = await axios.post(verifyURL, null, {
      params: {
        secret: configService.getConfig('RECAPTCHA_SECRET_KEY'),
        response: token,
      },
    });

    const data = response.data;

    if (!data.success) {
      return res.status(400).json({
        error: 'CAPTCHA verification failed',
        code: 'CAPTCHA_FAILED'
      });
    }

    next();
  } catch (err) {
    console.error('[reCAPTCHA] Verification error:', err.message);
    return res.status(500).json({
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
};

export default verifyCaptcha;
