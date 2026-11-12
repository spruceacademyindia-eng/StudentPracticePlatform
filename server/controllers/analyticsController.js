const TypingAttempt = require('../models/TypingAttempt');
const User = require('../models/User');
const Category = require('../models/Category');

// @route  GET /api/analytics/student
// @access Protected (Student)
exports.getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const [summaryAgg, timelineAgg, categoryAgg, recentAttempts] = await Promise.all([
      // 1. Overall stats
      TypingAttempt.aggregate([
        { $match: { student: studentId } },
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
            bestAccuracy: { $max: '$accuracy' },
            avgAccuracy: { $avg: '$accuracy' },
          },
        },
      ]),

      // 2. Timeline for Recharts (last 20 attempts chronological)
      TypingAttempt.find({ student: studentId })
        .sort({ createdAt: 1 })
        .limit(30)
        .select('actualWPM accuracy mode result createdAt'),

      // 3. Category performance
      TypingAttempt.aggregate([
        { $match: { student: studentId } },
        {
          $group: {
            _id: '$contentSnapshot.categoryName',
            avgWpm: { $avg: '$actualWPM' },
            avgAccuracy: { $avg: '$accuracy' },
            attempts: { $sum: 1 },
          },
        },
        { $sort: { attempts: -1 } },
      ]),

      // 4. Recent attempts (last 5)
      TypingAttempt.find({ student: studentId })
        .populate('content', 'title')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const stats = summaryAgg[0] || {
      totalAttempts: 0,
      practiceAttempts: 0,
      challengeAttempts: 0,
      challengePassed: 0,
      challengeFailed: 0,
      bestWpm: 0,
      avgWpm: 0,
      bestAccuracy: 0,
      avgAccuracy: 0,
    };

    const passRate = stats.challengeAttempts
      ? Math.round((stats.challengePassed / stats.challengeAttempts) * 100)
      : 0;

    // Format timeline for chart
    const timelineData = timelineAgg.map((item, idx) => ({
      session: `#${idx + 1}`,
      date: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      wpm: item.actualWPM,
      accuracy: item.accuracy,
      mode: item.mode,
      result: item.result,
    }));

    // Format category data
    const categoryData = categoryAgg.map((c) => ({
      category: c._id || 'General',
      avgWpm: Math.round(c.avgWpm || 0),
      avgAccuracy: Math.round(c.avgAccuracy || 0),
      attempts: c.attempts,
    }));

    res.status(200).json({
      success: true,
      summary: {
        totalAttempts: stats.totalAttempts,
        practiceAttempts: stats.practiceAttempts,
        challengeAttempts: stats.challengeAttempts,
        challengePassed: stats.challengePassed,
        challengeFailed: stats.challengeFailed,
        bestWpm: Math.round(stats.bestWpm || 0),
        avgWpm: Math.round(stats.avgWpm || 0),
        bestAccuracy: Math.round(stats.bestAccuracy || 0),
        avgAccuracy: Math.round(stats.avgAccuracy || 0),
        passRate,
      },
      timeline: timelineData,
      categoryPerformance: categoryData,
      recentAttempts,
    });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/analytics/admin
// @access Admin only
exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const [userCounts, attemptSummary, dailyAttempts, leaderboard, categoryStats] =
      await Promise.all([
        // 1. User counts
        User.aggregate([
          { $match: { role: 'STUDENT' } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]),

        // 2. Global attempt summary
        TypingAttempt.aggregate([
          {
            $group: {
              _id: null,
              totalAttempts: { $sum: 1 },
              practiceAttempts: { $sum: { $cond: [{ $eq: ['$mode', 'PRACTICE'] }, 1, 0] } },
              challengeAttempts: { $sum: { $cond: [{ $eq: ['$mode', 'CHALLENGE'] }, 1, 0] } },
              challengePassed: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
              challengeFailed: { $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] } },
              avgWpm: { $avg: '$actualWPM' },
              bestWpm: { $max: '$actualWPM' },
              avgAccuracy: { $avg: '$accuracy' },
            },
          },
        ]),

        // 3. Daily attempts trend (last 14 days)
        TypingAttempt.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              avgWpm: { $avg: '$actualWPM' },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        // 4. Student Leaderboard (Top 10 by average WPM)
        TypingAttempt.aggregate([
          {
            $group: {
              _id: '$student',
              avgWpm: { $avg: '$actualWPM' },
              bestWpm: { $max: '$actualWPM' },
              avgAccuracy: { $avg: '$accuracy' },
              sessions: { $sum: 1 },
            },
          },
          { $sort: { avgWpm: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'studentInfo',
            },
          },
          { $unwind: '$studentInfo' },
          {
            $project: {
              name: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
              email: '$studentInfo.email',
              avgWpm: { $round: ['$avgWpm', 0] },
              bestWpm: { $round: ['$bestWpm', 0] },
              avgAccuracy: { $round: ['$avgAccuracy', 0] },
              sessions: 1,
            },
          },
        ]),

        // 5. Category usage
        TypingAttempt.aggregate([
          {
            $group: {
              _id: '$contentSnapshot.categoryName',
              count: { $sum: 1 },
              avgWpm: { $avg: '$actualWPM' },
              avgAccuracy: { $avg: '$accuracy' },
            },
          },
          { $sort: { count: -1 } },
        ]),
      ]);

    // Format user counts
    let activeStudents = 0;
    let inactiveStudents = 0;
    let blockedStudents = 0;
    let totalStudents = 0;

    userCounts.forEach((u) => {
      totalStudents += u.count;
      if (u._id === 'ACTIVE') activeStudents = u.count;
      if (u._id === 'INACTIVE') inactiveStudents = u.count;
      if (u._id === 'BLOCKED') blockedStudents = u.count;
    });

    const summary = attemptSummary[0] || {
      totalAttempts: 0,
      practiceAttempts: 0,
      challengeAttempts: 0,
      challengePassed: 0,
      challengeFailed: 0,
      avgWpm: 0,
      bestWpm: 0,
      avgAccuracy: 0,
    };

    const passRate = summary.challengeAttempts
      ? Math.round((summary.challengePassed / summary.challengeAttempts) * 100)
      : 0;

    res.status(200).json({
      success: true,
      users: {
        total: totalStudents,
        active: activeStudents,
        inactive: inactiveStudents,
        blocked: blockedStudents,
      },
      summary: {
        totalAttempts: summary.totalAttempts,
        practiceAttempts: summary.practiceAttempts,
        challengeAttempts: summary.challengeAttempts,
        challengePassed: summary.challengePassed,
        challengeFailed: summary.challengeFailed,
        avgWpm: Math.round(summary.avgWpm || 0),
        bestWpm: Math.round(summary.bestWpm || 0),
        avgAccuracy: Math.round(summary.avgAccuracy || 0),
        passRate,
      },
      dailyAttempts: dailyAttempts.map((d) => ({
        date: d._id,
        attempts: d.count,
        avgWpm: Math.round(d.avgWpm || 0),
      })),
      leaderboard,
      categoryStats: categoryStats.map((c) => ({
        name: c._id || 'General',
        count: c.count,
        avgWpm: Math.round(c.avgWpm || 0),
        avgAccuracy: Math.round(c.avgAccuracy || 0),
      })),
    });
  } catch (err) {
    next(err);
  }
};

