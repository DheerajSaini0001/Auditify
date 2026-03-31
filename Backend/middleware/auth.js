import jwt from 'jsonwebtoken';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // 'Bearer <token>'

  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided', 
      code: 'NO_TOKEN' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Invalid or expired token', 
      code: 'INVALID_TOKEN' 
    });
  }
};

const checkRole = (...allowedRoles) => (req, res, next) => {
  console.log(`[Role Check] User: ${req.user.email} | Role: ${req.user.role} | Allowed: [${allowedRoles.join(', ')}]`);
  
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    console.warn(`[Role Check] Access Denied: User ${req.user.email} (Role: ${req.user.role}) attempted restricted action.`);
    return res.status(403).json({ 
      error: 'Access denied: insufficient role', 
      code: 'INSUFFICIENT_ROLE' 
    });
  }
  next();
};

export { verifyToken, checkRole };
