const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'STUDENT'],
      default: 'STUDENT',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'BLOCKED'],
      default: 'ACTIVE',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    // Future-proofing fields for old user migration (out-of-scope for now)
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    oldUserId: {
      type: String,
      trim: true,
      default: null,
    },
    sourceSystem: {
      type: String,
      trim: true,
      default: null,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name
userSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Password hash hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

// Indexes
userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
