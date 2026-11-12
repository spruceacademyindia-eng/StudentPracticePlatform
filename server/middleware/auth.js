const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach active user to req
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'spruce_jwt_secret_key');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Your account has been blocked. Contact administrator.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Contact administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

// Restrict to specific roles ('ADMIN', 'STUDENT')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'Guest'}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
