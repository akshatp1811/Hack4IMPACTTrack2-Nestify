const mongoose = require('mongoose')

// ── DOSE LOG SCHEMA ──────────────────────────────────

const doseLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    medicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medication',
      required: true,
    },

    // ── Schedule ──
    scheduledAt: { type: Date, required: true },        // exact datetime this dose was due
    scheduledTime: { type: String, required: true },     // "08:00"

    // ── Status ──
    status: {
      type: String,
      enum: ['pending', 'taken', 'missed', 'skipped'],
      default: 'pending',
    },

    // ── Confirmation ──
    takenAt: { type: Date, default: null },              // when user actually confirmed
    takenBy: {
      type: String,
      enum: ['self', 'caregiver'],
      default: 'self',
    },

    note: { type: String, trim: true, default: null },
  },
  { timestamps: true }
)

// ── INDEXES ──────────────────────────────────────────
doseLogSchema.index({ userId: 1, scheduledAt: 1 })
doseLogSchema.index({ medicationId: 1, scheduledAt: 1 })
doseLogSchema.index({ userId: 1, status: 1, scheduledAt: 1 })

// ── PRE-SAVE HOOK — auto-mark missed doses ───────────
// If the dose is still pending and was due >2 hours ago, mark it missed.
doseLogSchema.pre('save', function (next) {
  if (this.status === 'pending' && this.scheduledAt) {
    const twoHoursMs = 2 * 60 * 60 * 1000
    if (Date.now() - this.scheduledAt.getTime() > twoHoursMs) {
      this.status = 'missed'
    }
  }
  next()
})

module.exports = mongoose.model('DoseLog', doseLogSchema)
