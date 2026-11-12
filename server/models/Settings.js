const mongoose = require('mongoose');

// Singleton settings document
const settingsSchema = new mongoose.Schema(
  {
    defaultTargetWpm: {
      type: Number,
      default: 20,
      min: 5,
      max: 200,
    },
    passAccuracyThreshold: {
      // Minimum accuracy % required to pass a challenge
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    allowedWpmBenchmarks: {
      // Custom speed benchmarks admins can pick from
      type: [Number],
      default: [20, 30, 40, 50, 60, 80, 100],
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
