const GeneratedReport = require('../models/GeneratedReport.model');
const User = require('../models/User.model');
const HealthRecord = require('../models/HealthRecord.model');
const Medication = require('../models/Medication.model');
const DoseLog = require('../models/DoseLog.model');
const VitalEntry = require('../models/VitalEntry.model');
const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse, ApiError } = require('../utils/ApiResponse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

// ══════════════════════════════════════════════════════
//  CONTEXT BUILDERS
// ══════════════════════════════════════════════════════

async function buildPatientContext(userId) {
  const [user, records, medications, doses, vitals] = await Promise.all([
    User.findById(userId).lean(),
    HealthRecord.find({ userId }).sort({ recordDate: -1 }).lean(),
    Medication.find({ userId, status: 'active' }).lean(),
    DoseLog.find({ userId }).lean(),
    VitalEntry.find({ userId }).sort({ recordedAt: -1 }).lean()
  ]);

  if (!user) throw new ApiError(404, 'User not found');

  // Vitals compilation
  const latestVitals = {};
  const vitalsLast30Days = { bp: [], glucose: [], weight: [], heartRate: [], spo2: [] };
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  vitals.forEach(v => {
    if (!latestVitals[v.type]) latestVitals[v.type] = { value: v.value, unit: v.unit, status: v.clinicalStatus };
    if (new Date(v.recordedAt) >= thirtyDaysAgo) {
      if (vitalsLast30Days[v.type]) vitalsLast30Days[v.type].push({ val: v.value, date: v.recordedAt });
    }
  });

  // Recent lab & scan summaries (last 3)
  const labs = records.filter(r => r.recordType === 'LabResult');
  const scans = records.filter(r => r.recordType === 'MedicalScan');
  const visits = records.filter(r => r.recordType === 'Consultation');

  // Adherence OVERALL
  const total = doses.length;
  const taken = doses.filter(d => d.status === 'taken').length;
  const adherenceOverall = total > 0 ? ((taken / total) * 100).toFixed(1) : 0;

  // Recent abnormal findings (last 6 months)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const recentAbnormalFindings = [];
  labs.filter(r => new Date(r.recordDate) >= sixMonthsAgo).forEach(lab => {
    if (lab.extractedData && lab.extractedData.parameters) {
      lab.extractedData.parameters.forEach(p => {
        if (p.status && (p.status.toLowerCase().includes('high') || p.status.toLowerCase().includes('low') || p.status.toLowerCase().includes('abnormal'))) {
          recentAbnormalFindings.push({ test: lab.title, date: lab.recordDate, parameter: p.name, value: p.value, unit: p.unit, status: p.status });
        }
      });
    }
  });

  return {
    demographics: {
      age: user.dateOfBirth ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / 31557600000) : null,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      heightCm: user.heightCm,
      weightKg: user.weightKg,
      bmi: user.bmi
    },
    medicalConditions: user.medicalConditions || [],
    allergies: user.allergies || [],
    activeMedications: medications.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, indication: m.indication, startDate: m.startDate })),
    latestVitals,
    vitalsLast30Days,
    recentAbnormalFindings,
    recentLabSummaries: labs.slice(0, 3).map(l => l.aiSummary),
    recentScanSummaries: scans.slice(0, 3).map(s => s.aiSummary + (s.extractedData?.impression ? ' - ' + s.extractedData.impression : '')),
    activeAlerts: [], // Simplified for this implementation
    adherenceOverall,
    lastVisitSummary: visits.length > 0 ? visits[0].aiSummary : null
  };
}

async function buildDoctorContext(userId) {
  const patientContext = await buildPatientContext(userId);
  const [allRecords, allMedications, allDoses, allVitals] = await Promise.all([
    HealthRecord.find({ userId }).sort({ recordDate: -1 }).lean(),
    Medication.find({ userId }).lean(),
    DoseLog.find({ userId }).lean(),
    VitalEntry.find({ userId, recordedAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }).sort({ recordedAt: -1 }).lean()
  ]);

  const adherencePerMedication = allMedications.map(med => {
    const mDoses = allDoses.filter(d => d.medicationId.toString() === med._id.toString());
    const taken = mDoses.filter(d => d.status === 'taken').length;
    return {
      name: med.name,
      adherencePct: mDoses.length > 0 ? ((taken / mDoses.length) * 100).toFixed(1) : 0,
      missedDoses: mDoses.filter(d => d.status === 'missed').length
    };
  });

  return {
    ...patientContext,
    fullLabResults: allRecords.filter(r => r.recordType === 'LabResult').slice(0, 5).map(r => ({ date: r.recordDate, title: r.title, parameters: r.extractedData?.parameters || [] })),
    scanHistory: allRecords.filter(r => r.recordType === 'MedicalScan').map(r => ({ date: r.recordDate, impression: r.extractedData?.impression, url: r.originalFile?.url })),
    consultationHistory: allRecords.filter(r => r.recordType === 'Consultation').map(r => ({ date: r.recordDate, doctor: r.extractedData?.doctorName, summary: r.aiSummary })),
    vitalTrends: allVitals.reduce((acc, v) => {
      if (!acc[v.type]) acc[v.type] = [];
      acc[v.type].push({ val: v.value, date: v.recordedAt });
      return acc;
    }, {}),
    medicationHistory: allMedications.map(m => ({ name: m.name, status: m.status, startDate: m.startDate, endDate: m.endDate })),
    adherencePerMedication,
    riskFlags: ['Monitor BP adherence', 'Review recent abnormal labs']
  };
}

async function buildInsuranceContext(userId) {
  const patientContext = await buildPatientContext(userId);
  const allRecords = await HealthRecord.find({ userId }).lean();
  
  const allDiagnoses = [...new Set(allRecords.filter(r => r.recordType === 'Consultation' && r.extractedData && r.extractedData.diagnosis).map(r => r.extractedData.diagnosis))];
  
  return {
    demographics: patientContext.demographics,
    allDiagnoses,
    chronicConditions: patientContext.medicalConditions,
    medicationHistory: patientContext.activeMedications, // simplified
    hospitalizationsAndEmergencies: allRecords.filter(r => r.recordType === 'DischargeSummary').map(r => ({ date: r.recordDate, reason: r.title })),
    criticalFindings: patientContext.recentAbnormalFindings,
    specialistConsultations: allRecords.filter(r => r.recordType === 'Consultation').map(r => ({ specialty: 'General', date: r.recordDate })), // mock specialty
    currentRiskScore: 45 // Procedural mock for demo
  };
}

// ══════════════════════════════════════════════════════
//  CONTROLLER ACTIONS
// ══════════════════════════════════════════════════════

const getContext = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type } = req.query;

  let context;
  if (type === 'doctor') context = await buildDoctorContext(userId);
  else if (type === 'insurance') context = await buildInsuranceContext(userId);
  else context = await buildPatientContext(userId); // Default to patient

  res.json(new ApiResponse(200, context));
});

const generateReport = asyncHandler(async (req, res) => {
  const { userId, type } = req.body; // type: 'patient', 'doctor', 'insurance'
  if (!userId || !type) throw new ApiError(400, 'userId and type are required');

  // Save placeholder report
  const report = await GeneratedReport.create({
    userId,
    reportType: type,
    status: 'generating',
    shareToken: crypto.randomUUID()
  });

  try {
    // 1. Build Context
    let context;
    let systemPrompt = '';
    if (type === 'doctor') {
      context = await buildDoctorContext(userId);
      systemPrompt = `You are a clinical summarizer writing a structured medical summary for a treating physician. Use clinical terminology. Be precise and complete. Structure your response as JSON with these keys: clinicalSummary (2-3 sentence overview), activeProblemList (array of current diagnoses with status), medicationReview (current meds with adherence and any concerns), investigationSummary (recent labs and imaging grouped by type with trends), riskFlags (anything requiring immediate attention), recommendedActions (suggested follow-ups or investigations). Base everything strictly on the provided data. Context: ${JSON.stringify(context)}`;
    } else if (type === 'insurance') {
      context = await buildInsuranceContext(userId);
      systemPrompt = `You are a medical data analyst writing an objective health history summary for insurance underwriting purposes. Be factual and precise. No recommendations or interpretations — only facts from the data. Structure your response as JSON with these keys: riskScore (0-100 number), riskCategory (low/moderate/high/very_high), riskFactors (array of specific factors contributing to risk), healthHistory (chronological summary of significant medical events), currentHealthStatus (snapshot of active conditions and medications), dataCompleteness (percentage of health data available). Context: ${JSON.stringify(context)}`;
    } else {
      context = await buildPatientContext(userId);
      systemPrompt = `You are a friendly health assistant writing a personal health summary for a patient to understand their own health. Write in warm, plain English. No medical jargon without explanation. Structure your response as JSON with these keys: overallStatus (one sentence), highlights (array of 3-5 key points the patient should know), medications (summary of what they're taking and why), recentFindings (what their recent tests showed in simple terms), watchlist (things to monitor), encouragement (one positive closing sentence). Base everything strictly on the provided data. Context: ${JSON.stringify(context)}`;
    }

    report.contextSnapshot = context;

    // 2. Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    let structuredJSON = null;
    let rawResponse = '';

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(systemPrompt);
      rawResponse = result.response.text();
      
      const cleanJSON = rawResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      try {
        structuredJSON = JSON.parse(cleanJSON);
      } catch (parseErr) {
        console.error('Failed to parse Gemini response', parseErr);
        throw new Error('Invalid JSON from AI');
      }
    } else {
      // MOCK FALLBACK
      rawResponse = 'Mock response generated (no API key provided)';
      if (type === 'doctor') {
        structuredJSON = {
          clinicalSummary: "Patient presents with relatively stable chronic conditions.",
          activeProblemList: ["Hypertension - Stable"],
          medicationReview: "Adherence is generally good. No major concerns.",
          investigationSummary: "Recent labs show slightly elevated LDL.",
          riskFlags: ["Monitor lipid profile"],
          recommendedActions: ["Follow-up in 3 months"]
        };
      } else if (type === 'insurance') {
        structuredJSON = {
          riskScore: 35,
          riskCategory: "moderate",
          riskFactors: ["Hypertension history"],
          healthHistory: "Diagnosed with standard age-related conditions.",
          currentHealthStatus: "Stable on medication.",
          dataCompleteness: "85%"
        };
      } else {
         structuredJSON = {
          overallStatus: "You are doing well and your vitals are mostly stable.",
          highlights: ["Your blood pressure is well managed.", "You've been consistent with medications."],
          medications: "Taking daily supplements and BP meds.",
          recentFindings: "Your latest blood test was mostly normal, just watch your cholesterol.",
          watchlist: ["Keep an eye on daily step count"],
          encouragement: "Keep up the great work with your health tracking!"
        };
      }
    }

    // 3. Save
    report.aiResponse = rawResponse;
    report.structuredContent = structuredJSON;
    report.status = 'ready';
    await report.save();

    res.status(201).json(new ApiResponse(201, { report }, 'Report generated successfully'));
  } catch (error) {
    report.status = 'failed';
    report.aiResponse = error.message;
    await report.save();
    throw new ApiError(500, `Failed to generate report: ${error.message}`);
  }
});

const getReportById = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findById(req.params.reportId).lean();
  if (!report) throw new ApiError(404, 'Report not found');
  res.json(new ApiResponse(200, { report }));
});

const getUserReports = asyncHandler(async (req, res) => {
  const reports = await GeneratedReport.find({ userId: req.params.userId, status: 'ready' })
    .sort({ createdAt: -1 })
    .lean();
  res.json(new ApiResponse(200, { reports }));
});

const exportReport = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findById(req.params.reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  
  // Scaffolded Cloudinary Export Mock
  report.exportUrl = `https://res.cloudinary.com/demo/image/upload/v1612345/mock_report_${report._id}.pdf`;
  await report.save();

  res.json(new ApiResponse(200, { exportUrl: report.exportUrl }, 'Report PDF generated and uploaded'));
});

const getSharedReport = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findOne({ shareToken: req.params.token });
  if (!report) throw new ApiError(404, 'Shared report not found or expired');
  
  if (report.validUntil && new Date() > new Date(report.validUntil)) {
    throw new ApiError(403, 'This shared report link has expired');
  }

  report.viewCount += 1;
  await report.save();

  // Strip sensitive PII from context snapshot for shared view
  const safeData = {
    reportType: report.reportType,
    generatedAt: report.generatedAt,
    structuredContent: report.structuredContent,
  };

  res.json(new ApiResponse(200, { report: safeData }));
});

const deleteReport = asyncHandler(async (req, res) => {
  const report = await GeneratedReport.findByIdAndDelete(req.params.reportId);
  if (!report) throw new ApiError(404, 'Report not found');
  res.json(new ApiResponse(200, null, 'Report deleted'));
});

module.exports = {
  getContext,
  generateReport,
  getReportById,
  getUserReports,
  exportReport,
  getSharedReport,
  deleteReport
};
