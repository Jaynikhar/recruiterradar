const mongoose = require('mongoose');

const userOutreachSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true,
      index: true,
    },
    requested: {
      type: Boolean,
      default: false,
      index: true,
    },
    messaged: {
      type: Boolean,
      default: false,
      index: true,
    },
    applied: {
      type: Boolean,
      default: false,
    },
    statusNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index so one user has at most one outreach tracking record per recruiter
userOutreachSchema.index({ user: 1, recruiter: 1 }, { unique: true });
// Fast queries for user stats and filters
userOutreachSchema.index({ user: 1, requested: 1 });
userOutreachSchema.index({ user: 1, messaged: 1 });

module.exports = mongoose.model('UserOutreach', userOutreachSchema);
