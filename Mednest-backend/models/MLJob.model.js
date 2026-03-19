const mongoose = require('mongoose')

const mlJobSchema = new mongoose.Schema(
  {
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    bullJobId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed', 'retrying'],
      default: 'queued',
    },

    mlInput: {
      fileUrl: String,
      fileType: String,
      recordTypeHint: String,
      userId: String,
    },

    // Full raw JSON response from Python ML service
    mlOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    queuedAt: Date,
    processingStartedAt: Date,
    completedAt: Date,
    processingDurationMs: Number,

    error: {
      message: String,
      stack: String,
      mlServiceResponse: mongoose.Schema.Types.Mixed,
    },

    retryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('MLJob', mlJobSchema)
