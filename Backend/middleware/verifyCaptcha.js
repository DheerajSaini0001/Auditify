/**
 * Middleware: verifyRecaptcha (v3 Invisible)
 * Validates the reCAPTCHA token sent in req.body.recaptchaToken using native Fetch
 */
const verifyRecaptcha = async (req, res, next) => {
  const token = req.body?.recaptchaToken;

  if (!token) {
    return res.status(403).json({
      success: false,
      message: 'CAPTCHA token is required. Please complete the security check.',
    });
  }

  try {
    const verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
    
    // Using native fetch (Node 18+)
    const response = await fetch(verifyURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    console.log('[reCAPTCHA Response]:', data);

    if (!data.success) {
      return res.status(403).json({
        success: false,
        message: 'CAPTCHA verification failed. Please try again.',
        errorCodes: data['error-codes'],
      });
    }

    // Token valid — proceed to audit handler
    next();
  } catch (err) {
    console.error('[reCAPTCHA] Verification error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'CAPTCHA service unavailable. Please try again later.',
    });
  }
};

export default verifyRecaptcha;
