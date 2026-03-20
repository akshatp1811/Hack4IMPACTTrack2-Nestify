const mongoose = require('mongoose')

const vitalInsightCacheSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vitalType: {
      type: String,
      required: true,
      index: true,
    },
    period: {
      type: String, // e.g. '7d', '30d', '90d', '1y'
      required: true,
      index: true,
    },
    insightData: {
      type: {
        trendSummary: String,
        assessment: {
          type: String,
          enum: ['improving', 'stable', 'worsening', 'insufficient_data'],
        },
        actionableRecommendation: String,
        seeDoctor: Boolean,
      },
      required: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // MongoDB TTL index: automatically deletes document after 24 hours (86400 seconds)
    },
  },
  { timestamps: true }
)

// Compound index for fast lookup
vitalInsightCacheSchema.index({ userId: 1, vitalType: 1, period: 1 }, { unique: true })

module.exports = mongoose.model('VitalInsightCache', vitalInsightCacheSchema)
