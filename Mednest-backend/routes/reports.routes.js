const router = require('express').Router();
const {
  generateReport,
  getReportById,
  getUserReports,
  exportReport,
  getSharedReport,
  deleteReport,
  getContext,
} = require('../controllers/reports.controller');

// ── INTERNAL / ML EXPOSED CONTEXT ENDPOINT ──
// GET /api/v1/reports/context/:userId?type=patient|doctor|insurance
router.get('/context/:userId', getContext);

// ── PUBLIC SHARE ENDPOINT ──
// GET /api/v1/reports/share/:token
router.get('/share/:token', getSharedReport);

// ── PROTECTED CRUD ENDPOINTS ──
// POST /api/v1/reports/generate (body: { userId, type })
router.post('/generate', generateReport);

// GET /api/v1/reports/user/:userId
router.get('/user/:userId', getUserReports);

// GET /api/v1/reports/:reportId
router.get('/:reportId', getReportById);

// POST /api/v1/reports/:reportId/export
router.post('/:reportId/export', exportReport);

// DELETE /api/v1/reports/:reportId
router.delete('/:reportId', deleteReport);

module.exports = router;
