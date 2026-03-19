const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    // ── HEALTH PROFILE (used by ML later for context) ──
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    heightCm: Number,
    weightKg: Number,

    profilePhoto: {
      url: String,
      cloudinaryId: String,
    },

    emergencyContacts: [
      {
        name: String,
        relation: String,
        phone: String,
        isPrimary: Boolean,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('User', userSchema)
