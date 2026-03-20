const mongoose = require('mongoose')

// ── TYPE-SPECIFIC SUB-SCHEMAS ────────────────────────
const bloodPressureSchema = new mongoose.Schema(
  {
    systolic: { type: Number, required: true },
    diastolic: { type: Number, required: true },
    pulse: { type: Number },
  },
  { _id: false }
)

const bloodGlucoseSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true },
    measuredWhen: {
      type: String,
      enum: ['fasting', 'post_meal', 'random', 'bedtime'],
      default: 'random',
    },
  },
  { _id: false }
)

const weightSchema = new mongoose.Schema(
  { value: { type: Number, required: true } },
  { _id: false }
)

const heartRateSchema = new mongoose.Schema(
  {
    bpm: { type: Number, required: true },
    context: {
      type: String,
      enum: ['resting', 'active', 'post_exercise'],
      default: 'resting',
    },
  },
  { _id: false }
)

const spo2Schema = new mongoose.Schema(
  { value: { type: Number, required: true } },
  { _id: false }
)

const sleepSchema = new mongoose.Schema(
  {
    bedtime: { type: Date, required: true },
    wakeTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    quality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      required: true,
    },
  },
  { _id: false }
)

const activitySchema = new mongoose.Schema(
  {
    steps: { type: Number, default: 0 },
    activeMinutes: { type: Number, default: 0 },
    distanceKm: { type: Number, default: 0 },
  },
  { _id: false }
)

const caloriesSchema = new mongoose.Schema(
  {
    intake: { type: Number, default: 0 },
    burned: { type: Number, default: 0 },
  },
  { _id: false }
)

const stressScoreSchema = new mongoose.Schema(
  { value: { type: Number, required: true, min: 0, max: 100 } },
  { _id: false }
)

// ── VITAL TYPES ENUM ─────────────────────────────────
const VITAL_TYPES = [
  'blood_pressure',
  'blood_glucose',
  'weight',
  'heart_rate',
  'spo2',
  'sleep',
  'activity',
  'calories',
  'stress_score',
]

// ── MAIN SCHEMA ──────────────────────────────────────
const vitalEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    vitalType: {
      type: String,
      enum: VITAL_TYPES,
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['manual', 'device', 'import'],
      default: 'manual',
    },
    notes: { type: String, trim: true },

    // ── Type-specific data ──
    bloodPressure: bloodPressureSchema,
    bloodGlucose: bloodGlucoseSchema,
    weight: weightSchema,
    heartRate: heartRateSchema,
    spo2: spo2Schema,
    sleep: sleepSchema,
    activity: activitySchema,
    calories: caloriesSchema,
    stressScore: stressScoreSchema,

    // ── Auto-computed clinical category ──
    category: { type: String },

    // ── Soft delete ──
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
)

// Compound index for common queries
vitalEntrySchema.index({ userId: 1, vitalType: 1, recordedAt: -1 })
vitalEntrySchema.index({ userId: 1, isDeleted: 1 })

// ══════════════════════════════════════════════════════
//  CLINICAL CATEGORISATION — PRE-SAVE HOOK
// ══════════════════════════════════════════════════════

function categorizeBP(sys, dia) {
  // AHA guidelines
  if (sys >= 180 || dia >= 120) return 'Hypertensive Crisis'
  if (sys >= 140 || dia >= 90) return 'Stage 2 Hypertension'
  if (sys >= 130 || dia >= 80) return 'Stage 1 Hypertension'
  if (sys >= 120 && dia < 80) return 'Elevated'
  return 'Normal'
}

function categorizeGlucose(value, when) {
  // ADA guidelines (mg/dL)
  if (when === 'fasting') {
    if (value < 70) return 'Low'
    if (value <= 99) return 'Normal'
    if (value <= 125) return 'Pre-diabetes'
    return 'Diabetes'
  }
  // post_meal / random / bedtime
  if (value < 70) return 'Low'
  if (value <= 140) return 'Normal'
  if (value <= 199) return 'Pre-diabetes'
  return 'Diabetes'
}

function categorizeHR(bpm) {
  if (bpm < 60) return 'Bradycardia'
  if (bpm <= 100) return 'Normal'
  if (bpm <= 120) return 'Elevated'
  return 'Tachycardia'
}

function categorizeSpO2(val) {
  if (val >= 95) return 'Normal'
  if (val >= 90) return 'Mild Hypoxemia'
  if (val >= 85) return 'Moderate Hypoxemia'
  return 'Severe Hypoxemia'
}

function categorizeSleep(durationMin, quality) {
  const hrs = durationMin / 60
  const qualityScore = { poor: 1, fair: 2, good: 3, excellent: 4 }[quality] || 2
  const durationScore = hrs >= 7 ? 4 : hrs >= 6 ? 3 : hrs >= 5 ? 2 : 1
  const avg = (qualityScore + durationScore) / 2
  if (avg >= 3.5) return 'Excellent'
  if (avg >= 2.5) return 'Good'
  if (avg >= 1.5) return 'Fair'
  return 'Poor'
}

function categorizeActivity(steps) {
  if (steps >= 10000) return 'Very Active'
  if (steps >= 7500) return 'Active'
  if (steps >= 5000) return 'Low Active'
  return 'Sedentary'
}

function categorizeCalories(intake, burned) {
  const net = intake - burned
  if (net > 300) return 'Surplus'
  if (net < -300) return 'Deficit'
  return 'Balanced'
}

function categorizeStress(val) {
  if (val <= 25) return 'Low'
  if (val <= 50) return 'Moderate'
  if (val <= 75) return 'High'
  return 'Critical'
}

vitalEntrySchema.pre('save', function (next) {
  switch (this.vitalType) {
    case 'blood_pressure':
      if (this.bloodPressure) {
        this.category = categorizeBP(
          this.bloodPressure.systolic,
          this.bloodPressure.diastolic
        )
      }
      break
    case 'blood_glucose':
      if (this.bloodGlucose) {
        this.category = categorizeGlucose(
          this.bloodGlucose.value,
          this.bloodGlucose.measuredWhen
        )
      }
      break
    case 'heart_rate':
      if (this.heartRate) {
        this.category = categorizeHR(this.heartRate.bpm)
      }
      break
    case 'spo2':
      if (this.spo2) {
        this.category = categorizeSpO2(this.spo2.value)
      }
      break
    case 'sleep':
      if (this.sleep) {
        this.category = categorizeSleep(
          this.sleep.durationMinutes,
          this.sleep.quality
        )
      }
      break
    case 'activity':
      if (this.activity) {
        this.category = categorizeActivity(this.activity.steps)
      }
      break
    case 'calories':
      if (this.calories) {
        this.category = categorizeCalories(
          this.calories.intake,
          this.calories.burned
        )
      }
      break
    case 'stress_score':
      if (this.stressScore) {
        this.category = categorizeStress(this.stressScore.value)
      }
      break
    case 'weight':
      // Weight category requires height (BMI); set in controller if needed
      this.category = this.category || 'Recorded'
      break
  }
  next()
})

// Export helpers for use in controller & seed
module.exports = mongoose.model('VitalEntry', vitalEntrySchema)
module.exports.VITAL_TYPES = VITAL_TYPES
