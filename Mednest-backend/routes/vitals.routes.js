const router = require('express').Router()
const {
  logVital,
  getDashboard,
  getHistory,
  getTrends,
  getInsight,
  deleteVital,
} = require('../controllers/vitals.controller')

// ── LOG A VITAL READING ─────────────────────────────
// POST /api/v1/vitals
router.post('/', logVital)

// ── DASHBOARD (latest + 7d + 30d for all types) ────
// GET /api/v1/vitals/dashboard/:userId
router.get('/dashboard/:userId', getDashboard)

// ── PAGINATED HISTORY ───────────────────────────────
// GET /api/v1/vitals/history/:userId?vitalType=...
router.get('/history/:userId', getHistory)

// ── CHART-READY TRENDS ──────────────────────────────
// GET /api/v1/vitals/trends/:userId?vitalType=...&period=30d
router.get('/trends/:userId', getTrends)

// ── AI INSIGHT CONTEXT ──────────────────────────────
// GET /api/v1/vitals/insight/:userId
router.get('/insight/:userId', getInsight)

// ── SOFT DELETE ─────────────────────────────────────
// DELETE /api/v1/vitals/:entryId
router.delete('/:entryId', deleteVital)

module.exports = router
