const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const { ApiError } = require('../utils/ApiResponse')

// ── MULTER CONFIG ──────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, 'Only JPG, JPEG, and PNG files are accepted'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
})

// ── CLOUDINARY UPLOAD MIDDLEWARE ────────────────────
const uploadToCloudinary = (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'File is required'))
  }

  const userId = req.body.userId
  const folder = `${process.env.CLOUDINARY_RECORDS_FOLDER}/${userId}`

  const stream = cloudinary.uploader.upload_stream(
    {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png'],
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error)
        return next(new ApiError(500, 'Failed to upload file to cloud storage'))
      }

      // Detect file type from MIME
      const mimeToExt = {
        'image/jpeg': 'jpeg',
        'image/jpg': 'jpg',
        'image/png': 'png',
      }

      req.cloudinaryResult = {
        cloudinaryId: result.public_id,
        url: result.secure_url,
        fileType: mimeToExt[req.file.mimetype] || 'jpg',
        fileSizeKb: Math.round(req.file.size / 1024),
        originalFileName: req.file.originalname,
        width: result.width,
        height: result.height,
      }

      next()
    }
  )

  stream.end(req.file.buffer)
}

module.exports = {
  uploadSingle: upload.single('file'),
  uploadToCloudinary,
}
