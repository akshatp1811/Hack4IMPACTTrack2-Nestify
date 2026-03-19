const HealthRecord = require('../models/HealthRecord.model')
const cloudinary = require('../config/cloudinary')
const asyncHandler = require('../utils/asyncHandler')
const { ApiResponse, ApiError } = require('../utils/ApiResponse')
const { buildGroupPipeline } = require('../utils/groupRecords')
const normalizeGroupKey = require('../utils/normalizeGroupKey')

// ═════════════════════════════════════════════════════
// 1A. UPLOAD FILE ONLY
// ═════════════════════════════════════════════════════
const uploadFileOnly = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, { fileData: req.cloudinaryResult }, 'File uploaded successfully')
  )
})

// ═════════════════════════════════════════════════════
// 1B. CREATE A RECORD
// ═════════════════════════════════════════════════════
const createRecord = asyncHandler(async (req, res) => {
  const {
    userId,
    recordType,
    subType,
    recordDate,
    doctorName,
    facilityName,
    userNotes,
  } = req.body

  const record = await HealthRecord.create({
    userId,
    recordType,
    subType: subType || undefined,
    recordDate,
    doctorName: doctorName || null,
    facilityName: facilityName || null,
    userNotes: userNotes || null,
    originalFile: req.body.originalFile,
    mlPipeline: { status: 'pending' },
  })

  res.status(201).json(
    new ApiResponse(201, { record }, 'Record uploaded successfully')
  )
})

// ═════════════════════════════════════════════════════
// 2. GET ALL RECORDS (Timeline)
// ═════════════════════════════════════════════════════
const getAllRecords = asyncHandler(async (req, res) => {
  const {
    userId,
    type,
    groupBy,
    from,
    to,
    search,
    page = 1,
    limit = 20,
  } = req.query

  // ── GROUPED RESPONSE ──
  if (groupBy === 'true') {
    const matchFilter = {}
    if (type) matchFilter.recordType = type
    if (from || to) {
      matchFilter.recordDate = {}
      if (from) matchFilter.recordDate.$gte = new Date(from)
      if (to) matchFilter.recordDate.$lte = new Date(to)
    }
    if (search) {
      matchFilter.$or = [
        { doctorName: { $regex: search, $options: 'i' } },
        { facilityName: { $regex: search, $options: 'i' } },
        { subType: { $regex: search, $options: 'i' } },
      ]
    }

    const pipeline = buildGroupPipeline(userId, matchFilter)
    const groups = await HealthRecord.aggregate(pipeline)

    return res.json(new ApiResponse(200, { groups }))
  }

  // ── FLAT TIMELINE RESPONSE ──
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  const filter = { userId, isDeleted: false }
  if (type) filter.recordType = type
  if (from || to) {
    filter.recordDate = {}
    if (from) filter.recordDate.$gte = new Date(from)
    if (to) filter.recordDate.$lte = new Date(to)
  }
  if (search) {
    filter.$or = [
      { doctorName: { $regex: search, $options: 'i' } },
      { facilityName: { $regex: search, $options: 'i' } },
      { subType: { $regex: search, $options: 'i' } },
    ]
  }

  const [records, total] = await Promise.all([
    HealthRecord.find(filter)
      .sort({ recordDate: -1 })
      .skip(skip)
      .limit(limitNum),
    HealthRecord.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limitNum)

  res.json(
    new ApiResponse(200, {
      records,
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

// ═════════════════════════════════════════════════════
// 3. GET SINGLE RECORD
// ═════════════════════════════════════════════════════
const getRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findOne({
    _id: req.params.recordId,
    isDeleted: false,
  })

  if (!record) {
    throw new ApiError(404, 'Record not found')
  }

  res.json(new ApiResponse(200, { record }))
})

// ═════════════════════════════════════════════════════
// 4. UPDATE A RECORD
// ═════════════════════════════════════════════════════
const updateRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findOne({
    _id: req.params.recordId,
    isDeleted: false,
  })

  if (!record) {
    throw new ApiError(404, 'Record not found')
  }

  const {
    recordType,
    subType,
    recordDate,
    doctorName,
    facilityName,
    userNotes,
    extractedData,
  } = req.body

  // Update basic fields if provided
  if (recordType !== undefined) record.recordType = recordType
  if (subType !== undefined) {
    record.subType = subType
    record.groupKey = normalizeGroupKey(subType)
  }
  if (recordDate !== undefined) record.recordDate = recordDate
  if (doctorName !== undefined) record.doctorName = doctorName
  if (facilityName !== undefined) record.facilityName = facilityName
  if (userNotes !== undefined) record.userNotes = userNotes

  // Handle extractedData with user override tracking
  if (extractedData !== undefined) {
    if (record.extractedData !== null && !record.userOverrides) {
      // ML data already exists — preserve original
      record.originalMlExtraction = record.extractedData
    }
    record.extractedData = extractedData
    record.userOverrides = true
  }

  await record.save()

  res.json(new ApiResponse(200, { record }, 'Record updated'))
})

// ═════════════════════════════════════════════════════
// 5. DELETE A RECORD (Soft Delete)
// ═════════════════════════════════════════════════════
const deleteRecord = asyncHandler(async (req, res) => {
  const record = await HealthRecord.findOne({
    _id: req.params.recordId,
    isDeleted: false,
  })

  if (!record) {
    throw new ApiError(404, 'Record not found')
  }

  // Hard delete from Cloudinary
  if (record.originalFile && record.originalFile.cloudinaryId) {
    try {
      await cloudinary.uploader.destroy(record.originalFile.cloudinaryId)
    } catch (err) {
      console.error('Cloudinary delete failed:', err.message)
      // Continue with soft delete even if Cloudinary fails
    }
  }

  // Soft delete in database
  record.isDeleted = true
  record.deletedAt = new Date()
  await record.save()

  res.json(new ApiResponse(200, null, 'Record deleted successfully'))
})

// ═════════════════════════════════════════════════════
// 6. GET GROUPED SCANS
// ═════════════════════════════════════════════════════
const getGroupedScans = asyncHandler(async (req, res) => {
  const { userId } = req.query

  const pipeline = buildGroupPipeline(userId, { recordType: 'scan' })
  const groups = await HealthRecord.aggregate(pipeline)

  // Slim down records inside each group
  const slimGroups = groups.map((group) => ({
    ...group,
    records: group.records.map((r) => ({
      _id: r._id,
      recordDate: r.recordDate,
      doctorName: r.doctorName,
      facilityName: r.facilityName,
      originalFile: {
        url: r.originalFile?.url,
        fileType: r.originalFile?.fileType,
      },
      mlPipeline: { status: r.mlPipeline?.status },
      extractedData: r.extractedData,
      aiSummary: r.aiSummary,
      createdAt: r.createdAt,
    })),
  }))

  res.json(new ApiResponse(200, { groups: slimGroups }))
})

// ═════════════════════════════════════════════════════
// 7. GET PARAMETER TRENDS
// ═════════════════════════════════════════════════════
const getParameterTrends = asyncHandler(async (req, res) => {
  const { parameterKey } = req.params
  const { userId, recordType, from, to } = req.query

  if (!userId || !recordType) {
    throw new ApiError(400, 'userId and recordType query params are required')
  }

  const filter = {
    userId,
    recordType,
    isDeleted: false,
    'mlPipeline.status': 'completed',
    'extractedData.parameters': {
      $elemMatch: { parameterKey },
    },
  }

  if (from || to) {
    filter.recordDate = {}
    if (from) filter.recordDate.$gte = new Date(from)
    if (to) filter.recordDate.$lte = new Date(to)
  }

  const records = await HealthRecord.find(filter).sort({ recordDate: 1 })

  // Extract the matching parameter from each record
  let unit = null
  let referenceMin = null
  let referenceMax = null

  const dataPoints = records
    .map((record) => {
      const param = record.extractedData?.parameters?.find(
        (p) => p.parameterKey === parameterKey
      )
      if (!param) return null

      // Capture reference range from most recent record
      if (param.unit) unit = param.unit
      if (param.referenceMin != null) referenceMin = param.referenceMin
      if (param.referenceMax != null) referenceMax = param.referenceMax

      return {
        recordId: record._id,
        date: record.recordDate,
        value: param.value,
        status: param.status,
      }
    })
    .filter(Boolean)

  res.json(
    new ApiResponse(200, {
      parameterKey,
      unit,
      referenceMin,
      referenceMax,
      dataPoints,
    })
  )
})

// ═════════════════════════════════════════════════════
// 8. COMPARE TWO RECORDS
// ═════════════════════════════════════════════════════
const compareRecords = asyncHandler(async (req, res) => {
  const { recordIdA, recordIdB } = req.body

  const recordA = await HealthRecord.findOne({ _id: recordIdA, isDeleted: false })

  if (!recordA) {
    throw new ApiError(404, `Record A (${recordIdA}) not found`)
  }

  // To build allHistory, we use the recordType and subType of A
  const allHistory = await HealthRecord.find({
    user_id: recordA.user_id, // assuming user isolation
    recordType: recordA.recordType,
    subType: recordA.subType,
    isDeleted: false
  }).sort({ recordDate: 1 })

  let recordB = null;
  if (!recordIdB && allHistory.length > 1) {
    const aIndex = allHistory.findIndex(r => r._id.toString() === recordIdA.toString());
    if (aIndex > 0) {
      recordB = allHistory[aIndex - 1];
    }
  } else if (recordIdB) {
    recordB = await HealthRecord.findOne({ _id: recordIdB, isDeleted: false })
  }

  // Remove the old block that searched for recordA again

  // Build the mock comparison
  let comparison = null;

  if (recordB) {
    let mockChanges = [];
    if (recordA.recordType === 'lab_report' || recordA.recordType === 'lab') {
      const resultsA = recordA.extractedData?.results || [];
      const resultsB = recordB.extractedData?.results || [];
      
      // Mock changes
      mockChanges = resultsA.map(a => {
        const b = resultsB.find(r => r.name === a.name);
        const valA = parseFloat(a.value);
        const valB = b ? parseFloat(b.value) : null;
        let changeLabel = '→';
        let sig = '— Normal var.';
        
        if (b && !isNaN(valA) && !isNaN(valB)) {
          if (valA > valB * 1.05) { changeLabel = '↑'; sig = '⚠ Increased'; }
          else if (valA < valB * 0.95) { changeLabel = '↓'; sig = '✓ Decreased'; }
        }
        
        return {
          parameter: a.name,
          current: a.value,
          previous: b ? b.value : 'N/A',
          change: changeLabel,
          significance: sig
        }
      });
      
      // Give it some dummy data if empty
      if (mockChanges.length === 0) {
        mockChanges = [
          { parameter: 'Hemoglobin', current: '13.2', previous: '14.8', change: '↓', significance: '⚠ Worsened' },
          { parameter: 'LDL Cholesterol', current: '138', previous: '142', change: '→', significance: '— Normal var.' },
          { parameter: 'HDL Cholesterol', current: '52', previous: '48', change: '↑', significance: '✓ Improved' }
        ];
      }
    }

    comparison = {
      summary: "This analysis compares the current record securely with previous records over time.",
      changes: mockChanges,
      overallTrend: "Stable progression. Longitudinal pattern suggests monitoring is appropriate.",
      aiInsight: "• Current values show slight deviation from the previous record but remain structurally intact.\n• Consistent pattern detected across the timeline.\n• Focus on dietary improvements is highly recommended.",
      clinicalNote: "These findings are for informational purposes. Please discuss with your doctor before making any health decisions."
    };
  }

  res.json(
    new ApiResponse(200, {
      recordA,
      recordB,
      allHistory,
      comparison,
    })
  )
})

module.exports = {
  uploadFileOnly,
  createRecord,
  getAllRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  getGroupedScans,
  getParameterTrends,
  compareRecords,
}
