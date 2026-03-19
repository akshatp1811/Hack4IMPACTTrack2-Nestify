const router = require('express').Router()
const {
  uploadFileOnly,
  createRecord,
  getAllRecords,
  getRecord,
  updateRecord,
  deleteRecord,
  getGroupedScans,
  getParameterTrends,
  compareRecords,
} = require('../controllers/records.controller')
const {
  uploadSingle,
  uploadToCloudinary,
} = require('../middleware/upload.middleware')
const {
  createRecordRules,
  uploadFileRules,
  updateRules,
  compareRules,
  recordIdRule,
  userIdQueryRule,
} = require('../middleware/validate.middleware')

// ── UPLOAD FILE ONLY ───────────────────────────────
// POST /api/v1/records/upload-file
router.post('/upload-file', uploadSingle, uploadFileRules, uploadToCloudinary, uploadFileOnly)

// ── CREATE RECORD ──────────────────────────────────
// POST /api/v1/records
router.post('/', createRecordRules, createRecord)

// ── GROUPED SCANS ──────────────────────────────────
// GET /api/v1/records/grouped/scans
router.get('/grouped/scans', userIdQueryRule, getGroupedScans)

// ── PARAMETER TRENDS ───────────────────────────────
// GET /api/v1/records/trends/:parameterKey
router.get('/trends/:parameterKey', getParameterTrends)

// ── COMPARE TWO RECORDS ────────────────────────────
// POST /api/v1/records/compare
router.post('/compare', compareRules, compareRecords)

// ── GET ALL RECORDS (Timeline) ─────────────────────
// GET /api/v1/records
router.get('/', getAllRecords)

// ── GET SINGLE RECORD ──────────────────────────────
// GET /api/v1/records/:recordId
router.get('/:recordId', recordIdRule, getRecord)

// ── UPDATE A RECORD ────────────────────────────────
// PUT /api/v1/records/:recordId
router.put('/:recordId', updateRules, updateRecord)

// ── DELETE A RECORD ────────────────────────────────
// DELETE /api/v1/records/:recordId
router.delete('/:recordId', recordIdRule, deleteRecord)

module.exports = router
