import { v4 as uuidv4 } from "uuid";
import logger from "../utils/logger.js";

export const generateCaptcha = (req, res) => {
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;
  const ops = ['+', '-'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const [a, b] = op === '-' ? [Math.max(num1, num2), Math.min(num1, num2)] : [num1, num2];
  const answer = op === '+' ? a + b : a - b;
  const captchaId = uuidv4();
  
  if (!req.session.captchas) {
    req.session.captchas = {};
  }
  
  // Store answer with ID (keep max 5 to prevent bloat)
  req.session.captchas[captchaId] = answer;
  const keys = Object.keys(req.session.captchas);
  if (keys.length > 5) {
    delete req.session.captchas[keys[0]];
  }

  req.session.save((err) => {
    if (err) logger.error("Session save error", err);
    res.json({ question: `${a} ${op} ${b}`, captchaId });
  });
};

export const verifyCaptcha = (req, res) => {
  const { captchaAnswer, captchaId } = req.body;
  
  let stored;
  if (captchaId && req.session.captchas) {
    stored = req.session.captchas[captchaId];
  } else {
    stored = req.session.captchaAnswer;
  }

  if (stored === undefined || stored === null) {
    return res.status(400).json({ success: false, error: 'CAPTCHA session expired. Please refresh.' });
  }

  if (parseInt(captchaAnswer) !== stored) {
    return res.status(400).json({ success: false, error: 'Invalid CAPTCHA. Please try again.' });
  }

  res.json({ success: true, message: 'CAPTCHA verified' });
};
