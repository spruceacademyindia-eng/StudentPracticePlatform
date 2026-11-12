const Settings = require('../models/Settings');
const User = require('../models/User');

// Helper
const getSettings = async () => {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  return s;
};

// @route  GET /api/admin/settings
// @access Admin
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/admin/settings
// @access Admin
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true,
      });
    }
    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/admin/users
// @access Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ success: true, total, users });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/admin/users/:id/toggle
// @access Admin — activate/deactivate a user
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/admin/create-admin
// @access Admin — create another admin account
exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const admin = await User.create({ name, email, password, role: 'admin' });
    res.status(201).json({ success: true, user: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
  } catch (err) {
    next(err);
  }
};
