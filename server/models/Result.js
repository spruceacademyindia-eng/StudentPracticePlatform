const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paragraph: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paragraph',
      required: true,
    },
    mode: {
      type: String,
      enum: ['practice', 'challenge'],
      required: true,
    },

    // ── Typing Metrics ──
    wpm: {
      type: Number,
      required: true,
      min: 0,
    },
    accuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    timeTakenSeconds: {
      type: Number,
      required: true,
    },
    correctChars: { type: Number, default: 0 },
    wrongChars:   { type: Number, default: 0 },
    totalChars:   { type: Number, default: 0 },

    // ── Challenge-only ──
    targetWpm:     { type: Number },       // WPM goal set for the challenge
    timeLimitSeconds: { type: Number },    // Auto-calculated time limit
    passed: {
      type: Boolean,
      default: null,                        // null for practice mode
    },
    completedInTime: { type: Boolean, default: null },
  },
  { timestamps: true }
);

// Indexes for analytics queries
resultSchema.index({ student: 1, createdAt: -1 });
resultSchema.index({ paragraph: 1 });
resultSchema.index({ mode: 1, passed: 1 });

module.exports = mongoose.model('Result', resultSchema);
