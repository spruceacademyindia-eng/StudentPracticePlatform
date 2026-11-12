const SystemSetting = require('../models/SystemSetting');
const { logAdminAction } = require('../utils/logger');

const DEFAULT_SETTINGS = [
  { key: 'defaultTargetWPM', value: 30, description: 'Default Target WPM for challenges' },
  { key: 'minimumAccuracy', value: 80, description: 'Minimum accuracy % required to pass challenges' },
  { key: 'maximumWordCount', value: 1000, description: 'Maximum allowed word count for typing content' },
  { key: 'defaultChallengeDuration', value: 300, description: 'Default challenge duration in seconds' },
  { key: 'availableWPMBenchmarks', value: [20, 25, 30, 35, 40, 45, 50, 60, 80, 100], description: 'Selectable WPM targets' },
  { key: 'healthcareWordLimits', value: { min: 300, max: 1000 }, description: 'Healthcare domain word limits' },
  { key: 'englishWordLimits', value: { min: 200, max: 800 }, description: 'English communication word limits' },
];

// @route  GET /api/settings
// @access Public / Protected
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSetting.find();

    // Map into an easily consumable key-value object
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Merge defaults if any missing
    DEFAULT_SETTINGS.forEach((def) => {
      if (settingsMap[def.key] === undefined) {
        settingsMap[def.key] = def.value;
      }
    });

    res.status(200).json({ success: true, settings: settingsMap, raw: settings });
  } catch (err) {
    next(err);
  }
};

// @route  PUT /api/settings
// @access Admin only
exports.updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { defaultTargetWPM: 35, minimumAccuracy: 85 }

    for (const [key, value] of Object.entries(updates)) {
      await SystemSetting.findOneAndUpdate(
        { key },
        { key, value, updatedBy: req.user._id },
        { upsert: true, new: true }
      );
    }

    await logAdminAction({
      adminId: req.user._id,
      action: 'UPDATE_SYSTEM_SETTINGS',
      entity: 'SystemSetting',
      metadata: updates,
    });

    // Re-fetch all
    const allSettings = await SystemSetting.find();
    const settingsMap = {};
    allSettings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    res.status(200).json({ success: true, settings: settingsMap });
  } catch (err) {
    next(err);
  }
};

