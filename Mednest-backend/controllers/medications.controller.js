const Medication = require('../models/Medication.model')
const DoseLog = require('../models/DoseLog.model')
const asyncHandler = require('../utils/asyncHandler')
const { ApiResponse, ApiError } = require('../utils/ApiResponse')

// ══════════════════════════════════════════════════════
//  1. ADD MEDICATION
// ══════════════════════════════════════════════════════
const addMedication = asyncHandler(async (req, res) => {
  const {
    userId, name, genericName, drugClass, dosage, form,
    frequency, prescribedBy, prescribedDate, startDate, endDate,
    indication, riskAlertThreshold, linkedPrescriptionId,
    refillInfo, caregiverVisible, drugInfo,
  } = req.body

  if (!userId || !name) {
    throw new ApiError(400, 'userId and name are required')
  }

  const medication = new Medication({
    userId, name, genericName, drugClass, dosage, form,
    frequency, prescribedBy, prescribedDate,
    startDate: startDate || new Date(),
    endDate,
    indication, riskAlertThreshold, linkedPrescriptionId,
    refillInfo, caregiverVisible, drugInfo,
  })

  await medication.save() // pre-save sets isHighRisk
  res.status(201).json(
    new ApiResponse(201, { medication }, 'Medication added successfully')
  )
})

// ══════════════════════════════════════════════════════
//  2. GET ALL MEDICATIONS (for a user, optional status filter)
// ══════════════════════════════════════════════════════
const getMedications = asyncHandler(async (req, res) => {
  const { userId, status } = req.query

  if (!userId) throw new ApiError(400, 'userId query param is required')

  const filter = { userId }
  if (status) filter.status = status

  const medications = await Medication.find(filter)
    .sort({ createdAt: -1 })
    .lean()

  res.json(new ApiResponse(200, { medications }))
})

// ══════════════════════════════════════════════════════
//  3. GET SINGLE MEDICATION
// ══════════════════════════════════════════════════════
const getMedicationById = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id).lean()

  if (!medication) throw new ApiError(404, 'Medication not found')

  res.json(new ApiResponse(200, { medication }))
})

// ══════════════════════════════════════════════════════
//  4. UPDATE MEDICATION
// ══════════════════════════════════════════════════════
const updateMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id)
  if (!medication) throw new ApiError(404, 'Medication not found')

  // Merge allowed fields
  const allowedFields = [
    'name', 'genericName', 'drugClass', 'dosage', 'form',
    'frequency', 'prescribedBy', 'prescribedDate', 'startDate', 'endDate',
    'status', 'indication', 'isHighRisk', 'riskAlertThreshold',
    'linkedPrescriptionId', 'refillInfo', 'caregiverVisible', 'drugInfo',
  ]
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      medication[field] = req.body[field]
    }
  })

  await medication.save() // pre-save re-evaluates isHighRisk
  res.json(new ApiResponse(200, { medication }, 'Medication updated'))
})

// ══════════════════════════════════════════════════════
//  5. DELETE MEDICATION (soft — set status to discontinued)
// ══════════════════════════════════════════════════════
const deleteMedication = asyncHandler(async (req, res) => {
  const medication = await Medication.findById(req.params.id)
  if (!medication) throw new ApiError(404, 'Medication not found')

  medication.status = 'discontinued'
  await medication.save()

  res.json(new ApiResponse(200, null, 'Medication discontinued'))
})

// ══════════════════════════════════════════════════════
//  6. LOG A DOSE (confirm / skip)
// ══════════════════════════════════════════════════════
const logDose = asyncHandler(async (req, res) => {
  const { userId, medicationId, scheduledAt, scheduledTime, status, takenBy, note } = req.body

  if (!userId || !medicationId) {
    throw new ApiError(400, 'userId and medicationId are required')
  }

  // If confirming an existing pending dose, update in-place
  if (scheduledAt) {
    const existing = await DoseLog.findOne({
      userId,
      medicationId,
      scheduledAt: new Date(scheduledAt),
      status: 'pending',
    })

    if (existing) {
      existing.status = status || 'taken'
      if (status === 'taken' || !status) {
        existing.takenAt = new Date()
      }
      if (takenBy) existing.takenBy = takenBy
      if (note) existing.note = note
      await existing.save()
      return res.json(new ApiResponse(200, { dose: existing }, 'Dose logged'))
    }
  }

  // Otherwise create a new dose log
  const dose = await DoseLog.create({
    userId,
    medicationId,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
    scheduledTime: scheduledTime || new Date().toTimeString().slice(0, 5),
    status: status || 'taken',
    takenAt: (status === 'taken' || !status) ? new Date() : null,
    takenBy: takenBy || 'self',
    note,
  })

  res.status(201).json(new ApiResponse(201, { dose }, 'Dose logged'))
})

// ══════════════════════════════════════════════════════
//  7. TODAY'S DOSES — full schedule with status
// ══════════════════════════════════════════════════════
const getTodaysDoses = asyncHandler(async (req, res) => {
  const { userId } = req.query
  if (!userId) throw new ApiError(400, 'userId query param is required')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const doses = await DoseLog.find({
    userId,
    scheduledAt: { $gte: today, $lt: tomorrow },
  })
    .populate('medicationId', 'name genericName dosage form indication isHighRisk')
    .sort({ scheduledAt: 1 })
    .lean()

  res.json(new ApiResponse(200, { date: today.toISOString().split('T')[0], doses }))
})

// ══════════════════════════════════════════════════════
//  8. DOSE HISTORY — paginated with filters
// ══════════════════════════════════════════════════════
const getDoseHistory = asyncHandler(async (req, res) => {
  const { userId, medicationId, status, from, to, page = 1, limit = 20 } = req.query

  if (!userId) throw new ApiError(400, 'userId query param is required')

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const filter = { userId }
  if (medicationId) filter.medicationId = medicationId
  if (status) filter.status = status
  if (from || to) {
    filter.scheduledAt = {}
    if (from) filter.scheduledAt.$gte = new Date(from)
    if (to) filter.scheduledAt.$lte = new Date(to)
  }

  const [doses, total] = await Promise.all([
    DoseLog.find(filter)
      .populate('medicationId', 'name genericName dosage form')
      .sort({ scheduledAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    DoseLog.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limitNum)

  res.json(
    new ApiResponse(200, {
      doses,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    })
  )
})

// ══════════════════════════════════════════════════════
//  9. ADHERENCE ANALYTICS
// ══════════════════════════════════════════════════════
const getAdherence = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!userId) throw new ApiError(400, 'userId is required')

  // Get all active (or recently active) medications
  const medications = await Medication.find({
    userId,
    status: { $in: ['active', 'paused', 'completed'] },
  }).lean()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // Get all dose logs in the last 30 days
  const allDoses = await DoseLog.find({
    userId,
    scheduledAt: { $gte: thirtyDaysAgo },
  }).lean()

  let overallTaken = 0
  let overallTotal = 0

  const perMedication = medications.map((med) => {
    const medDoses = allDoses.filter(
      (d) => d.medicationId.toString() === med._id.toString()
    )
    const total = medDoses.length
    const taken = medDoses.filter((d) => d.status === 'taken').length
    const missed = medDoses.filter((d) => d.status === 'missed').length
    const skipped = medDoses.filter((d) => d.status === 'skipped').length
    const adherencePct = total > 0 ? +((taken / total) * 100).toFixed(1) : 0

    overallTaken += taken
    overallTotal += total

    // Calculate current streak
    const sorted = medDoses
      .filter((d) => d.status !== 'pending')
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
    let streak = 0
    for (const d of sorted) {
      if (d.status === 'taken') streak++
      else break
    }

    // Find missed dose patterns (day-of-week distribution)
    const missedByDay = {}
    medDoses
      .filter((d) => d.status === 'missed')
      .forEach((d) => {
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
          new Date(d.scheduledAt).getDay()
        ]
        missedByDay[dayName] = (missedByDay[dayName] || 0) + 1
      })

    return {
      medicationId: med._id,
      name: med.name,
      dosage: med.dosage,
      isHighRisk: med.isHighRisk,
      total,
      taken,
      missed,
      skipped,
      adherencePct,
      currentStreak: streak,
      missedPatterns: missedByDay,
    }
  })

  const overallAdherence =
    overallTotal > 0
      ? +((overallTaken / overallTotal) * 100).toFixed(1)
      : 0

  res.json(
    new ApiResponse(200, {
      userId,
      period: 'last_30_days',
      overallAdherence,
      totalDoses: overallTotal,
      totalTaken: overallTaken,
      perMedication,
    })
  )
})

// ══════════════════════════════════════════════════════
//  10. CAREGIVER VIEW
// ══════════════════════════════════════════════════════
const User = require('../models/User.model');

const getCaregiverView = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, 'userId is required');

  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, 'User not found');

  // Only caregiverVisible medications
  const medications = await Medication.find({
    userId,
    caregiverVisible: true,
    status: 'active',
  }).lean();

  const medIds = medications.map((m) => m._id);

  // Derive medical conditions from indications
  const indications = new Set();
  medications.forEach(m => {
    if (m.indication) indications.add(m.indication);
  });
  
  // Calculate age
  let age = null;
  if (user.dateOfBirth) {
    const diff = Date.now() - new Date(user.dateOfBirth).getTime();
    age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  } else {
    age = 68; // Mock age if missing
  }

  const patientInfo = {
    name: user.fullName,
    age: age,
    medicalConditions: Array.from(indications).join(', ') || 'No specific conditions logged',
    emergencyContact: user.emergencyContacts?.[0] || { name: 'Emergency Services', phone: '911' }
  };

  // Today's doses for these medications
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysDoses = await DoseLog.find({
    userId,
    medicationId: { $in: medIds },
    scheduledAt: { $gte: today, $lt: tomorrow },
  })
    .populate('medicationId', 'name genericName dosage form isHighRisk caregiverVisible')
    .sort({ scheduledAt: 1 })
    .lean();

  // Last 7 days adherence summary
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const recentDoses = await DoseLog.find({
    userId,
    medicationId: { $in: medIds },
    scheduledAt: { $gte: sevenDaysAgo, $lt: today },
  }).lean();

  // Create a 7-day adherence table per medication
  const last7DaysAdherence = medications.map(med => {
    const medDoses = recentDoses.filter(d => d.medicationId.toString() === med._id.toString());
    
    const dailyStatus = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - (7 - i));
      const dateStr = d.toISOString().split('T')[0];
      
      const dayDoses = medDoses.filter(md => md.scheduledAt.toISOString().startsWith(dateStr));
      let status = 'gray'; // no doses
      if (dayDoses.length > 0) {
        const taken = dayDoses.filter(md => md.status === 'taken').length;
        if (taken === dayDoses.length) status = 'green';
        else if (taken > 0) status = 'amber';
        else status = 'red';
      }
      dailyStatus.push({ date: dateStr, status });
    }
    
    return {
      medicationId: med._id,
      name: med.name,
      dosage: med.dosage,
      dailyStatus
    };
  });

  const recentTotal = recentDoses.length;
  const recentTaken = recentDoses.filter((d) => d.status === 'taken').length;
  const recentAdherence = recentTotal > 0 ? +((recentTaken / recentTotal) * 100).toFixed(1) : 0;

  res.json(
    new ApiResponse(200, {
      userId,
      patientInfo,
      todaySchedule: todaysDoses,
      last7DaysAdherence,
      recentAdherence: {
        period: 'last_7_days',
        adherencePct: recentAdherence,
        totalDoses: recentTotal,
        taken: recentTaken,
      },
    })
  );
});

// ══════════════════════════════════════════════════════
//  11. DRUG INFO (Gemini AI)
// ══════════════════════════════════════════════════════
const { GoogleGenerativeAI } = require('@google/generative-ai')

const getDrugInfo = asyncHandler(async (req, res) => {
  const { medicationName } = req.body

  if (!medicationName) {
    throw new ApiError(400, 'medicationName is required')
  }

  const prompt = `
You are a clinical pharmacology assistant. For the medication "${medicationName}", provide concise, patient-friendly information in EXACTLY this JSON format (no markdown code blocks, just pure JSON). Keep the TOTAL response under 200 words.

{
  "use": "What this medication is commonly prescribed for (1-2 sentences).",
  "sideEffects": "Most common side effects (brief list, max 5).",
  "warnings": "Key warnings or precautions patients should know (1-2 sentences).",
  "commonInteractions": "Notable drug or food interactions to avoid (brief list, max 4)."
}
`

  let drugInfoJSON
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Missing GEMINI_API_KEY in .env')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const cleanJSON = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    drugInfoJSON = JSON.parse(cleanJSON)
  } catch (error) {
    console.error('Gemini Drug Info Error:', error.message)
    drugInfoJSON = {
      use: `${medicationName} — drug information could not be retrieved. Please ensure the GEMINI_API_KEY is configured.`,
      sideEffects: 'Information unavailable.',
      warnings: 'Information unavailable.',
      commonInteractions: 'Information unavailable.',
    }
  }

  res.json(new ApiResponse(200, { medicationName, drugInfo: drugInfoJSON }))
})

module.exports = {
  addMedication,
  getMedications,
  getMedicationById,
  updateMedication,
  deleteMedication,
  logDose,
  getTodaysDoses,
  getDoseHistory,
  getAdherence,
  getCaregiverView,
  getDrugInfo,
}
