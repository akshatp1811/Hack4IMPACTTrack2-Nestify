/**
 * MedNest — Medications Seed Script
 *
 * Usage: npm run seed:medications
 *
 * Seeds 3 active medications + 60 days of DoseLog entries for the dev user.
 *
 * Adherence targets (realistic, non-uniform scatter):
 *   - Amlodipine 5mg   → ~92% (high-risk BP med, patient is diligent)
 *   - Atorvastatin 10mg → ~78% (evening med, more often forgotten)
 *   - Levothyroxine 50mcg → ~88% (morning med, occasional misses)
 */

require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const User = require('../models/User.model')
const Medication = require('../models/Medication.model')
const DoseLog = require('../models/DoseLog.model')

const DEV_USER_ID = '69bb95764168f06db6f394e5'

// ── Helpers ──────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.round(rand(min, max))
const chance = (pct) => Math.random() < pct

/**
 * Decide if a dose should be missed on a given day.
 * Uses clustered pattern: higher miss probability on weekends and
 * occasional 2-3 day "forget streaks" rather than uniform random.
 */
function shouldMiss(dayIndex, baseMissRate, streakState) {
  const dayOfWeek = new Date(
    Date.now() - dayIndex * 24 * 60 * 60 * 1000
  ).getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  // If in an active forget-streak, continue missing
  if (streakState.remaining > 0) {
    streakState.remaining--
    return true
  }

  // Weekend bump: 1.8× more likely to miss
  const effectiveRate = isWeekend ? baseMissRate * 1.8 : baseMissRate

  if (Math.random() < effectiveRate) {
    // 30% chance of starting a 2-3 day forget-streak
    if (Math.random() < 0.3) {
      streakState.remaining = randInt(1, 2) // 1-2 more days after this
    }
    return true
  }

  return false
}

// ── Medication Definitions ───────────────────────────
const MEDICATIONS = [
  {
    name: 'Amlodipine',
    genericName: 'Amlodipine Besylate',
    drugClass: 'Antihypertensive (Calcium Channel Blocker)',
    dosage: '5mg',
    form: 'tablet',
    frequency: {
      timesPerDay: 1,
      specificTimes: ['08:00'],
      daysOfWeek: [],
      instructions: 'Take with or without food. Avoid grapefruit.',
    },
    prescribedBy: 'Dr. Mehra',
    indication: 'Hypertension',
    caregiverVisible: true,
    refillInfo: { totalDays: 90, remainingDays: 42, lastRefillDate: new Date(Date.now() - 48 * 86400000) },
    drugInfo: {
      use: 'Used to treat high blood pressure (hypertension) and certain types of chest pain (angina). Helps relax blood vessels so blood flows more easily.',
      sideEffects: 'Swelling in ankles/feet, dizziness, flushing, fatigue, nausea.',
      warnings: 'Do not stop suddenly. May cause low blood pressure if combined with other BP meds. Avoid grapefruit juice.',
      interactions: 'Simvastatin (limit dose), cyclosporine, other blood pressure medications.',
    },
    targetAdherence: 0.92,
    baseMissRate: 0.08,
  },
  {
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    drugClass: 'Statin (HMG-CoA Reductase Inhibitor)',
    dosage: '10mg',
    form: 'tablet',
    frequency: {
      timesPerDay: 1,
      specificTimes: ['21:00'],
      daysOfWeek: [],
      instructions: 'Take in the evening. Can be taken with or without food.',
    },
    prescribedBy: 'Dr. Mehra',
    indication: 'Dyslipidemia',
    caregiverVisible: false,
    refillInfo: { totalDays: 90, remainingDays: 55, lastRefillDate: new Date(Date.now() - 35 * 86400000) },
    drugInfo: {
      use: 'Lowers cholesterol and triglycerides in the blood. Reduces risk of heart attack and stroke.',
      sideEffects: 'Muscle pain/weakness, headache, nausea, diarrhea, joint pain.',
      warnings: 'Report unexplained muscle pain immediately. Avoid excessive alcohol. Regular liver function tests recommended.',
      interactions: 'Grapefruit juice, certain antibiotics (clarithromycin), fibrates, niacin.',
    },
    targetAdherence: 0.78,
    baseMissRate: 0.22,
  },
  {
    name: 'Levothyroxine',
    genericName: 'Levothyroxine Sodium',
    drugClass: 'Thyroid Hormone Replacement',
    dosage: '50mcg',
    form: 'tablet',
    frequency: {
      timesPerDay: 1,
      specificTimes: ['07:00'],
      daysOfWeek: [],
      instructions: 'Take on an empty stomach, 30-60 minutes before breakfast. Do not take with calcium or iron supplements.',
    },
    prescribedBy: 'Dr. Kapoor',
    indication: 'Hypothyroidism',
    caregiverVisible: true,
    refillInfo: { totalDays: 90, remainingDays: 68, lastRefillDate: new Date(Date.now() - 22 * 86400000) },
    drugInfo: {
      use: 'Replaces thyroid hormone when the thyroid gland does not produce enough (hypothyroidism). Normalises metabolism and energy levels.',
      sideEffects: 'Usually well-tolerated when dosed correctly. Over-dosing may cause: rapid heartbeat, sweating, weight loss, tremors.',
      warnings: 'Take consistently at the same time daily. Dosage adjustments require blood tests. Do not take with soy, coffee, or fibre supplements within 4 hours.',
      interactions: 'Calcium, iron, antacids (reduce absorption), blood thinners (warfarin), diabetes medications.',
    },
    targetAdherence: 0.88,
    baseMissRate: 0.12,
  },
]

// ── MAIN SEED FUNCTION ───────────────────────────────
async function seed() {
  await connectDB()
  console.log('Seeding MedNest medications data...\n')

  // Find or create dev user
  let user = await User.findById(DEV_USER_ID)
  if (!user) {
    user = await User.create({
      _id: DEV_USER_ID,
      fullName: 'Dev User',
      email: 'dev@mednest.local',
      dateOfBirth: new Date('1990-06-15'),
      gender: 'male',
      bloodGroup: 'B+',
      heightCm: 175,
      weightKg: 72,
    })
    console.log(`Created dev user: ${user._id}`)
  } else {
    console.log(`Dev user exists: ${user._id}`)
  }

  const userId = DEV_USER_ID

  // Clear existing medications & dose logs for dev user
  const delMeds = await Medication.deleteMany({ userId })
  const delDoses = await DoseLog.deleteMany({ userId })
  console.log(`Cleared ${delMeds.deletedCount} medications, ${delDoses.deletedCount} dose logs\n`)

  const createdMeds = []
  const allDoseLogs = []

  for (const medDef of MEDICATIONS) {
    // Create medication (pre-save hook sets isHighRisk)
    const med = new Medication({
      userId,
      name: medDef.name,
      genericName: medDef.genericName,
      drugClass: medDef.drugClass,
      dosage: medDef.dosage,
      form: medDef.form,
      frequency: medDef.frequency,
      prescribedBy: medDef.prescribedBy,
      prescribedDate: new Date(Date.now() - 120 * 86400000), // prescribed ~4 months ago
      startDate: new Date(Date.now() - 90 * 86400000),       // started ~3 months ago
      endDate: null, // ongoing
      status: 'active',
      indication: medDef.indication,
      caregiverVisible: medDef.caregiverVisible,
      refillInfo: medDef.refillInfo,
      drugInfo: medDef.drugInfo,
      riskAlertThreshold: { missedDosesBeforeAlert: 3 },
    })

    await med.save()
    createdMeds.push(med)
    console.log(
      `  ✓ ${med.name} ${med.dosage} (${med.indication})` +
      ` — isHighRisk: ${med.isHighRisk}`
    )

    // Generate 60 days of dose logs
    const streakState = { remaining: 0 }
    let taken = 0
    let missed = 0
    let totalDays = 0

    for (let dayOffset = 59; dayOffset >= 0; dayOffset--) {
      totalDays++
      const time = medDef.frequency.specificTimes[0] // e.g. "08:00"
      const [hour, minute] = time.split(':').map(Number)

      const scheduledAt = new Date()
      scheduledAt.setDate(scheduledAt.getDate() - dayOffset)
      scheduledAt.setHours(hour, minute, 0, 0)

      const isMissed = shouldMiss(dayOffset, medDef.baseMissRate, streakState)

      let status, takenAt
      if (dayOffset === 0) {
        // Today's dose: leave as pending if in the future, otherwise determine
        const now = new Date()
        if (scheduledAt > now) {
          status = 'pending'
          takenAt = null
        } else {
          status = isMissed ? 'pending' : 'taken' // pending will be caught by pre-save if >2h
          takenAt = status === 'taken' ? new Date(scheduledAt.getTime() + randInt(5, 45) * 60000) : null
        }
      } else {
        if (isMissed) {
          status = 'missed'
          takenAt = null
          missed++
        } else {
          status = 'taken'
          // Taken within 5-45 min of scheduled time
          takenAt = new Date(scheduledAt.getTime() + randInt(5, 45) * 60000)
          taken++
        }
      }

      allDoseLogs.push({
        userId,
        medicationId: med._id,
        scheduledAt,
        scheduledTime: time,
        status,
        takenAt,
        takenBy: chance(0.05) ? 'caregiver' : 'self',
        note: null,
      })
    }

    const pct = totalDays > 0 ? ((taken / (taken + missed)) * 100).toFixed(1) : 0
    console.log(
      `    → 60 dose logs  |  taken: ${taken}  missed: ${missed}` +
      `  adherence: ${pct}%`
    )
  }

  // Batch insert dose logs (use insertMany for speed; pre-save won't fire,
  // but statuses are already computed correctly above)
  console.log(`\nInserting ${allDoseLogs.length} dose log entries...`)
  await DoseLog.insertMany(allDoseLogs)

  // Summary
  console.log('\n── Summary ─────────────────────────────')
  console.log(`  Medications: ${createdMeds.length}`)
  console.log(`  Dose logs:   ${allDoseLogs.length}`)
  console.log(`  Dev userId:  ${userId}`)
  console.log('────────────────────────────────────────\n')

  await mongoose.disconnect()
  console.log('Done — medications seeded successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Medications seed failed:', err)
  process.exit(1)
})
