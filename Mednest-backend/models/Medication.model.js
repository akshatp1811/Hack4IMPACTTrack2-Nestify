const mongoose = require('mongoose')

// ── HIGH-RISK DRUG CLASS KEYWORDS ────────────────────
const HIGH_RISK_KEYWORDS = [
  'antihypertensive',
  'anticoagulant',
  'antiplatelet',
  'insulin',
  'cardiac',
  'antiarrhythmic',
  'thrombolytic',
  'vasopressor',
  'immunosuppressant',
  'chemotherapy',
  'opioid',
  'benzodiazepine',
]

// ── SUB-SCHEMAS ──────────────────────────────────────

const frequencySchema = new mongoose.Schema(
  {
    timesPerDay: { type: Number, required: true, default: 1 },
    specificTimes: {
      type: [String], // e.g. ["08:00", "20:00"]
      default: [],
    },
    daysOfWeek: {
      type: [String], // e.g. ["Mon","Wed","Fri"] — empty = daily
      default: [],
    },
    instructions: { type: String, trim: true },
  },
  { _id: false }
)

const refillInfoSchema = new mongoose.Schema(
  {
    totalDays: { type: Number, default: null },
    remainingDays: { type: Number, default: null },
    lastRefillDate: { type: Date, default: null },
  },
  { _id: false }
)

const drugInfoSchema = new mongoose.Schema(
  {
    use: { type: String, default: null },
    sideEffects: { type: String, default: null },
    warnings: { type: String, default: null },
    interactions: { type: String, default: null },
  },
  { _id: false }
)

const riskAlertThresholdSchema = new mongoose.Schema(
  {
    missedDosesBeforeAlert: { type: Number, default: 3 },
  },
  { _id: false }
)

// ── MAIN SCHEMA ──────────────────────────────────────

const medicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Drug identity ──
    name: { type: String, required: true, trim: true },           // brand name
    genericName: { type: String, trim: true, default: null },
    drugClass: { type: String, trim: true, default: null },

    // ── Dosage & form ──
    dosage: { type: String, trim: true },                          // e.g. "500mg"
    form: {
      type: String,
      enum: ['tablet', 'capsule', 'syrup', 'injection', 'other'],
      default: 'tablet',
    },

    // ── Schedule ──
    frequency: { type: frequencySchema, default: () => ({}) },

    // ── Prescription context ──
    prescribedBy: { type: String, trim: true, default: null },
    prescribedDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },                        // null = ongoing

    // ── Status ──
    status: {
      type: String,
      enum: ['active', 'paused', 'completed', 'discontinued'],
      default: 'active',
    },

    // ── Clinical ──
    indication: { type: String, trim: true, default: null },       // what it's for
    isHighRisk: { type: Boolean, default: false },
    riskAlertThreshold: { type: riskAlertThresholdSchema, default: () => ({}) },

    // ── Link to scanned prescription ──
    linkedPrescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord',
      default: null,
    },

    // ── Refill tracking ──
    refillInfo: { type: refillInfoSchema, default: () => ({}) },

    // ── Caregiver access ──
    caregiverVisible: { type: Boolean, default: false },

    // ── AI-populated drug information ──
    drugInfo: { type: drugInfoSchema, default: () => ({}) },
  },
  { timestamps: true }
)

// ── INDEXES ──────────────────────────────────────────
medicationSchema.index({ userId: 1, status: 1 })
medicationSchema.index({ userId: 1, isHighRisk: 1 })

// ── PRE-SAVE HOOK — auto-set isHighRisk ──────────────
medicationSchema.pre('save', function (next) {
  if (this.drugClass) {
    const lower = this.drugClass.toLowerCase()
    this.isHighRisk = HIGH_RISK_KEYWORDS.some((kw) => lower.includes(kw))
  }
  next()
})

module.exports = mongoose.model('Medication', medicationSchema)
module.exports.HIGH_RISK_KEYWORDS = HIGH_RISK_KEYWORDS
