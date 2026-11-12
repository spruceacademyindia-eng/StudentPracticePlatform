const mongoose = require('mongoose');

const paragraphSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: [true, 'Paragraph content is required'],
      minlength: 50,
    },
    domain: {
      type: String,
      required: true,
      enum: ['healthcare', 'english', 'speed'],
    },
    wordCountLimit: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ['practice', 'challenge', 'both'],
      default: 'both',
    },
    targetWpm: {
      // Used when mode = challenge; default from system settings
      type: Number,
      default: 20,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wordCount: {
      type: Number, // auto-computed
    },
  },
  { timestamps: true }
);

// Auto-calculate word count before save
paragraphSchema.pre('save', function (next) {
  this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  next();
});

module.exports = mongoose.model('Paragraph', paragraphSchema);
