const Result = require('../models/Result');
const Paragraph = require('../models/Paragraph');
const Settings = require('../models/Settings');

// Helper: get or create singleton settings
const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  return settings;
};

// @route  POST /api/results
// @access Protected (student)
exports.submitResult = async (req, res, next) => {
  try {
    const {
      paragraphId,
      mode,
      wpm,
      accuracy,
      timeTakenSeconds,
      correctChars,
      wrongChars,
      totalChars,
      targetWpm,
      timeLimitSeconds,
      completedInTime,
    } = req.body;

    const para = await Paragraph.findById(paragraphId);
    if (!para) return res.status(404).json({ success: false, message: 'Paragraph not found' });

    const settings = await getSettings();

    let passed = null;
    if (mode === 'challenge') {
      const effectiveTargetWpm = targetWpm || para.targetWpm || settings.defaultTargetWpm;
      passed =
        wpm >= effectiveTargetWpm &&
        accuracy >= settings.passAccuracyThreshold &&
        completedInTime === true;
    }

    const result = await Result.create({
      student: req.user._id,
      paragraph: paragraphId,
      mode,
      wpm,
      accuracy,
      timeTakenSeconds,
      correctChars,
      wrongChars,
      totalChars,
      targetWpm: mode === 'challenge' ? (targetWpm || para.targetWpm) : undefined,
      timeLimitSeconds: mode === 'challenge' ? timeLimitSeconds : undefined,
      passed,
      completedInTime: mode === 'challenge' ? completedInTime : undefined,
    });

    res.status(201).json({ success: true, result, passed });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/results/my
// @access Protected (student)
exports.getMyResults = async (req, res, next) => {
  try {
    const { mode, page = 1, limit = 20 } = req.query;
    const filter = { student: req.user._id };
    if (mode) filter.mode = mode;

    const skip = (Number(page) - 1) * Number(limit);
    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('paragraph', 'title domain')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Result.countDocuments(filter),
    ]);

    // Aggregate summary stats
    const stats = await Result.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          avgWpm:      { $avg: '$wpm' },
          maxWpm:      { $max: '$wpm' },
          avgAccuracy: { $avg: '$accuracy' },
          totalSessions: { $sum: 1 },
          totalPassed: {
            $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] },
          },
          totalFailed: {
            $sum: { $cond: [{ $eq: ['$passed', false] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stats: stats[0] || {},
      results,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/results/admin/all
// @access Admin only
exports.getAllResults = async (req, res, next) => {
  try {
    const { studentId, domain, mode, passed, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (mode) filter.mode = mode;
    if (passed !== undefined) filter.passed = passed === 'true';

    // Join through paragraph for domain filtering
    let query = Result.find(filter)
      .populate('student', 'name email')
      .populate('paragraph', 'title domain')
      .sort({ createdAt: -1 });

    const skip = (Number(page) - 1) * Number(limit);
    const [results, total] = await Promise.all([
      query.skip(skip).limit(Number(limit)),
      Result.countDocuments(filter),
    ]);

    // Overall platform analytics
    const overview = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgWpm:        { $avg: '$wpm' },
          maxWpm:        { $max: '$wpm' },
          avgAccuracy:   { $avg: '$accuracy' },
          totalSessions: { $sum: 1 },
          totalPassed:   { $sum: { $cond: [{ $eq: ['$passed', true] },  1, 0] } },
          totalFailed:   { $sum: { $cond: [{ $eq: ['$passed', false] }, 1, 0] } },
        },
      },
    ]);

    // Per-student leaderboard
    const leaderboard = await Result.aggregate([
      { $match: { mode: 'practice' } },
      { $group: { _id: '$student', avgWpm: { $avg: '$wpm' }, sessions: { $sum: 1 } } },
      { $sort: { avgWpm: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      { $project: { 'student.name': 1, 'student.email': 1, avgWpm: 1, sessions: 1 } },
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      overview: overview[0] || {},
      leaderboard,
      results,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/results/admin/students
// @access Admin only — list all students with summary
exports.getStudentsSummary = async (req, res, next) => {
  try {
    const summary = await Result.aggregate([
      {
        $group: {
          _id: '$student',
          avgWpm:        { $avg: '$wpm' },
          maxWpm:        { $max: '$wpm' },
          avgAccuracy:   { $avg: '$accuracy' },
          totalSessions: { $sum: 1 },
          totalPassed:   { $sum: { $cond: [{ $eq: ['$passed', true] },  1, 0] } },
          totalFailed:   { $sum: { $cond: [{ $eq: ['$passed', false] }, 1, 0] } },
          lastSession:   { $max: '$createdAt' },
        },
      },
      { $sort: { avgWpm: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student',
        },
      },
      { $unwind: '$student' },
      {
        $project: {
          'student.name':  1,
          'student.email': 1,
          avgWpm: 1,
          maxWpm: 1,
          avgAccuracy: 1,
          totalSessions: 1,
          totalPassed: 1,
          totalFailed: 1,
          lastSession: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, students: summary });
  } catch (err) {
    next(err);
  }
};
