const TypingAttempt = require('../models/TypingAttempt');

// @route  GET /api/attempts/my
// @access Protected (Student)
exports.getMyAttempts = async (req, res, next) => {
  try {
    const {
      mode,
      result,
      sortBy = 'newest',
      page = 1,
      limit = 15,
    } = req.query;

    const filter = { student: req.user._id };
    if (mode) filter.mode = mode;
    if (result) filter.result = result;

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
    else if (sortBy === 'highestWpm') sortOptions = { actualWPM: -1 };
    else if (sortBy === 'highestAccuracy') sortOptions = { accuracy: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      TypingAttempt.find(filter)
        .populate('content', 'title category')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      TypingAttempt.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      attempts,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/attempts/admin
// @access Admin only
exports.getAllAttemptsAdmin = async (req, res, next) => {
  try {
    const {
      studentId,
      mode,
      result,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};
    if (studentId) filter.student = studentId;
    if (mode) filter.mode = mode;
    if (result) filter.result = result;

    const skip = (Number(page) - 1) * Number(limit);
    const [attempts, total] = await Promise.all([
      TypingAttempt.find(filter)
        .populate('student', 'firstName lastName email')
        .populate('content', 'title category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      TypingAttempt.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      attempts,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/attempts/:id
// @access Protected
exports.getAttemptById = async (req, res, next) => {
  try {
    const attempt = await TypingAttempt.findById(req.params.id)
      .populate('student', 'firstName lastName email')
      .populate('content', 'title category');

    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found.' });

    // Students can only view their own attempts
    if (req.user.role !== 'ADMIN' && attempt.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this attempt.' });
    }

    res.status(200).json({ success: true, attempt });
  } catch (err) {
    next(err);
  }
};

