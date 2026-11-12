const User = require('../models/User');
const TypingAttempt = require('../models/TypingAttempt');
const { logAdminAction } = require('../utils/logger');

// @route  GET /api/users
// @access Admin only
exports.getUsers = async (req, res, next) => {
  try {
    const { role = 'STUDENT', status, search, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    // Attach student stats (total attempts, best WPM, avg accuracy)
    const userIds = users.map((u) => u._id);
    const statsAgg = await TypingAttempt.aggregate([
      { $match: { student: { $in: userIds } } },
      {
        $group: {
          _id: '$student',
          totalAttempts: { $sum: 1 },
          bestWpm: { $max: '$actualWPM' },
          avgWpm: { $avg: '$actualWPM' },
          avgAccuracy: { $avg: '$accuracy' },
        },
      },
    ]);

    const statsMap = {};
    statsAgg.forEach((s) => {
      statsMap[s._id.toString()] = {
        totalAttempts: s.totalAttempts,
        bestWpm: Math.round(s.bestWpm || 0),
        avgWpm: Math.round(s.avgWpm || 0),
        avgAccuracy: Math.round(s.avgAccuracy || 0),
      };
    });

    const enrichedUsers = users.map((u) => {
      const stats = statsMap[u._id.toString()] || {
        totalAttempts: 0,
        bestWpm: 0,
        avgWpm: 0,
        avgAccuracy: 0,
      };
      return {
        ...u.toObject(),
        stats,
      };
    });

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      users: enrichedUsers,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/users/:id
// @access Admin only
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Performance summary
    const [summary, recentAttempts] = await Promise.all([
      TypingAttempt.aggregate([
        { $match: { student: user._id } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            practiceAttempts: { $sum: { $cond: [{ $eq: ['$mode', 'PRACTICE'] }, 1, 0] } },
            challengeAttempts: { $sum: { $cond: [{ $eq: ['$mode', 'CHALLENGE'] }, 1, 0] } },
            challengePassed: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
            challengeFailed: { $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] } },
            bestWpm: { $max: '$actualWPM' },
            avgWpm: { $avg: '$actualWPM' },
            avgAccuracy: { $avg: '$accuracy' },
          },
        },
      ]),
      TypingAttempt.find({ student: user._id })
        .populate('content', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    const stats = summary[0] || {
      totalAttempts: 0,
      practiceAttempts: 0,
      challengeAttempts: 0,
      challengePassed: 0,
      challengeFailed: 0,
      bestWpm: 0,
      avgWpm: 0,
      avgAccuracy: 0,
    };

    const passRate = stats.challengeAttempts
      ? Math.round((stats.challengePassed / stats.challengeAttempts) * 100)
      : 0;

    res.status(200).json({
      success: true,
      user,
      performance: {
        ...stats,
        bestWpm: Math.round(stats.bestWpm || 0),
        avgWpm: Math.round(stats.avgWpm || 0),
        avgAccuracy: Math.round(stats.avgAccuracy || 0),
        passRate,
      },
      recentAttempts,
    });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/users/:id
// @access Admin only
exports.updateUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (role) user.role = role;

    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id,
      metadata: { updatedFields: { firstName, lastName, email, phone, role } },
    });

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route  PATCH /api/users/:id/status
// @access Admin only
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot alter your own admin status.' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    await logAdminAction({
      adminId: req.user._id,
      action: 'CHANGE_USER_STATUS',
      entity: 'User',
      entityId: user._id,
      metadata: { newStatus: status },
    });

    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/users/:id/reset-password
// @access Admin only
exports.adminResetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    user.password = newPassword;
    await user.save();

    await logAdminAction({
      adminId: req.user._id,
      action: 'RESET_USER_PASSWORD',
      entity: 'User',
      entityId: user._id,
    });

    res.status(200).json({ success: true, message: `Password reset successfully for ${user.email}.` });
  } catch (err) {
    next(err);
  }
};

