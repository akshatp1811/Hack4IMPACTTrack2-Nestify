const { body, param, query, validationResult } = require('express-validator')
const { ApiError } = require('../utils/ApiResponse')

// ── RUN VALIDATION ─────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg)
    throw new ApiError(400, messages.join(', '), errors.array())
  }
  next()
}

// ── RULE SETS ──────────────────────────────────────

const createRecordRules = [
  body('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isMongoId()
    .withMessage('userId must be a valid MongoDB ObjectId'),
  body('recordType')
    .notEmpty()
    .withMessage('recordType is required')
    .isIn(['visit', 'scan', 'lab_report', 'prescription', 'consultation'])
    .withMessage(
      'recordType must be one of: visit, scan, lab_report, prescription, consultation'
    ),
  body('recordDate')
    .notEmpty()
    .withMessage('recordDate is required')
    .isISO8601()
    .withMessage('recordDate must be a valid ISO date')
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error('recordDate cannot be in the future')
      }
      return true
    }),
  body('subType').optional().isString().trim(),
  body('doctorName').optional().isString().trim(),
  body('facilityName').optional().isString().trim(),
  body('userNotes').optional().isString().trim(),
  validate,
]

const uploadFileRules = [
  body('userId')
    .notEmpty()
    .withMessage('userId is required')
    .isMongoId()
    .withMessage('userId must be a valid MongoDB ObjectId'),
  validate,
]

const updateRules = [
  param('recordId')
    .isMongoId()
    .withMessage('recordId must be a valid MongoDB ObjectId'),
  body('recordType')
    .optional()
    .isIn(['visit', 'scan', 'lab_report', 'prescription', 'consultation'])
    .withMessage(
      'recordType must be one of: visit, scan, lab_report, prescription, consultation'
    ),
  body('recordDate')
    .optional()
    .isISO8601()
    .withMessage('recordDate must be a valid ISO date'),
  body('subType').optional().isString().trim(),
  body('doctorName').optional().isString().trim(),
  body('facilityName').optional().isString().trim(),
  body('userNotes').optional().isString().trim(),
  validate,
]

const compareRules = [
  body('recordIdA')
    .notEmpty()
    .withMessage('recordIdA is required')
    .isMongoId()
    .withMessage('recordIdA must be a valid MongoDB ObjectId'),
  body('recordIdB')
    .notEmpty()
    .withMessage('recordIdB is required')
    .isMongoId()
    .withMessage('recordIdB must be a valid MongoDB ObjectId'),
  validate,
]

const recordIdRule = [
  param('recordId')
    .isMongoId()
    .withMessage('recordId must be a valid MongoDB ObjectId'),
  validate,
]

const userIdQueryRule = [
  query('userId')
    .notEmpty()
    .withMessage('userId query param is required')
    .isMongoId()
    .withMessage('userId must be a valid MongoDB ObjectId'),
  validate,
]

module.exports = {
  createRecordRules,
  uploadFileRules,
  updateRules,
  compareRules,
  recordIdRule,
  userIdQueryRule,
}
