const mongoose = require('mongoose');

const typingAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TypingContent',
      required: true,
    },
    mode: {
      type: String,
      enum: ['PRACTICE', 'CHALLENGE'],
      required: true,
    },
    targetWPM: {
      type: Number,
      default: 0,
    },
    actualWPM: {
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
    typedCharacters: {
      type: Number,
      default: 0,
    },
    correctCharacters: {
      type: Number,
      default: 0,
    },
    incorrectCharacters: {
      type: Number,
      default: 0,
    },
    wordsTyped: {
      type: Number,
      default: 0,
    },
    timeTaken: {
      type: Number, // in seconds
      required: true,
      min: 0,
    },
    result: {
      type: String,
      enum: ['PASS', 'FAIL', 'COMPLETED'],
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
    // Historical Content Snapshot (Business rule #44)
    contentSnapshot: {
      title: { type: String, default: '' },
      content: { type: String, default: '' },
      categoryName: { type: String, default: '' },
      subcategoryName: { type: String, default: '' },
      targetWPM: { type: Number, default: 0 },
      minimumAccuracy: { type: Number, default: 0 },
      wordCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Performance Indexes
typingAttemptSchema.index({ student: 1, createdAt: -1 });
typingAttemptSchema.index({ content: 1 });
typingAttemptSchema.index({ mode: 1, result: 1 });
typingAttemptSchema.index({ createdAt: -1 });

module.exports = mongoose.model('TypingAttempt', typingAttemptSchema);

