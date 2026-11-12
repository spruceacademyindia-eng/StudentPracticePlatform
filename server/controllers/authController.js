const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'spruce_jwt_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin,
    },
  });
};

// @route  POST /api/auth/register
// @access Public (Student self-registration)
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address is already registered.' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone: phone || null,
      role: 'STUDENT',
      status: 'ACTIVE',
      lastLogin: new Date(),
    });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/login
// @access Public (Students & Admins)
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({ success: false, message: 'Your account is blocked. Contact support.' });
    }
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is inactive. Contact support.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/admin-login
// @access Public (Strictly for ADMIN role)
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Admin email and password are required.' });
    }

    const user = await User.findOne({ email, role: 'ADMIN' }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid administrator credentials.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Administrator account is disabled.' });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/auth/me
// @access Protected
exports.getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id: req.user._id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      name: `${req.user.firstName} ${req.user.lastName}`.trim(),
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      lastLogin: req.user.lastLogin,
      phone: req.user.phone,
    },
  });
};

// @route  POST /api/auth/change-password
// @access Protected
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/forgot-password
// @access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email address is required.' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak user existence
      return res.status(200).json({ success: true, message: 'If an account exists, a reset token has been issued.' });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a production app with SMTP, email the token. Here return it securely for demo/testing
    res.status(200).json({
      success: true,
      message: 'Reset instructions generated.',
      resetToken, // for testing / reset flow
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/reset-password
// @access Public
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token is invalid or has expired.' });
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/auth/logout
// @access Public
exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
