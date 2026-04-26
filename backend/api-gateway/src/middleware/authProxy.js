const jwt = require('jsonwebtoken');

/**
 * JWT verification middleware for the API Gateway.
 * Extracts the JWT from HttpOnly cookies, verifies it, and attaches
 * x-user-id, x-user-role, x-user-email headers for downstream services.
 */
const authProxy = (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id'] = String(decoded.user_id);
    req.headers['x-user-role'] = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Admin role verification middleware.
 */
const requireAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = { authProxy, requireAdmin };
