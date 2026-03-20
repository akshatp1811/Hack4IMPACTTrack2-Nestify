const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { ApiError } = require('./utils/ApiResponse')

const app = express()

// ── MIDDLEWARE ───────────────────────────────────
app.use(cors())
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── ROUTES ──────────────────────────────────────
const recordsRoutes = require('./routes/records.routes')
app.use('/api/v1/records', recordsRoutes)
const vitalsRoutes = require('./routes/vitals.routes')
app.use('/api/v1/vitals', vitalsRoutes)
app.use('/api/v1/medications', require('./routes/medications.routes'))
app.use('/api/v1/reports', require('./routes/reports.routes'))

// ── HEALTH CHECK ────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 HANDLER ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  })
})

// ── GLOBAL ERROR HANDLER ────────────────────────
app.use((err, req, res, next) => {
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size must be under 10MB',
    })
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    })
  }

  console.error('Unhandled Error:', err)
  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal Server Error',
  })
})

module.exports = app
