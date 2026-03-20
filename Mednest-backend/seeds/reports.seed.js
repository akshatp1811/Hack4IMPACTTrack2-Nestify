require('dotenv').config();
const mongoose = require('mongoose');
const GeneratedReport = require('../models/GeneratedReport.model');
const crypto = require('crypto');

const DEV_USER_ID = '69bb95764168f06db6f394e5';

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mednest');
    console.log('MongoDB connected for reports seeding...');

    await GeneratedReport.deleteMany({ userId: DEV_USER_ID });
    console.log('Cleared existing reports for dev user.');

    const patientReport = {
      userId: DEV_USER_ID,
      reportType: 'patient',
      status: 'ready',
      shareToken: crypto.randomUUID(),
      exportUrl: 'https://res.cloudinary.com/demo/image/upload/v1612345/mock_report_patient.pdf',
      structuredContent: {
        overallStatus: 'You are doing exceptionally well and your vitals are mostly stable.',
        highlights: [
          'Your blood pressure is well managed.',
          'You have been very consistent with your medications this month.',
          'Your recent HbA1c shows improvement.'
        ],
        medications: 'You are actively taking Atorvastatin and Metformin. Adherence is at 95%.',
        recentFindings: 'Your latest blood test was mostly normal, but keep monitoring your cholesterol levels.',
        watchlist: ['Keep an eye on daily step count', 'Drink more water'],
        encouragement: 'Keep up the great work with your health tracking! Consistency is key.',
      },
      aiResponse: 'Mock generated from seed script',
    };

    const doctorReport = {
      userId: DEV_USER_ID,
      reportType: 'doctor',
      status: 'ready',
      shareToken: crypto.randomUUID(),
      exportUrl: 'https://res.cloudinary.com/demo/image/upload/v1612345/mock_report_doctor.pdf',
      structuredContent: {
        clinicalSummary: 'A 68-year-old patient presenting with relatively stable chronic conditions including Type 2 Diabetes and Hypertension.',
        activeProblemList: ['Type 2 Diabetes Mellitus - Controlled', 'Essential Hypertension - Stable', 'Hyperlipidemia - Monitoring'],
        medicationReview: 'Currently on Metformin 500mg and Atorvastatin 10mg. Adherence is excellent (95%). No adverse reactions reported.',
        investigationSummary: 'Recent comprehensive metabolic panel shows slightly elevated LDL. Renal and hepatic functions are within normal limits. Fasting glucose at target.',
        riskFlags: ['Monitor lipid profile', 'Assess cardiovascular risk annually'],
        recommendedActions: ['Follow-up consultation in 3 months', 'Repeat lipid panel prior to next visit']
      },
      aiResponse: 'Mock generated from seed script',
    };

    const insuranceReport = {
      userId: DEV_USER_ID,
      reportType: 'insurance',
      status: 'ready',
      shareToken: crypto.randomUUID(),
      exportUrl: 'https://res.cloudinary.com/demo/image/upload/v1612345/mock_report_insurance.pdf',
      structuredContent: {
        riskScore: 35,
        riskCategory: 'moderate',
        riskFactors: ['Hypertension history', 'Type 2 Diabetes', 'Age > 65'],
        healthHistory: 'Diagnosed with standard age-related conditions. No recent major hospitalizations or surgical interventions in the past 5 years.',
        currentHealthStatus: 'Stable on medication. Routine outpatient monitoring maintained.',
        dataCompleteness: '85%'
      },
      aiResponse: 'Mock generated from seed script',
    };

    await GeneratedReport.insertMany([patientReport, doctorReport, insuranceReport]);
    console.log('Seeded 3 reports (patient, doctor, insurance).');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

runSeeder();
