const router = require('express').Router()
const {
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
} = require('../controllers/medications.controller')

// ── MEDICATION CRUD ──────────────────────────────────
// POST /api/v1/medications
router.post('/', addMedication)

// GET /api/v1/medications?userId=...&status=active
router.get('/', getMedications)

// ── DOSE TRACKING ───────────────────────────────────
// POST /api/v1/medications/doses/log
router.post('/doses/log', logDose)

// GET /api/v1/medications/doses/today?userId=...
router.get('/doses/today', getTodaysDoses)

// GET /api/v1/medications/doses/history?userId=...
router.get('/doses/history', getDoseHistory)

// ── ANALYTICS & VIEWS ───────────────────────────────
// GET /api/v1/medications/adherence/:userId
router.get('/adherence/:userId', getAdherence)

// GET /api/v1/medications/caregiver/:userId
router.get('/caregiver/:userId', getCaregiverView)

// ── AI DRUG INFO ────────────────────────────────────
// POST /api/v1/medications/drug-info
router.post('/drug-info', getDrugInfo)

// ── MEDICATION CRUD BY ID ───────────────────────────
// GET /api/v1/medications/:id
router.get('/:id', getMedicationById)

// PUT /api/v1/medications/:id
router.put('/:id', updateMedication)

// DELETE /api/v1/medications/:id  (soft delete → discontinued)
router.delete('/:id', deleteMedication)

// (Routes were moved up to avoid /:id interception)

module.exports = router
