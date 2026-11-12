const TypingAttempt = require('../models/TypingAttempt');
const User = require('../models/User');

// Helper to convert objects array to CSV string
const convertToCSV = (data, headers) => {
  if (!data || !data.length) return '';
  const headerLine = headers.map((h) => `"${h.label}"`).join(',');
  const rowLines = data.map((row) =>
    headers
      .map((h) => {
        let val = row[h.key];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [headerLine, ...rowLines].join('\n');
};

// @route  GET /api/reports/student
// @access Admin only
exports.getStudentPerformanceReport = async (req, res, next) => {
  try {
    const { format } = req.query;

    const reportData = await TypingAttempt.aggregate([
      {
        $group: {
          _id: '$student',
          totalSessions: { $sum: 1 },
          practiceSessions: { $sum: { $cond: [{ $eq: ['$mode', 'PRACTICE'] }, 1, 0] } },
          challengeSessions: { $sum: { $cond: [{ $eq: ['$mode', 'CHALLENGE'] }, 1, 0] } },
          challengesPassed: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
          challengesFailed: { $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] } },
          bestWpm: { $max: '$actualWPM' },
          avgWpm: { $avg: '$actualWPM' },
          avgAccuracy: { $avg: '$accuracy' },
          lastAttempt: { $max: '$createdAt' },
        },
      },
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
          studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
          email: '$student.email',
          status: '$student.status',
          totalSessions: 1,
          practiceSessions: 1,
          challengeSessions: 1,
          challengesPassed: 1,
          challengesFailed: 1,
          bestWpm: { $round: ['$bestWpm', 0] },
          avgWpm: { $round: ['$avgWpm', 0] },
          avgAccuracy: { $round: ['$avgAccuracy', 0] },
          lastAttempt: 1,
        },
      },
      { $sort: { avgWpm: -1 } },
    ]);

    if (format === 'csv') {
      const headers = [
        { label: 'Student Name', key: 'studentName' },
        { label: 'Email', key: 'email' },
        { label: 'Status', key: 'status' },
        { label: 'Total Sessions', key: 'totalSessions' },
        { label: 'Practice Sessions', key: 'practiceSessions' },
        { label: 'Challenge Sessions', key: 'challengeSessions' },
        { label: 'Challenges Passed', key: 'challengesPassed' },
        { label: 'Challenges Failed', key: 'challengesFailed' },
        { label: 'Best WPM', key: 'bestWpm' },
        { label: 'Average WPM', key: 'avgWpm' },
        { label: 'Average Accuracy %', key: 'avgAccuracy' },
        { label: 'Last Attempt Date', key: 'lastAttempt' },
      ];
      const csv = convertToCSV(reportData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=student_performance_report.csv');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, count: reportData.length, data: reportData });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/reports/category
// @access Admin only
exports.getCategoryPerformanceReport = async (req, res, next) => {
  try {
    const { format } = req.query;

    const reportData = await TypingAttempt.aggregate([
      {
        $group: {
          _id: '$contentSnapshot.categoryName',
          attempts: { $sum: 1 },
          avgWpm: { $avg: '$actualWPM' },
          peakWpm: { $max: '$actualWPM' },
          avgAccuracy: { $avg: '$accuracy' },
          passedCount: { $sum: { $cond: [{ $eq: ['$result', 'PASS'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$result', 'FAIL'] }, 1, 0] } },
        },
      },
      {
        $project: {
          categoryName: { $ifNull: ['$_id', 'General'] },
          attempts: 1,
          avgWpm: { $round: ['$avgWpm', 0] },
          peakWpm: { $round: ['$peakWpm', 0] },
          avgAccuracy: { $round: ['$avgAccuracy', 0] },
          passedCount: 1,
          failedCount: 1,
        },
      },
      { $sort: { attempts: -1 } },
    ]);

    if (format === 'csv') {
      const headers = [
        { label: 'Category Name', key: 'categoryName' },
        { label: 'Total Attempts', key: 'attempts' },
        { label: 'Average WPM', key: 'avgWpm' },
        { label: 'Peak WPM', key: 'peakWpm' },
        { label: 'Average Accuracy %', key: 'avgAccuracy' },
        { label: 'Challenges Passed', key: 'passedCount' },
        { label: 'Challenges Failed', key: 'failedCount' },
      ];
      const csv = convertToCSV(reportData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=category_performance_report.csv');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, count: reportData.length, data: reportData });
  } catch (err) {
    next(err);
  }
};

// @route  GET /api/reports/challenge
// @access Admin only
exports.getChallengeReport = async (req, res, next) => {
  try {
    const { format } = req.query;

    const attempts = await TypingAttempt.find({ mode: 'CHALLENGE' })
      .populate('student', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(500);

    const reportData = attempts.map((a) => ({
      date: new Date(a.createdAt).toISOString().split('T')[0],
      studentName: a.student ? `${a.student.firstName} ${a.student.lastName}` : 'Unknown',
      email: a.student ? a.student.email : '',
      contentTitle: a.contentSnapshot.title || 'Untitled',
      category: a.contentSnapshot.categoryName || '',
      targetWPM: a.targetWPM,
      actualWPM: a.actualWPM,
      accuracy: a.accuracy,
      timeTaken: `${a.timeTaken}s`,
      result: a.result,
    }));

    if (format === 'csv') {
      const headers = [
        { label: 'Date', key: 'date' },
        { label: 'Student Name', key: 'studentName' },
        { label: 'Email', key: 'email' },
        { label: 'Content Title', key: 'contentTitle' },
        { label: 'Category', key: 'category' },
        { label: 'Target WPM', key: 'targetWPM' },
        { label: 'Actual WPM', key: 'actualWPM' },
        { label: 'Accuracy %', key: 'accuracy' },
        { label: 'Time Taken', key: 'timeTaken' },
        { label: 'Result', key: 'result' },
      ];
      const csv = convertToCSV(reportData, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=challenge_assessment_report.csv');
      return res.status(200).send(csv);
    }

    res.status(200).json({ success: true, count: reportData.length, data: reportData });
  } catch (err) {
    next(err);
  }
};

