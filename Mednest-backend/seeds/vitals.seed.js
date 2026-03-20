/**
 * MedNest — Vitals Seed Script
 *
 * Usage: npm run seed:vitals
 *
 * Seeds 90 days of realistic vital entries for the dev user.
 * Includes intentional clinical trends:
 *   - BP slightly elevated in the last 30 days
 *   - Weight slowly decreasing over 90 days
 *   - Sleep quality improving over time
 *   - Stress scores computed from sleep/HR/activity
 *
 * Not every vital every day — realistic recording gaps per type.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const VitalEntry = require('../models/VitalEntry.model')
const User = require('../models/User.model')

const DEV_USER_ID = '69bb95764168f06db6f394e5'

// ── Helpers ──────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min
const randInt = (min, max) => Math.round(rand(min, max))
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const chance = (pct) => Math.random() < pct

// Generate a date N days ago at a random hour
function daysAgo(n, hourMin = 6, hourMax = 22) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(randInt(hourMin, hourMax), randInt(0, 59), 0, 0)
  return d
}

// ── GENERATOR FUNCTIONS ──────────────────────────────

function generateBP(day) {
  // Trend: slightly elevated last 30 days
  const baseSys = day <= 30 ? randInt(128, 142) : randInt(115, 128)
  const baseDia = day <= 30 ? randInt(82, 92) : randInt(72, 82)
  return {
    vitalType: 'blood_pressure',
    bloodPressure: {
      systolic: baseSys + randInt(-3, 3),
      diastolic: baseDia + randInt(-2, 2),
      pulse: randInt(62, 82),
    },
  }
}

function generateGlucose(day) {
  const when = pick(['fasting', 'post_meal', 'random'])
  let value
  if (when === 'fasting') {
    value = randInt(78, 108) // mostly normal, occasionally pre-diabetes
  } else if (when === 'post_meal') {
    value = randInt(110, 155)
  } else {
    value = randInt(85, 130)
  }
  return {
    vitalType: 'blood_glucose',
    bloodGlucose: { value, measuredWhen: when },
  }
}

function generateWeight(day) {
  // Trend: slowly decreasing from ~78 to ~74 over 90 days
  const base = 78 - (90 - day) * 0.045
  return {
    vitalType: 'weight',
    weight: { value: +(base + rand(-0.3, 0.3)).toFixed(1) },
  }
}

function generateHR(day) {
  const context = pick(['resting', 'resting', 'resting', 'active', 'post_exercise'])
  let bpm
  if (context === 'resting') {
    bpm = randInt(62, 78)
  } else if (context === 'active') {
    bpm = randInt(95, 125)
  } else {
    bpm = randInt(110, 145)
  }
  return {
    vitalType: 'heart_rate',
    heartRate: { bpm, context },
  }
}

function generateSpO2() {
  return {
    vitalType: 'spo2',
    spo2: { value: randInt(95, 99) },
  }
}

function generateSleep(day) {
  // Trend: quality improving over 90 days
  const qualityPool =
    day > 60
      ? ['poor', 'poor', 'fair', 'fair']
      : day > 30
        ? ['fair', 'fair', 'good', 'good']
        : ['good', 'good', 'good', 'excellent']
  const quality = pick(qualityPool)

  const durationBase =
    quality === 'poor'
      ? rand(240, 330)
      : quality === 'fair'
        ? rand(330, 400)
        : quality === 'good'
          ? rand(390, 460)
          : rand(420, 510)

  const durationMinutes = Math.round(durationBase)
  const bedHour = randInt(22, 24) // 10 PM – midnight
  const bedtime = new Date(daysAgo(day, 22, 23))
  bedtime.setHours(bedHour, randInt(0, 45), 0, 0)
  const wakeTime = new Date(bedtime.getTime() + durationMinutes * 60000)

  return {
    vitalType: 'sleep',
    sleep: { bedtime, wakeTime, durationMinutes, quality },
  }
}

function generateActivity(day) {
  const isActiveDay = chance(0.6)
  const steps = isActiveDay ? randInt(6000, 14000) : randInt(1500, 5500)
  const activeMinutes = isActiveDay ? randInt(25, 75) : randInt(5, 25)
  const distanceKm = +(steps * 0.0007 + rand(-0.2, 0.2)).toFixed(2)

  return {
    vitalType: 'activity',
    activity: { steps, activeMinutes, distanceKm: Math.max(0, distanceKm) },
  }
}

function generateCalories() {
  return {
    vitalType: 'calories',
    calories: {
      intake: randInt(1600, 2500),
      burned: randInt(1800, 2600),
    },
  }
}

// ── Stress score auto-compute helper ──
function computeStressFromData(sleepEntry, hrEntry, activityEntry) {
  let score = 50

  if (sleepEntry) {
    const hrs = sleepEntry.sleep.durationMinutes / 60
    const qMap = { poor: 30, fair: 20, good: 10, excellent: 0 }
    score += (qMap[sleepEntry.sleep.quality] ?? 15) - 15
    if (hrs < 5) score += 15
    else if (hrs < 6) score += 10
    else if (hrs < 7) score += 5
    else score -= 10
  }

  if (hrEntry) {
    const bpm = hrEntry.heartRate.bpm
    if (bpm > 100) score += 15
    else if (bpm > 85) score += 8
    else if (bpm > 72) score += 3
    else score -= 5
  }

  if (activityEntry) {
    const steps = activityEntry.activity.steps
    if (steps < 3000) score += 10
    else if (steps < 5000) score += 5
    else if (steps >= 10000) score -= 10
    else score -= 3
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

// ── MAIN SEED FUNCTION ───────────────────────────────
async function seed() {
  await connectDB()
  console.log('Seeding MedNest vitals data...\n')

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

  // Clear existing vitals for dev user
  const deleted = await VitalEntry.deleteMany({ userId })
  console.log(`Cleared ${deleted.deletedCount} existing vital entries\n`)

  const entries = []

  // Track latest sleep, resting HR, and activity for stress computation
  let latestSleep = null
  let latestRestingHR = null
  let latestActivity = null

  // Generate 90 days, from day 90 (oldest) to day 0 (today)
  for (let day = 90; day >= 0; day--) {
    const dateForDay = daysAgo(day)

    // ── Blood Pressure: ~daily (85% chance)
    if (chance(0.85)) {
      const bp = generateBP(day)
      entries.push({ userId, recordedAt: daysAgo(day, 7, 9), source: 'manual', ...bp })
    }

    // ── Blood Glucose: ~3-4x per week (50% chance)
    if (chance(0.50)) {
      const bg = generateGlucose(day)
      entries.push({ userId, recordedAt: daysAgo(day, 7, 8), source: 'manual', ...bg })
    }

    // ── Weight: ~weekly (15% chance, but at least once per 7 days)
    if (day % 7 === 0 || chance(0.12)) {
      const w = generateWeight(day)
      entries.push({ userId, recordedAt: daysAgo(day, 7, 8), source: 'manual', ...w })
    }

    // ── Heart Rate: ~daily (80% chance)
    if (chance(0.80)) {
      const hr = generateHR(day)
      entries.push({ userId, recordedAt: daysAgo(day, 8, 20), source: 'device', ...hr })
      if (hr.heartRate.context === 'resting') {
        latestRestingHR = hr
      }
    }

    // ── SpO2: ~every other day (55% chance)
    if (chance(0.55)) {
      const sp = generateSpO2()
      entries.push({ userId, recordedAt: daysAgo(day, 8, 10), source: 'device', ...sp })
    }

    // ── Sleep: ~daily (90% chance)
    if (chance(0.90)) {
      const sl = generateSleep(day)
      entries.push({ userId, recordedAt: daysAgo(day, 6, 8), source: 'device', ...sl })
      latestSleep = sl
    }

    // ── Activity: ~daily (80% chance)
    if (chance(0.80)) {
      const act = generateActivity(day)
      entries.push({ userId, recordedAt: daysAgo(day, 20, 22), source: 'device', ...act })
      latestActivity = act
    }

    // ── Calories: ~5x per week (70% chance)
    if (chance(0.70)) {
      const cal = generateCalories()
      entries.push({ userId, recordedAt: daysAgo(day, 19, 21), source: 'manual', ...cal })
    }

    // ── Stress Score: ~every 3 days (33% chance, computed)
    if (day % 3 === 0 || chance(0.15)) {
      const stressVal = computeStressFromData(latestSleep, latestRestingHR, latestActivity)
      entries.push({
        userId,
        recordedAt: daysAgo(day, 20, 22),
        source: 'manual',
        vitalType: 'stress_score',
        stressScore: { value: stressVal },
      })
    }
  }

  // Batch insert using create() so pre-save hooks fire
  console.log(`Inserting ${entries.length} vital entries...`)
  const inserted = await VitalEntry.create(entries)
  console.log(`Seeded ${inserted.length} vital entries\n`)

  // Summary
  const byType = {}
  inserted.forEach((e) => {
    byType[e.vitalType] = (byType[e.vitalType] || 0) + 1
  })
  console.log('Entries by vital type:')
  Object.entries(byType)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })
  console.log(`\nDev userId for testing: ${userId}`)

  await mongoose.disconnect()
  console.log('\nDone — vitals seeded successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Vitals seed failed:', err)
  process.exit(1)
})
