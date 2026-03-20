const VitalEntry = require('../models/VitalEntry.model')
const { VITAL_TYPES } = require('../models/VitalEntry.model')
const asyncHandler = require('../utils/asyncHandler')
const { ApiResponse, ApiError } = require('../utils/ApiResponse')

// ══════════════════════════════════════════════════════
//  HELPER — Compute stress score from latest readings
// ══════════════════════════════════════════════════════
async function computeStressScore(userId) {
  const [latestSleep, latestHR, latestActivity] = await Promise.all([
    VitalEntry.findOne({
      userId,
      vitalType: 'sleep',
      isDeleted: false,
    }).sort({ recordedAt: -1 }),
    VitalEntry.findOne({
      userId,
      vitalType: 'heart_rate',
      'heartRate.context': 'resting',
      isDeleted: false,
    }).sort({ recordedAt: -1 }),
    VitalEntry.findOne({
      userId,
      vitalType: 'activity',
      isDeleted: false,
    }).sort({ recordedAt: -1 }),
  ])

  let score = 50 // baseline

  // Sleep component (0-35 points)
  if (latestSleep && latestSleep.sleep) {
    const hrs = latestSleep.sleep.durationMinutes / 60
    const qualityMap = { poor: 30, fair: 20, good: 10, excellent: 0 }
    const sleepPenalty = qualityMap[latestSleep.sleep.quality] ?? 15
    if (hrs < 5) score += 15
    else if (hrs < 6) score += 10
    else if (hrs < 7) score += 5
    else score -= 10
    score += sleepPenalty - 15 // normalize around 0
  }

  // Heart rate component (0-30 points)
  if (latestHR && latestHR.heartRate) {
    const bpm = latestHR.heartRate.bpm
    if (bpm > 100) score += 15
    else if (bpm > 85) score += 8
    else if (bpm > 72) score += 3
    else score -= 5
  }

  // Activity component (0-25 points)
  if (latestActivity && latestActivity.activity) {
    const steps = latestActivity.activity.steps
    if (steps < 3000) score += 10
    else if (steps < 5000) score += 5
    else if (steps >= 10000) score -= 10
    else score -= 3
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ══════════════════════════════════════════════════════
//  1. LOG A VITAL READING
// ══════════════════════════════════════════════════════
const logVital = asyncHandler(async (req, res) => {
  const { userId, vitalType, recordedAt, source, notes, data } = req.body

  if (!userId || !vitalType) {
    throw new ApiError(400, 'userId and vitalType are required')
  }
  if (!VITAL_TYPES.includes(vitalType)) {
    throw new ApiError(400, `Invalid vitalType. Must be one of: ${VITAL_TYPES.join(', ')}`)
  }

  const entry = new VitalEntry({
    userId,
    vitalType,
    recordedAt: recordedAt || new Date(),
    source: source || 'manual',
    notes,
  })

  // Stress score is computed, not manually entered
  if (vitalType === 'stress_score') {
    const computed = await computeStressScore(userId)
    entry.stressScore = { value: computed }
  } else {
    // Map the type-specific data
    const fieldMap = {
      blood_pressure: 'bloodPressure',
      blood_glucose: 'bloodGlucose',
      weight: 'weight',
      heart_rate: 'heartRate',
      spo2: 'spo2',
      sleep: 'sleep',
      activity: 'activity',
      calories: 'calories',
    }
    const field = fieldMap[vitalType]
    if (!data) {
      throw new ApiError(400, `data object is required for vitalType "${vitalType}"`)
    }
    entry[field] = data
  }

  await entry.save() // pre-save hook sets category

  res.status(201).json(
    new ApiResponse(201, { entry }, 'Vital logged successfully')
  )
})

// ══════════════════════════════════════════════════════
//  2. DASHBOARD — latest + 7d data + 30d stats
// ══════════════════════════════════════════════════════
const getDashboard = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (!userId) throw new ApiError(400, 'userId is required')

  const now = new Date()
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)

  const dashboard = {}

  // Process all vital types in parallel
  await Promise.all(
    VITAL_TYPES.map(async (type) => {
      const baseFilter = { userId, vitalType: type, isDeleted: false }

      const [latest, sevenDayData, thirtyDayData] = await Promise.all([
        VitalEntry.findOne(baseFilter).sort({ recordedAt: -1 }).lean(),
        VitalEntry.find({ ...baseFilter, recordedAt: { $gte: sevenDaysAgo } })
          .sort({ recordedAt: -1 })
          .lean(),
        VitalEntry.find({ ...baseFilter, recordedAt: { $gte: thirtyDaysAgo } })
          .sort({ recordedAt: -1 })
          .lean(),
      ])

      // Compute 30-day stats
      const stats = compute30DayStats(type, thirtyDayData)

      dashboard[type] = {
        latest: latest || null,
        sevenDayData,
        thirtyDayStats: stats,
      }
    })
  )

  res.json(new ApiResponse(200, { dashboard }))
})

// Helper: compute 30-day aggregated stats per type
function compute30DayStats(type, entries) {
  if (!entries.length) return { count: 0 }

  const stats = { count: entries.length }

  const getValues = (field) =>
    entries.map((e) => e[field]).filter((v) => v != null)

  const numStats = (vals) => {
    if (!vals.length) return null
    return {
      avg: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      min: Math.min(...vals),
      max: Math.max(...vals),
    }
  }

  switch (type) {
    case 'blood_pressure': {
      const sys = entries.map((e) => e.bloodPressure?.systolic).filter(Boolean)
      const dia = entries.map((e) => e.bloodPressure?.diastolic).filter(Boolean)
      stats.systolic = numStats(sys)
      stats.diastolic = numStats(dia)
      break
    }
    case 'blood_glucose': {
      const vals = entries.map((e) => e.bloodGlucose?.value).filter(Boolean)
      stats.value = numStats(vals)
      break
    }
    case 'weight': {
      const vals = entries.map((e) => e.weight?.value).filter(Boolean)
      stats.value = numStats(vals)
      break
    }
    case 'heart_rate': {
      const vals = entries.map((e) => e.heartRate?.bpm).filter(Boolean)
      stats.bpm = numStats(vals)
      break
    }
    case 'spo2': {
      const vals = entries.map((e) => e.spo2?.value).filter(Boolean)
      stats.value = numStats(vals)
      break
    }
    case 'sleep': {
      const dur = entries.map((e) => e.sleep?.durationMinutes).filter(Boolean)
      stats.durationMinutes = numStats(dur)
      break
    }
    case 'activity': {
      const steps = entries.map((e) => e.activity?.steps).filter((v) => v != null)
      const mins = entries
        .map((e) => e.activity?.activeMinutes)
        .filter((v) => v != null)
      stats.steps = numStats(steps)
      stats.activeMinutes = numStats(mins)
      break
    }
    case 'calories': {
      const intake = entries.map((e) => e.calories?.intake).filter((v) => v != null)
      const burned = entries.map((e) => e.calories?.burned).filter((v) => v != null)
      stats.intake = numStats(intake)
      stats.burned = numStats(burned)
      break
    }
    case 'stress_score': {
      const vals = entries.map((e) => e.stressScore?.value).filter((v) => v != null)
      stats.value = numStats(vals)
      break
    }
  }

  return stats
}

// ══════════════════════════════════════════════════════
//  3. HISTORY — paginated, filtered by type & date
// ══════════════════════════════════════════════════════
const getHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { vitalType, from, to, page = 1, limit = 20 } = req.query

  if (!vitalType) throw new ApiError(400, 'vitalType query param is required')

  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const filter = { userId, vitalType, isDeleted: false }
  if (from || to) {
    filter.recordedAt = {}
    if (from) filter.recordedAt.$gte = new Date(from)
    if (to) filter.recordedAt.$lte = new Date(to)
  }

  const [entries, total] = await Promise.all([
    VitalEntry.find(filter).sort({ recordedAt: -1 }).skip(skip).limit(limitNum).lean(),
    VitalEntry.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limitNum)

  res.json(
    new ApiResponse(200, {
      entries,
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
//  4. TRENDS — chart-ready data for a single vital type
// ══════════════════════════════════════════════════════
const getTrends = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { vitalType, period = '30d' } = req.query

  if (!vitalType) throw new ApiError(400, 'vitalType query param is required')

  const periodMap = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  }
  const days = periodMap[period] || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const entries = await VitalEntry.find({
    userId,
    vitalType,
    isDeleted: false,
    recordedAt: { $gte: since },
  })
    .sort({ recordedAt: 1 })
    .lean()

  // Build chart-ready data points
  const dataPoints = entries.map((e) => {
    const point = {
      date: e.recordedAt,
      category: e.category,
    }

    switch (vitalType) {
      case 'blood_pressure':
        point.systolic = e.bloodPressure?.systolic
        point.diastolic = e.bloodPressure?.diastolic
        point.pulse = e.bloodPressure?.pulse
        break
      case 'blood_glucose':
        point.value = e.bloodGlucose?.value
        point.measuredWhen = e.bloodGlucose?.measuredWhen
        break
      case 'weight':
        point.value = e.weight?.value
        break
      case 'heart_rate':
        point.bpm = e.heartRate?.bpm
        point.context = e.heartRate?.context
        break
      case 'spo2':
        point.value = e.spo2?.value
        break
      case 'sleep':
        point.durationMinutes = e.sleep?.durationMinutes
        point.quality = e.sleep?.quality
        break
      case 'activity':
        point.steps = e.activity?.steps
        point.activeMinutes = e.activity?.activeMinutes
        point.distanceKm = e.activity?.distanceKm
        break
      case 'calories':
        point.intake = e.calories?.intake
        point.burned = e.calories?.burned
        break
      case 'stress_score':
        point.value = e.stressScore?.value
        break
    }

    return point
  })

  res.json(
    new ApiResponse(200, {
      vitalType,
      period,
      dataPoints,
    })
  )
})

// ══════════════════════════════════════════════════════
//  5. INSIGHT — Structured AI Context (Phase 3)
// ══════════════════════════════════════════════════════
const { GoogleGenerativeAI } = require('@google/generative-ai')
const VitalInsightCache = require('../models/VitalInsightCache.model')
const HealthRecord = require('../models/HealthRecord.model')

const getInsight = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { vitalType, period = '30d' } = req.query

  if (!vitalType) throw new ApiError(400, 'vitalType query param is required')

  // 1. Check Cache
  const cached = await VitalInsightCache.findOne({ userId, vitalType, period })
  if (cached) {
    return res.json(
      new ApiResponse(200, {
        userId,
        vitalType,
        period,
        generatedAt: cached.generatedAt,
        context: cached.insightData,
        cached: true,
      })
    )
  }

  // 2. Determine Date Range
  const periodMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 3650 }
  const days = periodMap[period] || 30
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  // 3. Gather Vital Readings
  const readings = await VitalEntry.find({
    userId,
    vitalType,
    isDeleted: false,
    recordedAt: { $gte: since },
  })
    .sort({ recordedAt: -1 })
    .limit(30) // Only send max 30 recent readings to AI for context
    .lean()

  if (!readings.length) {
    return res.json(
      new ApiResponse(200, {
        userId,
        vitalType,
        period,
        context: {
          trendSummary: "You don't have any recent data for this vital.",
          assessment: 'insufficient_data',
          actionableRecommendation: 'Start logging your vitals to see AI insights here.',
          seeDoctor: false,
        },
      })
    )
  }

  // Format array for prompt
  const readingsData = readings.map((r) => {
    let val = ''
    switch (vitalType) {
      case 'blood_pressure': val = `${r.bloodPressure?.systolic}/${r.bloodPressure?.diastolic}`; break;
      case 'blood_glucose': val = `${r.bloodGlucose?.value} (${r.bloodGlucose?.measuredWhen})`; break;
      case 'weight': val = `${r.weight?.value} kg`; break;
      case 'heart_rate': val = `${r.heartRate?.bpm} bpm`; break;
      case 'spo2': val = `${r.spo2?.value}%`; break;
      case 'sleep': val = `${(r.sleep?.durationMinutes / 60).toFixed(1)} hrs (${r.sleep?.quality})`; break;
      case 'activity': val = `${r.activity?.steps} steps`; break;
      case 'calories': val = `Intake: ${r.calories?.intake}, Burned: ${r.calories?.burned}`; break;
      case 'stress_score': val = `${r.stressScore?.value}/100`; break;
    }
    return `[${new Date(r.recordedAt).toISOString().split('T')[0]}] Value: ${val} | Category: ${r.category || 'N/A'}`
  })

  // 4. Gather Medical Context (Active conditions and medications) 
  // We search the user's HealthRecords for relevant extracted ML data
  const healthRecords = await HealthRecord.find({
    userId,
    isDeleted: false,
    'mlPipeline.status': 'completed'
  }).limit(50).lean()

  const conditions = new Set()
  const medications = new Set()

  healthRecords.forEach(hr => {
    if (hr.extractedData?.conditions) hr.extractedData.conditions.forEach(c => conditions.add(c))
    if (hr.extractedData?.medications) hr.extractedData.medications.forEach(m => medications.add(m.name || m))
  })

  // 5. Construct Gemini Prompt
  const prompt = `
You are a medical AI assistant providing a concise trend insight for a patient's ${vitalType.replace('_', ' ')} tracker.

Patient Context:
- Active Conditions: ${conditions.size > 0 ? Array.from(conditions).join(', ') : 'None documented'}
- Active Medications: ${medications.size > 0 ? Array.from(medications).join(', ') : 'None documented'}

Recent Readings (Last 30 entries, newest first):
${readingsData.join('\n')}

Analyze this data and provide a concise, patient-friendly response in EXACTLY this JSON format (no markdown code blocks, just pure JSON). Output maximum 100-150 words total.
{
  "trendSummary": "A concise 2-3 sentence summary of how their ${vitalType.replace('_', ' ')} has trended over the period, highlighting positive or negative directions.",
  "assessment": "MUST be exactly one of: 'improving', 'stable', 'worsening', or 'insufficient_data'",
  "actionableRecommendation": "One highly specific, practical daily action to improve or maintain this vital.",
  "seeDoctor": boolean // true if readings indicate dangerous ongoing abnormality, else false
}
`

  // 6. Call Gemini
  let aiResponseJSON;
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('Missing GEMINI_API_KEY in .env')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' }) // Fast model
    
    // We can also use prompt directly with generateContent
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Clean potential markdown wrapping
    const cleanJSON = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    aiResponseJSON = JSON.parse(cleanJSON)
    
  } catch (error) {
    console.error('Gemini API Error:', error)
    // Fallback if AI fails or token missing
    aiResponseJSON = {
      trendSummary: `We tracked ${readings.length} readings for ${vitalType.replace('_', ' ')}. Please ensure your API key is correctly configured in the backend environment.`,
      assessment: 'stable',
      actionableRecommendation: 'Stay consistent with your tracking.',
      seeDoctor: false
    }
  }

  // 7. Cache Response
  try {
    await VitalInsightCache.create({
      userId,
      vitalType,
      period,
      insightData: aiResponseJSON
    })
  } catch (err) {
    console.error('Failed to cache insight:', err) // ignore Duplicate Key errors
  }

  res.json(
    new ApiResponse(200, {
      userId,
      vitalType,
      period,
      generatedAt: new Date(),
      context: aiResponseJSON,
      cached: false,
    })
  )
})

// ══════════════════════════════════════════════════════
//  6. DELETE — soft delete
// ══════════════════════════════════════════════════════
const deleteVital = asyncHandler(async (req, res) => {
  const entry = await VitalEntry.findOne({
    _id: req.params.entryId,
    isDeleted: false,
  })

  if (!entry) {
    throw new ApiError(404, 'Vital entry not found')
  }

  entry.isDeleted = true
  entry.deletedAt = new Date()
  await entry.save()

  res.json(new ApiResponse(200, null, 'Vital entry deleted successfully'))
})

module.exports = {
  logVital,
  getDashboard,
  getHistory,
  getTrends,
  getInsight,
  deleteVital,
}
