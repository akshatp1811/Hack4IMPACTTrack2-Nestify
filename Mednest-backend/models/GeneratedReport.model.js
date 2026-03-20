const mongoose = require('mongoose');
const { Schema } = mongoose;
const crypto = require('crypto');

const generatedReportSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reportType: {
      type: String,
      enum: ['patient', 'doctor', 'insurance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed'],
      default: 'generating',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    contextSnapshot: {
      type: Schema.Types.Mixed,
      description: 'The exact JSON context fed to the AI model',
    },
    aiResponse: {
      type: Schema.Types.Mixed,
      description: 'Raw response back from the AI',
    },
    structuredContent: {
      type: Schema.Types.Mixed,
      description: 'Parsed JSON containing the structured report content',
    },
    exportUrl: {
      type: String,
      description: 'Cloudinary URL of generated PDF',
    },
    shareToken: {
      type: String,
      unique: true,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate share token and expiration before saving a new document
generatedReportSchema.pre('save', function (next) {
  if (this.isNew) {
    if (!this.shareToken) {
      this.shareToken = crypto.randomUUID();
    }
    if (!this.validUntil) {
      // 7 days expiration
      const exp = new Date();
      exp.setDate(exp.getDate() + 7);
      this.validUntil = exp;
    }
  }
  next();
});

module.exports = mongoose.model('GeneratedReport', generatedReportSchema);
