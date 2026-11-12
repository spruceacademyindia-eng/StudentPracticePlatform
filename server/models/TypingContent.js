const mongoose = require('mongoose');

const typingContentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [30, 'Content must be at least 30 characters'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    wordCount: {
      type: Number,
      default: 0,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    mode: {
      type: String,
      enum: ['PRACTICE', 'CHALLENGE', 'BOTH'],
      default: 'BOTH',
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
      default: 'MEDIUM',
    },
    targetWPM: {
      type: Number,
      default: 30,
      min: [5, 'Target WPM must be at least 5'],
      max: [250, 'Target WPM cannot exceed 250'],
    },
    minimumAccuracy: {
      type: Number,
      default: 80,
      min: [50, 'Minimum accuracy must be at least 50%'],
      max: [100, 'Minimum accuracy cannot exceed 100%'],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-calculate wordCount and characterCount before save
typingContentSchema.pre('save', function (next) {
  if (this.isModified('content')) {
    this.characterCount = this.content.length;
    this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  }
  next();
});

// Indexes for query optimization
typingContentSchema.index({ category: 1, status: 1 });
typingContentSchema.index({ mode: 1, status: 1 });
typingContentSchema.index({ difficulty: 1 });
typingContentSchema.index({ status: 1 });

module.exports = mongoose.model('TypingContent', typingContentSchema);

