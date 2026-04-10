import { v4 as uuidv4 } from "uuid";

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
    if (err) console.error("Session save error:", err);
    res.json({ question: `${a} ${op} ${b}`, captchaId });
  });
};
