const captchaValidator = (req, res, next) => {
  const { captchaAnswer, captchaId } = req.body;
  
  // Try to find answer in the map (new system) or direct property (legacy flow)
  let stored;
  if (captchaId && req.session.captchas) {
    stored = req.session.captchas[captchaId];
  } else {
    stored = req.session.captchaAnswer;
  }

  console.log(`[Captcha Debug] ID: ${captchaId || 'N/A'}, Stored: ${stored}, Received: ${captchaAnswer}, SessionID: ${req.sessionID}`);

  if (stored === undefined || stored === null) {
    return res.status(400).json({ success: false, error: 'CAPTCHA session expired. Please refresh.' });
  }

  if (parseInt(captchaAnswer) !== stored) {
    // Keep it if wrong to allow retry? Or clear? Usually better to clear to prevent brute force
    if (captchaId && req.session.captchas) delete req.session.captchas[captchaId];
    req.session.captchaAnswer = null;
    return res.status(400).json({ success: false, error: 'Invalid CAPTCHA. Please try again.' });
  }

  // Clear on success
  if (captchaId && req.session.captchas) delete req.session.captchas[captchaId];
  req.session.captchaAnswer = null;
  
  next();
};

export default captchaValidator;
