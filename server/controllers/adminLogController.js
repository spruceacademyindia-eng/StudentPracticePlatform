const AdminLog = require('../models/AdminLog');

// @route  GET /api/admin-logs
// @access Admin only
exports.getAdminLogs = async (req, res, next) => {
  try {
    const { action, entity, page = 1, limit = 25 } = req.query;

    const filter = {};
    if (action) filter.action = action;
    if (entity) filter.entity = entity;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .populate('admin', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      AdminLog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      logs,
    });
  } catch (err) {
    next(err);
  }
};

