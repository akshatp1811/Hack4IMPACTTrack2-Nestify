/**
 * MedNest — Sample Data Seeder
 *
 * Usage: npm run seed
 *
 * Seeds the database with ~20 sample HealthRecords
 * spanning 2023–2026 across all record types.
 * Every record has extractedData, aiSummary, keyFindings,
 * doctorName, facilityName, and mlPipeline.status = 'completed'.
 */

require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const HealthRecord = require('../models/HealthRecord.model')
const User = require('../models/User.model')

// Placeholder image URL for seeded records
const PLACEHOLDER_IMG = 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg'
const PLACEHOLDER_CLOUDINARY_ID = 'mednest/records/seed/placeholder'

// Dev user details
const DEV_USER_ID = '69bb95764168f06db6f394e5'
const DEV_USER = {
  _id: DEV_USER_ID,
  fullName: 'Dev User',
  email: 'dev@mednest.local',
  dateOfBirth: new Date('1990-06-15'),
  gender: 'male',
  bloodGroup: 'B+',
  heightCm: 175,
  weightKg: 72,
}

const makeFile = (name = 'report.jpg') => ({
  cloudinaryId: PLACEHOLDER_CLOUDINARY_ID,
  url: PLACEHOLDER_IMG,
  fileType: 'jpg',
  fileSizeKb: 420,
  originalFileName: name,
  width: 1200,
  height: 1600,
})

const ML_COMPLETED = {
  status: 'completed',
  confidence: { classification: 91, extraction: 87 },
}

async function seed() {
  await connectDB()
  console.log('Seeding MedNest database...\n')

  // ── Upsert dev user ──
  let user = await User.findOne({ _id: DEV_USER_ID })
  if (!user) {
    user = await User.create(DEV_USER)
    console.log(`Created dev user: ${user._id}`)
  } else {
    console.log(`Dev user exists: ${user._id}`)
  }

  const userId = DEV_USER_ID

  // ── Clear existing seed records ──
  const deleted = await HealthRecord.deleteMany({ userId })
  console.log(`Cleared ${deleted.deletedCount} existing records for dev user\n`)

  // ── Records to seed ──
  const records = [

    // ════════════════════════════════════════════
    //  2023 FEBRUARY
    // ════════════════════════════════════════════

    // Visit — Annual Health Checkup Feb 2023
    {
      userId,
      recordType: 'visit',
      subType: 'Annual Health Checkup',
      recordDate: new Date('2023-02-28'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('annual_checkup_feb_2023.jpg'),
      extractedData: {
        visitType: 'Annual Health Checkup',
        chiefComplaint: 'Routine annual health check',
        diagnosis: ['Healthy — no acute illness'],
        vitals: { bloodPressureSystolic: 118, bloodPressureDiastolic: 76, heartRateBpm: 72, temperatureCelsius: 36.8, weightKg: 74, heightCm: 172, bmi: 25.0, spo2Percent: 98 },
        doctorNotes: 'Patient in good health. Routine labs ordered. Lifestyle counselling provided.',
        testsOrdered: ['Complete Blood Count', 'Lipid Profile'],
        nextAppointmentDate: new Date('2024-02-28'),
      },
      aiSummary: 'Your February 2023 annual checkup was routine and uneventful. Vitals were all within normal range — BP 118/76, heart rate 72, SpO2 98%. Lab tests were ordered as part of the standard annual panel.',
      keyFindings: ['All vitals normal', 'BP 118/76 mmHg', 'SpO2 98%', 'BMI 25.0 — healthy range'],
    },

    // Lab — CBC Feb 2023
    {
      userId,
      recordType: 'lab_report',
      subType: 'Complete Blood Count',
      recordDate: new Date('2023-02-28'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Diagnostics',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('cbc_feb_2023.jpg'),
      extractedData: {
        labName: 'Apollo Diagnostics',
        sampleCollectedAt: new Date('2023-02-28'),
        reportedAt: new Date('2023-02-28'),
        orderedBy: 'Dr. Priya Sharma',
        results: [
          { name: 'Hemoglobin', parameterKey: 'hemoglobin', value: 14.8, unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5, status: 'Normal' },
          { name: 'WBC Count', parameterKey: 'wbc', value: 7400, unit: '/μL', referenceMin: 4500, referenceMax: 11000, status: 'Normal' },
          { name: 'Platelets', parameterKey: 'platelets', value: 185000, unit: '/μL', referenceMin: 150000, referenceMax: 400000, status: 'Normal' },
          { name: 'RBC Count', parameterKey: 'rbc', value: 5.1, unit: 'million/μL', referenceMin: 4.5, referenceMax: 5.5, status: 'Normal' },
          { name: 'Hematocrit', parameterKey: 'hematocrit', value: 43, unit: '%', referenceMin: 41, referenceMax: 53, status: 'Normal' },
        ],
      },
      aiSummary: 'Your February 2023 CBC was entirely normal. Hemoglobin at 14.8 g/dL was well within range. All other parameters including WBC, platelets, and RBC were normal.',
      keyFindings: ['All parameters within normal range', 'Hemoglobin 14.8 g/dL — normal', 'No abnormal values detected'],
    },

    // Lab — Lipid Profile Feb 2023
    {
      userId,
      recordType: 'lab_report',
      subType: 'Lipid Profile',
      recordDate: new Date('2023-02-28'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Diagnostics',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('lipid_feb_2023.jpg'),
      extractedData: {
        labName: 'Apollo Diagnostics',
        sampleCollectedAt: new Date('2023-02-28'),
        reportedAt: new Date('2023-02-28'),
        results: [
          { name: 'Total Cholesterol', parameterKey: 'total_cholesterol', value: 185, unit: 'mg/dL', referenceMin: 0, referenceMax: 200, status: 'Normal' },
          { name: 'LDL Cholesterol', parameterKey: 'ldl', value: 112, unit: 'mg/dL', referenceMin: 0, referenceMax: 130, status: 'Normal' },
          { name: 'HDL Cholesterol', parameterKey: 'hdl', value: 48, unit: 'mg/dL', referenceMin: 40, referenceMax: 60, status: 'Normal' },
          { name: 'Triglycerides', parameterKey: 'triglycerides', value: 142, unit: 'mg/dL', referenceMin: 0, referenceMax: 150, status: 'Normal' },
        ],
      },
      aiSummary: 'Your February 2023 Lipid Profile was entirely normal. All cholesterol values including LDL, HDL, and Triglycerides were within healthy ranges.',
      keyFindings: ['All lipid parameters normal', 'LDL 112 mg/dL — within range', 'Triglycerides 142 mg/dL — within range'],
    },

    // ════════════════════════════════════════════
    //  2023 JUNE
    // ════════════════════════════════════════════

    // Scan — USG Abdomen Jun 2023
    {
      userId,
      recordType: 'scan',
      subType: 'USG Abdomen',
      recordDate: new Date('2023-06-14'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospitals',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('usg_abdomen_jun_2023.jpg'),
      extractedData: {
        scanType: 'Ultrasound', bodyRegion: 'Abdomen', modalityType: 'Ultrasound',
        radiologistName: 'Dr. Priya Sharma', facilityName: 'Apollo Hospitals',
        findings: ['Liver mildly enlarged at 16.8 cm', 'Grade 1 fatty liver — increased echogenicity', 'Gallbladder normal, no calculi', 'Both kidneys normal', 'No free fluid'],
        impression: 'Grade 1 fatty liver. Liver mildly enlarged. Dietary modification advised. All other organs normal.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your June 2023 abdominal ultrasound detected Grade 1 fatty liver — an early and reversible form of fat accumulation in the liver. Your liver was mildly enlarged at 16.8 cm. All other organs were normal.',
      keyFindings: ['Grade 1 fatty liver detected — first occurrence', 'Liver mildly enlarged — 16.8 cm', 'All other abdominal organs normal'],
    },

    // Visit — Follow-up Jun 2023
    {
      userId,
      recordType: 'visit',
      subType: 'Follow-up',
      recordDate: new Date('2023-06-14'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('followup_jun_2023.jpg'),
      extractedData: {
        visitType: 'Follow-up',
        chiefComplaint: 'Follow-up for fatty liver detected on ultrasound',
        diagnosis: ['Grade 1 Non-alcoholic fatty liver disease (NAFLD)'],
        vitals: { bloodPressureSystolic: 122, bloodPressureDiastolic: 80, heartRateBpm: 74, weightKg: 75, spo2Percent: 98 },
        doctorNotes: 'Patient counselled on dietary modification. Reduce refined carbohydrates and saturated fats. Increase physical activity. Review in 3 months.',
        testsOrdered: ['USG Abdomen'],
        nextAppointmentDate: new Date('2023-09-14'),
      },
      aiSummary: 'Your June 2023 follow-up was for the Grade 1 fatty liver detected on your ultrasound. Dr. Sharma recommended dietary modifications and increased physical activity. An ultrasound was ordered to monitor progress.',
      keyFindings: ['Follow-up for Grade 1 fatty liver', 'Dietary modification counselling provided', 'USG Abdomen ordered for monitoring'],
    },

    // Scan — ECG Jun 2023
    {
      userId,
      recordType: 'scan',
      subType: 'ECG',
      recordDate: new Date('2023-06-14'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('ecg_jun_2023.jpg'),
      extractedData: {
        scanType: 'ECG', bodyRegion: 'Heart', modalityType: 'ECG',
        radiologistName: 'Dr. Rajan Mehta', facilityName: 'Fortis Hospital',
        findings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'PR interval normal', 'QRS complex normal', 'No ST changes', 'No arrhythmia detected'],
        impression: 'Normal ECG. Normal sinus rhythm. No acute cardiac abnormality.',
        isReportAttached: false, urgency: 'routine',
      },
      aiSummary: 'Your ECG shows a completely normal heart rhythm. Heart rate is 72 bpm. No arrhythmia, conduction abnormality, or ischemic changes detected.',
      keyFindings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'No arrhythmia or ischemic changes'],
    },

    // ════════════════════════════════════════════
    //  2023 OCTOBER
    // ════════════════════════════════════════════

    // Lab — Thyroid Panel Oct 2023
    {
      userId,
      recordType: 'lab_report',
      subType: 'Thyroid Panel',
      recordDate: new Date('2023-10-05'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Diagnostics',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('thyroid_oct_2023.jpg'),
      extractedData: {
        labName: 'Apollo Diagnostics',
        sampleCollectedAt: new Date('2023-10-05'),
        reportedAt: new Date('2023-10-05'),
        results: [
          { name: 'TSH', parameterKey: 'tsh', value: 6.2, unit: 'μIU/mL', referenceMin: 0.4, referenceMax: 4.0, status: 'High' },
          { name: 'Free T4', parameterKey: 'free_t4', value: 0.9, unit: 'ng/dL', referenceMin: 0.8, referenceMax: 1.8, status: 'Normal' },
          { name: 'Free T3', parameterKey: 'free_t3', value: 3.1, unit: 'pg/mL', referenceMin: 2.3, referenceMax: 4.2, status: 'Normal' },
        ],
      },
      aiSummary: 'Your October 2023 Thyroid Panel shows an elevated TSH at 6.2 μIU/mL — above the normal range of 0.4–4.0. This indicates subclinical hypothyroidism. Free T4 and Free T3 are normal. Levothyroxine was prescribed to manage this.',
      keyFindings: ['TSH elevated — 6.2 μIU/mL (ref: 0.4–4.0)', 'Subclinical hypothyroidism indicated', 'Free T4 and T3 normal'],
    },

    // Prescription — Levothyroxine Oct 2023
    {
      userId,
      recordType: 'prescription',
      subType: 'General',
      recordDate: new Date('2023-10-05'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('prescription_oct_2023.jpg'),
      extractedData: {
        diagnosis: 'Subclinical Hypothyroidism',
        isHandwritten: false,
        medications: [{ brandName: 'Thyronorm', genericName: 'Levothyroxine Sodium', drugClass: 'Thyroid Hormone', dosage: '50mcg', frequency: 'Once daily', frequencyCode: 'OD', duration: 'Ongoing', durationDays: null, form: 'tablet', instructions: 'Take on empty stomach 30 minutes before breakfast', isControlled: false }],
      },
      aiSummary: 'Levothyroxine 50mcg (Thyronorm) prescribed for Subclinical Hypothyroidism by Dr. Priya Sharma. Take once daily on an empty stomach, 30 minutes before breakfast. TSH will be monitored every 3 months.',
      keyFindings: ['Levothyroxine 50mcg OD for Hypothyroidism', 'Take on empty stomach before breakfast', 'Ongoing — TSH monitoring every 3 months'],
    },

    // ════════════════════════════════════════════
    //  2024 JANUARY
    // ════════════════════════════════════════════

    // Scan — Chest X-Ray Jan 2024
    {
      userId,
      recordType: 'scan',
      subType: 'Chest X-Ray',
      recordDate: new Date('2024-01-22'),
      doctorName: 'Dr. K. Venkatesh',
      facilityName: 'Apollo Radiology',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('chest_xray_jan_2024.jpg'),
      extractedData: {
        scanType: 'X-Ray', bodyRegion: 'Chest', view: 'PA View', modalityType: 'X-Ray',
        radiologistName: 'Dr. K. Venkatesh', facilityName: 'Apollo Radiology',
        findings: ['Lung fields are clear', 'No consolidation or pleural effusion', 'Heart size normal', 'Bony thorax intact', 'No acute abnormality'],
        impression: 'Normal chest X-ray. Clear lung fields. Normal cardiac silhouette.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your January 2024 Chest X-Ray was completely normal. Lung fields were clear with no signs of infection, fluid, or structural abnormality. Heart size was normal.',
      keyFindings: ['Normal chest X-ray', 'Clear lung fields', 'Normal heart size', 'No acute findings'],
    },

    // Scan — ECG Jan 2024 (1)
    {
      userId,
      recordType: 'scan',
      subType: 'ECG',
      recordDate: new Date('2024-01-22'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('ecg_jan_2024.jpg'),
      extractedData: {
        scanType: 'ECG', bodyRegion: 'Heart', modalityType: 'ECG',
        radiologistName: 'Dr. Rajan Mehta', facilityName: 'Fortis Hospital',
        findings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'PR interval normal', 'QRS complex normal', 'No ST changes', 'No arrhythmia detected'],
        impression: 'Normal ECG. Normal sinus rhythm. No acute cardiac abnormality.',
        isReportAttached: false, urgency: 'routine',
      },
      aiSummary: 'Your ECG shows a completely normal heart rhythm. Heart rate is 72 bpm. No arrhythmia, conduction abnormality, or ischemic changes detected.',
      keyFindings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'No arrhythmia or ischemic changes'],
    },

    // Prescription — Atorvastatin Jan 2024
    {
      userId,
      recordType: 'prescription',
      subType: 'Specialist',
      recordDate: new Date('2024-01-22'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('prescription_jan_2024.jpg'),
      extractedData: {
        diagnosis: 'Dyslipidemia',
        isHandwritten: false,
        medications: [{ brandName: 'Atorvastatin', genericName: 'Atorvastatin Calcium', drugClass: 'Statin', dosage: '10mg', frequency: 'Once daily', frequencyCode: 'OD', duration: 'Ongoing', durationDays: null, form: 'tablet', instructions: 'Take at bedtime', isControlled: false }],
      },
      aiSummary: 'Atorvastatin 10mg prescribed for high cholesterol (Dyslipidemia) by Dr. Rajan Mehta. Take once daily at bedtime. This is an ongoing prescription for long-term cholesterol management.',
      keyFindings: ['Atorvastatin 10mg OD for Dyslipidemia', 'Statin medication — lowers LDL cholesterol', 'Ongoing prescription — take at bedtime'],
    },

    // ════════════════════════════════════════════
    //  2024 APRIL
    // ════════════════════════════════════════════

    // Scan — MRI Brain Apr 2024
    {
      userId,
      recordType: 'scan',
      subType: 'MRI Brain',
      recordDate: new Date('2024-04-18'),
      doctorName: 'Dr. Kavitha Rao',
      facilityName: 'NIMHANS',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('mri_brain_apr_2024.jpg'),
      extractedData: {
        scanType: 'MRI', bodyRegion: 'Brain', modalityType: 'MRI',
        radiologistName: 'Dr. Kavitha Rao', facilityName: 'NIMHANS',
        findings: ['No acute intracranial pathology', 'Brain parenchyma appears normal', 'Ventricular system is normal in size', 'No mass lesion or midline shift', 'No evidence of infarction or hemorrhage'],
        impression: 'Normal MRI Brain. No acute abnormality detected.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your April 2024 MRI Brain was completely normal. No acute intracranial pathology, mass lesion, or hemorrhage was detected. The brain parenchyma and ventricular system appeared normal.',
      keyFindings: ['Normal MRI Brain', 'No acute intracranial pathology', 'No mass lesion or midline shift'],
    },

    // Consultation — Neurology Apr 2024
    {
      userId,
      recordType: 'consultation',
      subType: 'Neurology',
      recordDate: new Date('2024-04-18'),
      doctorName: 'Dr. Kavitha Rao',
      facilityName: 'NIMHANS',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('neuro_consult_apr_2024.jpg'),
      extractedData: {
        specialty: 'Neurology', mode: 'in_person', referredBy: 'Dr. Priya Sharma',
        chiefComplaint: 'Headaches and MRI evaluation',
        clinicalAssessment: 'MRI Brain normal. Headaches likely tension-type. No neurological deficit on examination.',
        diagnosis: ['Tension-type headache', 'MRI Brain — no acute abnormality'],
        recommendations: ['Stress management', 'Regular sleep schedule', 'Avoid prolonged screen time', 'Paracetamol 500mg for acute headache as needed'],
        followUpInstructions: 'Return if headaches worsen or neurological symptoms develop',
        followUpDate: null, urgency: 'routine',
      },
      aiSummary: 'Your April 2024 neurology consultation with Dr. Kavitha Rao at NIMHANS evaluated your headaches following a normal MRI Brain. The headaches were diagnosed as tension-type — not related to any neurological condition. Stress management and sleep hygiene were recommended.',
      keyFindings: ['MRI Brain normal — no acute abnormality', 'Headaches diagnosed as tension-type', 'No neurological deficit', 'Stress management and sleep hygiene recommended'],
    },

    // ════════════════════════════════════════════
    //  2024 AUGUST
    // ════════════════════════════════════════════

    // Scan — Chest X-Ray Aug 2024
    {
      userId,
      recordType: 'scan',
      subType: 'Chest X-Ray',
      recordDate: new Date('2024-08-03'),
      doctorName: 'Dr. K. Venkatesh',
      facilityName: 'Apollo Radiology',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('chest_xray_aug_2024.jpg'),
      extractedData: {
        scanType: 'X-Ray', bodyRegion: 'Chest', view: 'PA View', modalityType: 'X-Ray',
        radiologistName: 'Dr. K. Venkatesh', facilityName: 'Apollo Radiology',
        findings: ['Mild cardiomegaly noted', 'Lung fields show increased bronchovascular markings', 'No pleural effusion', 'No consolidation'],
        impression: 'Mild cardiomegaly. Increased bronchovascular markings. Clinical correlation recommended.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your August 2024 Chest X-Ray shows mild cardiomegaly — a slight enlargement of the heart. This can be associated with hypertension, which is in your medical history. Increased markings in the lung fields were also noted. Clinical follow-up with your cardiologist is recommended.',
      keyFindings: ['Mild cardiomegaly detected', 'Increased bronchovascular markings', 'No pleural effusion or consolidation', 'Follow-up with cardiologist recommended'],
    },

    // Scan — USG Abdomen Aug 2024
    {
      userId,
      recordType: 'scan',
      subType: 'USG Abdomen',
      recordDate: new Date('2024-08-03'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospitals',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('usg_abdomen_aug_2024.jpg'),
      extractedData: {
        scanType: 'Ultrasound', bodyRegion: 'Abdomen', modalityType: 'Ultrasound',
        radiologistName: 'Dr. Priya Sharma', facilityName: 'Apollo Hospitals',
        findings: ['Liver measures 16.5 cm — mildly enlarged', 'Grade 1 fatty liver persisting', 'Gallbladder normal', 'Both kidneys normal', 'Spleen normal at 10.0 cm', 'No free fluid'],
        impression: 'Grade 1 fatty liver persisting. Liver size stable at 16.5 cm. Continue dietary modification.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your August 2024 ultrasound shows the Grade 1 fatty liver is persisting from your 2023 scan. Liver size is stable at 16.5 cm. All other organs remain normal. Continued dietary modification is recommended.',
      keyFindings: ['Grade 1 fatty liver persisting', 'Liver size stable at 16.5 cm', 'No new findings'],
    },

    // Lab — Lipid Profile Aug 2024
    {
      userId,
      recordType: 'lab_report',
      subType: 'Lipid Profile',
      recordDate: new Date('2024-08-03'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Diagnostics',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('lipid_aug_2024.jpg'),
      extractedData: {
        labName: 'Apollo Diagnostics',
        sampleCollectedAt: new Date('2024-08-03'),
        reportedAt: new Date('2024-08-03'),
        results: [
          { name: 'Total Cholesterol', parameterKey: 'total_cholesterol', value: 218, unit: 'mg/dL', referenceMin: 0, referenceMax: 200, status: 'High' },
          { name: 'LDL Cholesterol', parameterKey: 'ldl', value: 138, unit: 'mg/dL', referenceMin: 0, referenceMax: 130, status: 'High' },
          { name: 'HDL Cholesterol', parameterKey: 'hdl', value: 45, unit: 'mg/dL', referenceMin: 40, referenceMax: 60, status: 'Normal' },
          { name: 'Triglycerides', parameterKey: 'triglycerides', value: 168, unit: 'mg/dL', referenceMin: 0, referenceMax: 150, status: 'High' },
        ],
      },
      aiSummary: 'Your August 2024 Lipid Profile shows elevated cholesterol — Total Cholesterol and LDL are above the recommended range, and Triglycerides are borderline high. This has worsened compared to your 2023 results. Dietary changes and a follow-up with your doctor are recommended.',
      keyFindings: ['Total Cholesterol elevated — 218 mg/dL', 'LDL borderline high — 138 mg/dL', 'Triglycerides borderline high — 168 mg/dL', 'HDL normal — 45 mg/dL'],
    },

    // ════════════════════════════════════════════
    //  2025 JANUARY
    // ════════════════════════════════════════════

    // Prescription — Amlodipine Jan 2025
    {
      userId,
      recordType: 'prescription',
      subType: 'Specialist',
      recordDate: new Date('2025-01-08'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('prescription_jan_2025.jpg'),
      extractedData: {
        diagnosis: 'Hypertension',
        isHandwritten: false,
        medications: [{ brandName: 'Amlodipine', genericName: 'Amlodipine Besylate', drugClass: 'Calcium Channel Blocker', dosage: '5mg', frequency: 'Once daily', frequencyCode: 'OD', duration: 'Ongoing', durationDays: null, form: 'tablet', instructions: 'Take in the morning after breakfast', isControlled: false }],
      },
      aiSummary: 'Amlodipine 5mg prescribed for Hypertension by Dr. Rajan Mehta. Take once daily in the morning after breakfast. This is an ongoing prescription — do not stop without consulting your doctor.',
      keyFindings: ['Amlodipine 5mg OD for Hypertension', 'Calcium channel blocker — controls blood pressure', 'Ongoing prescription'],
    },

    // Consultation — Cardiology Jan 2025
    {
      userId,
      recordType: 'consultation',
      subType: 'Cardiology',
      recordDate: new Date('2025-01-08'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('cardiology_jan_2025.jpg'),
      extractedData: {
        specialty: 'Cardiology', mode: 'in_person', referredBy: 'Dr. Priya Sharma',
        chiefComplaint: 'Hypertension management and cardiac evaluation',
        clinicalAssessment: 'Hypertension well controlled. Mild cardiomegaly on X-ray noted. ECG normal. Echocardiogram not immediately required.',
        diagnosis: ['Essential Hypertension — Grade 1', 'Mild Cardiomegaly — under observation'],
        recommendations: ['Continue Amlodipine 5mg', 'Reduce sodium intake', 'Regular aerobic exercise 30 min/day', 'Follow-up in 6 months with ECG'],
        testsOrdered: ['ECG', 'Lipid Profile'],
        followUpInstructions: 'Return in 6 months or earlier if chest pain, breathlessness, or palpitations develop',
        followUpDate: new Date('2025-07-08'), urgency: 'routine',
      },
      aiSummary: 'Your January 2025 cardiology consultation with Dr. Rajan Mehta showed your hypertension is well-controlled on Amlodipine. The mild cardiomegaly seen on your X-ray is under observation. ECG was normal. Lifestyle modifications including reduced sodium and regular exercise were recommended.',
      keyFindings: ['Hypertension Grade 1 — well controlled', 'Mild cardiomegaly — under observation', 'ECG normal', 'Follow-up in 6 months'],
    },

    // ════════════════════════════════════════════
    //  2025 MARCH
    // ════════════════════════════════════════════

    // Visit — General Checkup Mar 2025
    {
      userId,
      recordType: 'visit',
      subType: 'General Checkup',
      recordDate: new Date('2025-03-12'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('general_checkup_2025.jpg'),
      extractedData: {
        visitType: 'General Checkup',
        chiefComplaint: 'Routine checkup — hypertension monitoring',
        diagnosis: ['Hypertension — controlled', 'Subclinical hypothyroidism — on medication'],
        vitals: { bloodPressureSystolic: 128, bloodPressureDiastolic: 82, heartRateBpm: 76, temperatureCelsius: 36.6, weightKg: 76, heightCm: 172, bmi: 25.7, spo2Percent: 97 },
        doctorNotes: 'BP adequately controlled on Amlodipine. TSH trending toward normal on Levothyroxine. Continue current medications. CBC ordered to rule out anemia.',
        testsOrdered: ['Complete Blood Count', 'ECG'],
        nextAppointmentDate: new Date('2025-06-12'),
      },
      aiSummary: 'Your March 2025 checkup shows your hypertension is well-controlled on Amlodipine with BP at 128/82. Thyroid function is improving on Levothyroxine. A CBC was ordered which showed mild anemia. Follow-up scheduled for June 2025.',
      keyFindings: ['BP 128/82 — controlled on medication', 'Hypothyroidism improving on Levothyroxine', 'CBC ordered — mild anemia detected', 'Follow-up in June 2025'],
    },

    // Lab — CBC Mar 2025
    {
      userId,
      recordType: 'lab_report',
      subType: 'Complete Blood Count',
      recordDate: new Date('2025-03-12'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Diagnostics',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('cbc_march_2025.jpg'),
      extractedData: {
        labName: 'Apollo Diagnostics',
        sampleCollectedAt: new Date('2025-03-12'),
        reportedAt: new Date('2025-03-12'),
        orderedBy: 'Dr. Priya Sharma',
        results: [
          { name: 'Hemoglobin', parameterKey: 'hemoglobin', value: 13.2, unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5, status: 'Low' },
          { name: 'WBC Count', parameterKey: 'wbc', value: 7200, unit: '/μL', referenceMin: 4500, referenceMax: 11000, status: 'Normal' },
          { name: 'Platelets', parameterKey: 'platelets', value: 210000, unit: '/μL', referenceMin: 150000, referenceMax: 400000, status: 'Normal' },
          { name: 'RBC Count', parameterKey: 'rbc', value: 4.8, unit: 'million/μL', referenceMin: 4.5, referenceMax: 5.5, status: 'Normal' },
          { name: 'Hematocrit', parameterKey: 'hematocrit', value: 39, unit: '%', referenceMin: 41, referenceMax: 53, status: 'Low' },
          { name: 'MCV', parameterKey: 'mcv', value: 81, unit: 'fL', referenceMin: 80, referenceMax: 100, status: 'Normal' },
          { name: 'MCH', parameterKey: 'mch', value: 27.5, unit: 'pg', referenceMin: 27, referenceMax: 33, status: 'Normal' },
          { name: 'Neutrophils', parameterKey: 'neutrophils', value: 62, unit: '%', referenceMin: 40, referenceMax: 70, status: 'Normal' },
        ],
      },
      aiSummary: 'Your March 2025 CBC shows mild anemia — Hemoglobin is slightly below normal at 13.2 g/dL and Hematocrit is borderline low at 39%. All other parameters including WBC, platelets, and RBC are within normal limits.',
      keyFindings: ['Hemoglobin borderline low — 13.2 g/dL', 'Hematocrit borderline low — 39%', 'All other 6 parameters normal', 'No critical values'],
    },

    // Scan — ECG Mar 2025
    {
      userId,
      recordType: 'scan',
      subType: 'ECG',
      recordDate: new Date('2025-03-12'),
      doctorName: 'Dr. Rajan Mehta',
      facilityName: 'Fortis Hospital',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('ecg_march_2025.jpg'),
      extractedData: {
        scanType: 'ECG', bodyRegion: 'Heart', modalityType: 'ECG',
        radiologistName: 'Dr. Rajan Mehta', facilityName: 'Fortis Hospital',
        findings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'PR interval normal', 'QRS complex normal', 'No ST changes', 'No arrhythmia detected'],
        impression: 'Normal ECG. Normal sinus rhythm. No acute cardiac abnormality.',
        isReportAttached: false, urgency: 'routine',
      },
      aiSummary: 'Your ECG shows a completely normal heart rhythm. Heart rate is 72 bpm. No arrhythmia, conduction abnormality, or ischemic changes detected.',
      keyFindings: ['Normal sinus rhythm', 'Heart rate 72 bpm', 'No arrhythmia or ischemic changes'],
    },

    // ════════════════════════════════════════════
    //  2026 MARCH — USG Abdomen (resolved)
    // ════════════════════════════════════════════
    {
      userId,
      recordType: 'scan',
      subType: 'USG Abdomen',
      recordDate: new Date('2026-03-19'),
      doctorName: 'Dr. Priya Sharma',
      facilityName: 'Apollo Hospitals',
      mlPipeline: ML_COMPLETED,
      originalFile: makeFile('usg_abdomen_mar_2026.jpg'),
      extractedData: {
        scanType: 'Ultrasound', bodyRegion: 'Abdomen', modalityType: 'Ultrasound',
        radiologistName: 'Dr. Priya Sharma', facilityName: 'Apollo Hospitals',
        findings: ['Liver normal in size and echogenicity', 'No focal lesion', 'Gallbladder well distended, no calculi', 'CBD 4mm — normal', 'Both kidneys normal', 'Spleen 10.2 cm — normal', 'No free fluid'],
        impression: 'Normal ultrasound abdomen. Fatty liver has resolved completely. No acute abnormality.',
        isReportAttached: true, urgency: 'routine',
      },
      aiSummary: 'Your March 2026 abdominal ultrasound shows complete resolution of the Grade 1 fatty liver detected in 2023. Your liver is now normal in size and texture. All abdominal organs are within normal limits — this is an excellent improvement.',
      keyFindings: ['Fatty liver fully resolved', 'Liver size and echogenicity normal', 'All organs within normal limits', 'Complete improvement from 2023'],
    },
  ]

  // Insert all — pre-save hook generates groupKey automatically
  const inserted = await HealthRecord.create(records)
  console.log(`Seeded ${inserted.length} health records\n`)

  // Summary
  const byType = {}
  inserted.forEach((r) => {
    byType[r.recordType] = (byType[r.recordType] || 0) + 1
  })
  console.log('Records by type:')
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`)
  })
  console.log(`\nDev userId for testing: ${userId}`)

  await mongoose.disconnect()
  console.log('\nDone — database seeded successfully.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
