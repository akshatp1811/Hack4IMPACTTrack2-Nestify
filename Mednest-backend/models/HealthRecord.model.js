const mongoose = require('mongoose')
const normalizeGroupKey = require('../utils/normalizeGroupKey')

/**
 * ═══════════════════════════════════════════════════════════
 *  EXTRACTED DATA SHAPES (populated by ML pipeline later)
 * ═══════════════════════════════════════════════════════════
 *
 * @typedef {Object} LabReportExtracted
 * @property {string}  labName
 * @property {string}  accreditationNumber
 * @property {Date}    sampleCollectedAt
 * @property {Date}    reportedAt
 * @property {string}  orderedBy
 * @property {Array<{
 *   name: string,
 *   parameterKey: string,
 *   value: number,
 *   unit: string,
 *   referenceMin: number,
 *   referenceMax: number,
 *   status: 'normal'|'low'|'high'|'borderline_low'|'borderline_high'|'critical_low'|'critical_high'
 * }>} parameters
 *
 * @typedef {Object} ScanExtracted
 * @property {string}  scanType
 * @property {string}  bodyRegion
 * @property {string}  view
 * @property {'X-Ray'|'MRI'|'CT'|'Ultrasound'|'ECG'} modalityType
 * @property {string}  radiologistName
 * @property {string}  radiologistCredentials
 * @property {Date}    scanPerformedAt
 * @property {Date}    reportDate
 * @property {string[]} findings
 * @property {string}  impression
 * @property {string}  recommendations
 * @property {string}  scanImageUrl
 * @property {boolean} isReportAttached
 * @property {boolean} contrastUsed
 * @property {'routine'|'urgent'|'stat'} urgency
 *
 * @typedef {Object} PrescriptionExtracted
 * @property {string}  diagnosis
 * @property {string}  doctorRegNumber
 * @property {Date}    prescriptionDate
 * @property {boolean} isHandwritten
 * @property {Array<{
 *   brandName: string,
 *   genericName: string,
 *   drugClass: string,
 *   dosage: string,
 *   frequency: string,
 *   frequencyCode: 'OD'|'BD'|'TDS'|'QID'|'SOS',
 *   duration: string,
 *   durationDays: number,
 *   form: 'tablet'|'capsule'|'syrup'|'injection'|'cream'|'drops'|'inhaler'|'patch'|'other',
 *   instructions: string,
 *   refillsAllowed: number,
 *   isControlled: boolean
 * }>} medications
 * @property {string}  specialInstructions
 * @property {Date}    followUpDate
 *
 * @typedef {Object} VisitExtracted
 * @property {string}   visitType
 * @property {string}   chiefComplaint
 * @property {string[]} diagnosis
 * @property {{
 *   bloodPressureSystolic: number,
 *   bloodPressureDiastolic: number,
 *   heartRateBpm: number,
 *   temperatureCelsius: number,
 *   weightKg: number,
 *   heightCm: number,
 *   bmi: number,
 *   spo2Percent: number,
 *   respiratoryRate: number
 * }} vitals
 * @property {string}   doctorNotes
 * @property {string}   treatmentGiven
 * @property {string[]} referrals
 * @property {string[]} testsOrdered
 * @property {Date}     nextAppointmentDate
 *
 * @typedef {Object} ConsultationExtracted
 * @property {string}   specialty
 * @property {'in_person'|'teleconsultation'|'home_visit'} mode
 * @property {string}   referredBy
 * @property {string}   chiefComplaint
 * @property {string}   clinicalAssessment
 * @property {string[]} diagnosis
 * @property {string[]} recommendations
 * @property {string[]} testsOrdered
 * @property {string[]} medicationsPrescribed
 * @property {string}   followUpInstructions
 * @property {Date}     followUpDate
 * @property {'routine'|'urgent'|'emergency'} urgency
 */

const healthRecordSchema = new mongoose.Schema(
  {
    // ── OWNERSHIP ─────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── CLASSIFICATION ────────────────────────────
    recordType: {
      type: String,
      enum: ['visit', 'scan', 'lab_report', 'prescription', 'consultation'],
      required: true,
    },

    subType: {
      type: String,
      // scan        → "Chest X-Ray", "MRI Brain", "USG Abdomen", "ECG"
      // lab_report  → "Complete Blood Count", "Lipid Profile", "Thyroid Panel"
      // visit       → "General Checkup", "Follow-up", "Emergency"
      // consultation→ "Cardiology", "Neurology", "Dermatology"
      // prescription→ "General", "Specialist"
    },

    groupKey: {
      type: String,
      index: true,
    },

    // ── METADATA ──────────────────────────────────
    recordDate: {
      type: Date,
      required: true,
    },

    doctorName: {
      type: String,
      default: null,
    },
    facilityName: {
      type: String,
      default: null,
    },
    userNotes: {
      type: String,
      default: null,
    },

    // ── FILE STORAGE ──────────────────────────────
    originalFile: {
      cloudinaryId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      fileType: {
        type: String,
        enum: ['jpg', 'jpeg', 'png'],
        required: true,
      },
      fileSizeKb: Number,
      originalFileName: String,
      width: Number,
      height: Number,
    },

    // ── ML PIPELINE STATE ─────────────────────────
    mlPipeline: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
      },
      jobId: {
        type: String,
        default: null,
      },
      startedAt: {
        type: Date,
        default: null,
      },
      completedAt: {
        type: Date,
        default: null,
      },
      failedAt: {
        type: Date,
        default: null,
      },
      failureReason: {
        type: String,
        default: null,
      },
      retryCount: {
        type: Number,
        default: 0,
      },
      mlServiceVersion: {
        type: String,
        default: null,
      },
      confidence: {
        classification: {
          type: Number,
          default: null,
        },
        extraction: {
          type: Number,
          default: null,
        },
      },
    },

    // ── EXTRACTED DATA ────────────────────────────
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── AI SUMMARY ────────────────────────────────
    aiSummary: {
      type: String,
      default: null,
    },
    keyFindings: {
      type: [String],
      default: [],
    },

    // ── USER OVERRIDES ────────────────────────────
    userOverrides: {
      type: Boolean,
      default: false,
    },
    originalMlExtraction: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── COMPARISON ────────────────────────────────
    comparedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord',
      },
    ],

    // ── DUPLICATE DETECTION ───────────────────────
    duplicateDetection: {
      isDuplicate: {
        type: Boolean,
        default: false,
      },
      duplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HealthRecord',
        default: null,
      },
      similarityScore: {
        type: Number,
        default: null,
      },
    },

    // ── SOFT DELETE ───────────────────────────────
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// ── COMPOUND INDEXES ──────────────────────────────
healthRecordSchema.index({ userId: 1, recordType: 1, recordDate: -1 })
healthRecordSchema.index({ userId: 1, groupKey: 1, recordDate: 1 })
healthRecordSchema.index({ userId: 1, isDeleted: 1, recordDate: -1 })
healthRecordSchema.index({ userId: 1, 'mlPipeline.status': 1 })

// ── PRE-SAVE HOOK ─────────────────────────────────
healthRecordSchema.pre('save', function (next) {
  if (this.subType) {
    this.groupKey = normalizeGroupKey(this.subType)
  }
  next()
})

module.exports = mongoose.model('HealthRecord', healthRecordSchema)
