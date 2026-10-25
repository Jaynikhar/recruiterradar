const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Recruiter name is required'],
      trim: true,
      index: true,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
    },
    linkedinUrl: {
      type: String,
      default: '',
      trim: true,
    },
    companyName: {
      type: String,
      default: '',
      trim: true,
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
    companyWebsite: {
      type: String,
      default: '',
      trim: true,
    },
    companyLinkedin: {
      type: String,
      default: '',
      trim: true,
    },
    companySocial: {
      type: String,
      default: '',
      trim: true,
    },
    companyTwitter: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    companyNiche: {
      type: String,
      default: '',
      trim: true,
      index: true,
    },
    statusNotes: {
      type: String,
      default: '',
      trim: true,
    },
    history: [
      {
        note: String,
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound text index for robust full-text search across name, company, title, location, niche
recruiterSchema.index({
  name: 'text',
  companyName: 'text',
  jobTitle: 'text',
  location: 'text',
  companyNiche: 'text',
});

module.exports = mongoose.model('Recruiter', recruiterSchema);
