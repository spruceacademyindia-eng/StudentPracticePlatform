const jwt = require('jsonwebtoken');
const TypingContent = require('../models/TypingContent');
const TypingAttempt = require('../models/TypingAttempt');
const SystemSetting = require('../models/SystemSetting');

// Helper to get system setting value
const getSettingValue = async (key, fallback) => {
  const setting = await SystemSetting.findOne({ key });
  return setting ? setting.value : fallback;
};

// @route  POST /api/typing/start
// @access Protected (Student)
exports.startTypingSession = async (req, res, next) => {
  try {
    const { contentId, mode, targetWPM } = req.body;

    if (!contentId || !mode) {
      return res.status(400).json({ success: false, message: 'Content ID and mode are required.' });
    }

    const content = await TypingContent.findById(contentId).populate('category subcategory');
    if (!content || content.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Typing content not available or active.' });
    }

    const startedAt = new Date();
    const effectiveTargetWPM = targetWPM ? Number(targetWPM) : content.targetWPM || 30;

    // Allowed time for challenge: (wordCount / targetWPM) * 60 seconds
    const timeLimitSeconds = Math.ceil((content.wordCount / effectiveTargetWPM) * 60);

    // Sign a secure session token with server timestamp
    const sessionToken = jwt.sign(
      {
        studentId: req.user._id,
        contentId: content._id,
        mode,
        startedAt: startedAt.getTime(),
        targetWPM: effectiveTargetWPM,
        minimumAccuracy: content.minimumAccuracy,
        timeLimitSeconds,
      },
      process.env.JWT_SECRET || 'spruce_jwt_secret_key',
      { expiresIn: '3h' }
    );

    res.status(200).json({
      success: true,
      sessionToken,
      startedAt,
      timeLimitSeconds,
      targetWPM: effectiveTargetWPM,
      minimumAccuracy: content.minimumAccuracy,
    });
  } catch (err) {
    next(err);
  }
};

// @route  POST /api/typing/submit
// @access Protected (Student)
exports.submitTypingSession = async (req, res, next) => {
  try {
    const { sessionToken, typedText, timeTakenClient } = req.body;

    if (!sessionToken || typedText === undefined) {
      return res.status(400).json({ success: false, message: 'Session token and typed text are required.' });
    }

    // Decode & verify session token
    let session;
    try {
      session = jwt.verify(sessionToken, process.env.JWT_SECRET || 'spruce_jwt_secret_key');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired typing session token.' });
    }

    // Ensure session belongs to current user
    if (session.studentId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Session token does not belong to logged in student.' });
    }

    const content = await TypingContent.findById(session.contentId).populate('category subcategory');
    if (!content) {
      return res.status(404).json({ success: false, message: 'Referenced typing content not found.' });
    }

    const startedAt = new Date(session.startedAt);
    const completedAt = new Date();

    // Calculate server duration in seconds
    const serverDurationSeconds = Math.max(1, Math.round((completedAt.getTime() - startedAt.getTime()) / 1000));
    // Use the smaller of server duration or client reported duration (with reasonable sanity check)
    const timeTaken = Math.min(serverDurationSeconds, Math.max(1, Number(timeTakenClient) || serverDurationSeconds));

    // Calculate typing accuracy and characters
    const targetContent = content.content;
    const typedChars = typedText.length;
    let correctChars = 0;

    for (let i = 0; i < typedChars; i++) {
      if (i < targetContent.length && typedText[i] === targetContent[i]) {
        correctChars++;
      }
    }
    const incorrectChars = typedChars - correctChars;
    const accuracy = typedChars > 0 ? Math.round((correctChars / typedChars) * 100) : 100;

    // Standardized WPM: (Typed Characters / 5) / (Time in Minutes)
    const timeInMinutes = timeTaken / 60;
    const standardWords = typedChars / 5;
    const actualWPM = timeInMinutes > 0 ? Math.round(standardWords / timeInMinutes) : 0;
    const wordsTyped = typedText.trim().split(/\s+/).filter(Boolean).length;

    let result = 'COMPLETED';
    const targetWPM = session.targetWPM || content.targetWPM || 30;
    const minimumAccuracy = session.minimumAccuracy || content.minimumAccuracy || 80;

    if (session.mode === 'CHALLENGE') {
      const allowedTime = session.timeLimitSeconds || Math.ceil((content.wordCount / targetWPM) * 60);
      const networkGraceSeconds = 10;
      const completedInTime = serverDurationSeconds <= allowedTime + networkGraceSeconds;

      if (completedInTime && actualWPM >= targetWPM && accuracy >= minimumAccuracy) {
        result = 'PASS';
      } else {
        result = 'FAIL';
      }
    }

    // Save attempt with historical content snapshot (Business rule #44)
    const attempt = await TypingAttempt.create({
      student: req.user._id,
      content: content._id,
      mode: session.mode,
      targetWPM,
      actualWPM,
      accuracy,
      typedCharacters: typedChars,
      correctCharacters: correctChars,
      incorrectCharacters: incorrectChars,
      wordsTyped,
      timeTaken,
      result,
      startedAt,
      completedAt,
      contentSnapshot: {
        title: content.title,
        content: content.content,
        categoryName: content.category ? content.category.name : 'Uncategorized',
        subcategoryName: content.subcategory ? content.subcategory.name : '',
        targetWPM,
        minimumAccuracy,
        wordCount: content.wordCount,
      },
    });

    res.status(201).json({
      success: true,
      attempt,
      metrics: {
        wpm: actualWPM,
        accuracy,
        timeTaken,
        correctCharacters: correctChars,
        incorrectCharacters: incorrectChars,
        typedCharacters: typedChars,
        wordsTyped,
        result,
        targetWPM,
        minimumAccuracy,
      },
    });
  } catch (err) {
    next(err);
  }
};

