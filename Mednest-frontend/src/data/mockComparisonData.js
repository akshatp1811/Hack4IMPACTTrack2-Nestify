// src/data/mockComparisonData.js

export const MOCK_ULTRASOUND = {
  currentRecord: {
    _id: 'mock_usg_current',
    recordType: 'scan',
    subType: 'USG Abdomen',
    groupKey: 'usg_abdomen',
    recordDate: '2026-03-19T00:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    facilityName: 'Apollo Hospitals',
    mlPipeline: { status: 'completed', confidence: { classification: 89, extraction: 84 } },
    originalFile: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ultrasound_of_human_liver.jpg/320px-Ultrasound_of_human_liver.jpg',
      fileType: 'jpg'
    },
    extractedData: {
      scanType: 'Ultrasound',
      bodyRegion: 'Abdomen',
      modalityType: 'Ultrasound',
      radiologistName: 'Dr. Priya Sharma',
      scanPerformedAt: '2026-03-19',
      reportDate: '2026-03-19',
      findings: [
        'Liver is normal in size and echogenicity',
        'No focal lesion identified in the liver parenchyma',
        'Gallbladder is well distended with no calculi seen',
        'Common bile duct measures 4mm — within normal limits',
        'Both kidneys are normal in size and echotexture',
        'No hydronephrosis or calculi in either kidney',
        'Spleen is normal in size at 10.2 cm',
        'No free fluid in the abdomen or pelvis',
        'Pancreas is visualised and appears normal'
      ],
      impression: 'Normal ultrasound examination of the abdomen. Mild improvement compared to previous study showing grade 1 fatty liver. No acute abnormality detected.',
      isReportAttached: true,
      urgency: 'routine'
    },
    aiSummary: 'Your abdominal ultrasound from March 2026 shows significant improvement from your previous scan. The mild fatty liver (Grade 1) seen in 2023 has resolved — your liver now appears completely normal in size and texture. All other abdominal organs including your gallbladder, kidneys, spleen, and pancreas are within normal limits. No fluid accumulation or concerning findings detected.',
    keyFindings: [
      'Fatty liver from 2023 has fully resolved',
      'Liver size and echogenicity now normal',
      'All abdominal organs within normal limits',
      'No free fluid or acute findings'
    ]
  },
  previousRecord: {
    _id: 'mock_usg_previous',
    recordType: 'scan',
    subType: 'USG Abdomen',
    groupKey: 'usg_abdomen',
    recordDate: '2024-01-15T00:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    facilityName: 'Apollo Hospitals',
    mlPipeline: { status: 'completed', confidence: { classification: 91, extraction: 88 } },
    originalFile: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ultrasound_of_human_liver.jpg/320px-Ultrasound_of_human_liver.jpg',
      fileType: 'jpg'
    },
    extractedData: {
      scanType: 'Ultrasound',
      bodyRegion: 'Abdomen',
      findings: [
        'Liver is mildly enlarged at 16.5 cm',
        'Diffuse increased echogenicity of liver parenchyma — Grade 1 fatty liver',
        'Gallbladder is normal with no calculi',
        'Both kidneys normal in size and echotexture',
        'Spleen normal at 10.0 cm',
        'No free fluid seen'
      ],
      impression: 'Grade 1 fatty liver (hepatic steatosis). All other abdominal organs normal. Clinical correlation and dietary modification advised.',
      isReportAttached: true
    },
    aiSummary: 'Your January 2024 abdominal ultrasound showed Grade 1 fatty liver — a mild form of fat accumulation in the liver. This is a common and often reversible condition. Your other abdominal organs including kidneys, gallbladder, and spleen were all normal at this time.',
    keyFindings: [
      'Grade 1 fatty liver detected',
      'Liver mildly enlarged at 16.5 cm',
      'All other organs normal'
    ]
  },
  allHistory: [
    {
      _id: 'mock_usg_oldest',
      recordDate: '2023-06-14T00:00:00.000Z',
      facilityName: 'Apollo Hospitals',
      extractedData: {
        impression: 'Mild fatty liver Grade 1. Liver measures 16.8 cm. Dietary modification recommended.'
      },
      aiSummary: 'First scan showing early Grade 1 fatty liver.',
      keyFindings: ['Grade 1 fatty liver — first detection']
    },
    {
      _id: 'mock_usg_previous',
      recordDate: '2024-01-15T00:00:00.000Z',
      facilityName: 'Apollo Hospitals',
      extractedData: {
        impression: 'Grade 1 fatty liver persisting. Liver 16.5 cm.'
      },
      aiSummary: 'Fatty liver persisting from 2023.',
      keyFindings: ['Grade 1 fatty liver — persisting']
    },
    {
      _id: 'mock_usg_current',
      recordDate: '2026-03-19T00:00:00.000Z',
      facilityName: 'Apollo Hospitals',
      extractedData: {
        impression: 'Normal ultrasound. Fatty liver resolved.'
      },
      aiSummary: 'Fatty liver resolved. All normal.',
      keyFindings: ['Fatty liver resolved — fully normal']
    }
  ],
  comparison: {
    overallTrend: 'improving',
    summary: 'Significant improvement over 3 years. Grade 1 fatty liver detected in June 2023 has fully resolved by March 2026.',
    changes: [
      {
        field: 'Liver Size',
        valueA: '16.5 cm (enlarged)',
        valueB: 'Normal',
        direction: 'improved',
        significance: 'significant',
        note: 'Liver has returned to normal size'
      },
      {
        field: 'Fatty Liver',
        valueA: 'Grade 1 present',
        valueB: 'Resolved',
        direction: 'improved',
        significance: 'significant',
        note: 'Complete resolution of hepatic steatosis'
      },
      {
        field: 'Kidneys',
        valueA: 'Normal',
        valueB: 'Normal',
        direction: 'stable',
        significance: 'normal_variation',
        note: 'Consistently normal across all scans'
      },
      {
        field: 'Gallbladder',
        valueA: 'Normal',
        valueB: 'Normal',
        direction: 'stable',
        significance: 'normal_variation',
        note: 'No change'
      }
    ],
    aiInsight: `OVERALL TREND\nSignificant improvement across 3 scans from June 2023 to March 2026. The Grade 1 fatty liver detected on your first scan has completely resolved — this is an excellent outcome that reflects successful lifestyle or dietary changes.\n\nWHAT CHANGED\n• Fatty liver (Grade 1) fully resolved — no longer detected on current scan\n• Liver size normalized from 16.5 cm back to normal range\n• All other abdominal organs have remained consistently normal across all 3 scans\n\nCOMPARED AGAINST FULL HISTORY\nThis analysis considers all 3 USG Abdomen scans from June 2023 to March 2026. The trend is clearly positive — progressive improvement with full resolution of the initial finding.\n\nCLINICAL NOTE\nThese findings are for informational purposes only. Please discuss with your doctor before making any health decisions.`,
    clinicalNote: 'These findings are for informational purposes only. Please discuss with your doctor before making any health decisions.'
  }
};

export const MOCK_CBC = {
  currentRecord: {
    _id: 'mock_cbc_current',
    recordType: 'lab_report',
    subType: 'Complete Blood Count',
    groupKey: 'cbc',
    recordDate: '2025-03-12T00:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    facilityName: 'Apollo Diagnostics',
    mlPipeline: { status: 'completed', confidence: { classification: 94, extraction: 91 } },
    originalFile: { url: null, fileType: 'jpg' },
    extractedData: {
      labName: 'Apollo Diagnostics',
      sampleCollectedAt: '2025-03-12',
      reportedAt: '2025-03-12',
      orderedBy: 'Dr. Priya Sharma',
      results: [
        { name: 'Hemoglobin', parameterKey: 'hemoglobin', value: 13.2, unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5, status: 'Low' },
        { name: 'WBC Count', parameterKey: 'wbc', value: 7200, unit: '/μL', referenceMin: 4500, referenceMax: 11000, status: 'Normal' },
        { name: 'Platelets', parameterKey: 'platelets', value: 210000, unit: '/μL', referenceMin: 150000, referenceMax: 400000, status: 'Normal' },
        { name: 'RBC Count', parameterKey: 'rbc', value: 4.8, unit: 'million/μL', referenceMin: 4.5, referenceMax: 5.5, status: 'Normal' },
        { name: 'Hematocrit', parameterKey: 'hematocrit', value: 39, unit: '%', referenceMin: 41, referenceMax: 53, status: 'Low' },
        { name: 'MCV', parameterKey: 'mcv', value: 81, unit: 'fL', referenceMin: 80, referenceMax: 100, status: 'Normal' },
        { name: 'MCH', parameterKey: 'mch', value: 27.5, unit: 'pg', referenceMin: 27, referenceMax: 33, status: 'Normal' },
        { name: 'Neutrophils', parameterKey: 'neutrophils', value: 62, unit: '%', referenceMin: 40, referenceMax: 70, status: 'Normal' }
      ]
    },
    aiSummary: 'Your Complete Blood Count from March 2025 shows mild anemia — your Hemoglobin is slightly below the normal range at 13.2 g/dL, and Hematocrit is also marginally low. All other parameters including white blood cells, platelets, and red blood cell count are within normal limits. No critical values detected.',
    keyFindings: [
      'Hemoglobin borderline low at 13.2 g/dL (ref: 13.5–17.5)',
      'Hematocrit borderline low at 39% (ref: 41–53%)',
      'All other 6 parameters within normal range',
      'No critical values detected'
    ]
  },
  previousRecord: {
    _id: 'mock_cbc_previous',
    recordType: 'lab_report',
    subType: 'Complete Blood Count',
    groupKey: 'cbc',
    recordDate: '2023-02-28T00:00:00.000Z',
    doctorName: 'Dr. Priya Sharma',
    facilityName: 'Apollo Diagnostics',
    mlPipeline: { status: 'completed' },
    originalFile: { url: null, fileType: 'jpg' },
    extractedData: {
      results: [
        { name: 'Hemoglobin', parameterKey: 'hemoglobin', value: 14.8, unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5, status: 'Normal' },
        { name: 'WBC Count', parameterKey: 'wbc', value: 7400, unit: '/μL', referenceMin: 4500, referenceMax: 11000, status: 'Normal' },
        { name: 'Platelets', parameterKey: 'platelets', value: 185000, unit: '/μL', referenceMin: 150000, referenceMax: 400000, status: 'Normal' },
        { name: 'Hematocrit', parameterKey: 'hematocrit', value: 43, unit: '%', referenceMin: 41, referenceMax: 53, status: 'Normal' },
        { name: 'RBC Count', parameterKey: 'rbc', value: 5.1, unit: 'million/μL', referenceMin: 4.5, referenceMax: 5.5, status: 'Normal' }
      ]
    },
    aiSummary: 'Your February 2023 CBC was entirely normal. Hemoglobin at 14.8 g/dL was well within range. All other parameters normal.',
    keyFindings: ['All parameters within normal range', 'Hemoglobin 14.8 g/dL — normal']
  },
  allHistory: [
    { _id: 'mock_cbc_previous', recordDate: '2023-02-28T00:00:00.000Z', facilityName: 'Apollo Diagnostics', extractedData: { results: [{ name: 'Hemoglobin', value: 14.8, status: 'Normal' }] }, keyFindings: ['All normal — Hgb 14.8'] },
    { _id: 'mock_cbc_current', recordDate: '2025-03-12T00:00:00.000Z', facilityName: 'Apollo Diagnostics', extractedData: { results: [{ name: 'Hemoglobin', value: 13.2, status: 'Low' }] }, keyFindings: ['Hgb borderline low 13.2'] }
  ],
  comparison: {
    overallTrend: 'worsening',
    changes: [
      { parameter: 'Hemoglobin', current: '13.2', previous: '14.8', change: '↓', significance: '⚠ Worsened' },
      { parameter: 'Hematocrit', current: '39', previous: '43', change: '↓', significance: '⚠ Worsened' },
      { parameter: 'WBC Count', current: '7200', previous: '7400', change: '→', significance: '— Normal var.' },
      { parameter: 'Platelets', current: '210000', previous: '185000', change: '↑', significance: '✓ Improved' }
    ],
    aiInsight: `OVERALL TREND\nMild decline in red blood cell parameters over 2 years. Hemoglobin has dropped from 14.8 to 13.2 g/dL — now borderline low, suggesting early mild anemia developing.\n\nWHAT CHANGED\n• Hemoglobin declined from 14.8 → 13.2 g/dL — crossed below reference range\n• Hematocrit declined from 43% → 39% — now borderline low\n• WBC and Platelets remain stable within normal limits\n\nCOMPARED AGAINST FULL HISTORY\nThis analysis covers 2 CBC reports from Feb 2023 to Mar 2025. The downward trend in Hemoglobin warrants monitoring.\n\nCLINICAL NOTE\nThese findings are for informational purposes only. Please discuss with your doctor before making any health decisions.`,
    clinicalNote: 'These findings are for informational purposes only. Please discuss with your doctor before making any health decisions.'
  }
};

export const MOCK_CHEST_XRAY = {
  currentRecord: {
    _id: 'mock_cxr_current',
    recordType: 'scan',
    subType: 'Chest X-Ray',
    groupKey: 'chest_xray',
    recordDate: '2026-03-20T00:00:00.000Z',
    doctorName: 'Dr. Anand Kumar',
    facilityName: 'Fortis Hospital',
    mlPipeline: { status: 'completed' },
    originalFile: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Chest_x-ray_1.jpg/300px-Chest_x-ray_1.jpg',
      fileType: 'jpg'
    },
    extractedData: {
      scanType: 'X-Ray',
      bodyRegion: 'Chest',
      findings: [
        'Heart size is normal',
        'Lungs are clear without focal consolidation',
        'No pleural effusion or pneumothorax',
        'Bony thorax is intact'
      ],
      impression: 'Normal frontal radiograph of the chest. No active cardiopulmonary disease.'
    },
    aiSummary: 'Your Chest X-Ray is completely normal. The heart size is standard, and both lungs are clear with no signs of infection, fluid, or other abnormalities. Your ribs and collarbones are intact.'
  },
  previousRecord: null,
  allHistory: [
    { _id: 'mock_cxr_current', recordDate: '2026-03-20T00:00:00.000Z', facilityName: 'Fortis Hospital', extractedData: { impression: 'Normal chest X-ray' } }
  ],
  comparison: null
};

export const MOCK_LIPID = {
  currentRecord: {
    _id: 'mock_lipid_current',
    recordType: 'lab_report',
    subType: 'Lipid Profile',
    groupKey: 'lipid',
    recordDate: '2025-11-10T00:00:00.000Z',
    doctorName: 'Dr. K. Venkatesh',
    facilityName: 'NIMHANS Labs',
    mlPipeline: { status: 'completed' },
    originalFile: { url: null, fileType: 'pdf' },
    extractedData: {
      results: [
        { name: 'Total Cholesterol', value: 210, unit: 'mg/dL', referenceMin: 0, referenceMax: 200, status: 'High' },
        { name: 'LDL Cholesterol', value: 145, unit: 'mg/dL', referenceMin: 0, referenceMax: 100, status: 'High' },
        { name: 'HDL Cholesterol', value: 42, unit: 'mg/dL', referenceMin: 40, referenceMax: 60, status: 'Normal' },
        { name: 'Triglycerides', value: 180, unit: 'mg/dL', referenceMin: 0, referenceMax: 150, status: 'High' }
      ]
    },
    aiSummary: 'Your Lipid Profile indicates border-line high cholesterol. Total Cholesterol (210) and LDL (145) are elevated. Triglycerides are also high at 180. These values suggest a need for dietary review.'
  },
  previousRecord: {
    _id: 'mock_lipid_previous',
    recordType: 'lab_report',
    subType: 'Lipid Profile',
    recordDate: '2024-05-15T00:00:00.000Z',
    doctorName: 'Dr. K. Venkatesh',
    facilityName: 'NIMHANS Labs',
    extractedData: {
      results: [
        { name: 'Total Cholesterol', value: 230, unit: 'mg/dL', status: 'High' },
        { name: 'LDL Cholesterol', value: 160, unit: 'mg/dL', status: 'High' },
        { name: 'HDL Cholesterol', value: 38, unit: 'mg/dL', status: 'Low' },
        { name: 'Triglycerides', value: 195, unit: 'mg/dL', status: 'High' }
      ]
    }
  },
  allHistory: [
    { _id: 'mock_lipid_previous', recordDate: '2024-05-15T00:00:00.000Z', facilityName: 'NIMHANS Labs', extractedData: { results: [{ name: 'LDL Cholesterol', value: 160, status: 'High' }] } },
    { _id: 'mock_lipid_current', recordDate: '2025-11-10T00:00:00.000Z', facilityName: 'NIMHANS Labs', extractedData: { results: [{ name: 'LDL Cholesterol', value: 145, status: 'High' }] } }
  ],
  comparison: {
    overallTrend: 'improving',
    changes: [
      { parameter: 'Total Cholesterol', current: '210', previous: '230', change: '↓', significance: '✓ Improved' },
      { parameter: 'LDL Cholesterol', current: '145', previous: '160', change: '↓', significance: '✓ Improved' },
      { parameter: 'HDL Cholesterol', current: '42', previous: '38', change: '↑', significance: '✓ Improved' },
      { parameter: 'Triglycerides', current: '180', previous: '195', change: '↓', significance: '✓ Improved' }
    ],
    aiInsight: `OVERALL TREND\nStrong improvement across all lipid markers over 1.5 years. While values remain elevated above ideal thresholds, the downward trajectory in bad cholesterol (LDL) and triglycerides is highly encouraging.\n\nWHAT CHANGED\n• LDL Cholesterol decreased from 160 → 145 mg/dL\n• HDL (Good) Cholesterol increased from 38 → 42 mg/dL\n• Overall risk profile is steadily improving\n\nCLINICAL NOTE\nThese findings are for informational purposes only. Please discuss with your doctor before making any health decisions.`,
    clinicalNote: 'These findings are for informational purposes only. Please discuss with your doctor before making any health decisions.'
  }
};

export const MOCK_THYROID = {
  currentRecord: {
    _id: 'mock_thyroid_current',
    recordType: 'lab_report',
    subType: 'Thyroid Panel',
    groupKey: 'thyroid',
    recordDate: '2026-01-05T00:00:00.000Z',
    doctorName: 'Dr. Srinivas Rao',
    facilityName: 'Care Hospitals',
    mlPipeline: { status: 'completed' },
    extractedData: {
      results: [
        { name: 'TSH', value: 2.1, unit: 'mIU/L', referenceMin: 0.4, referenceMax: 4.0, status: 'Normal' },
        { name: 'Free T4', value: 1.2, unit: 'ng/dL', referenceMin: 0.8, referenceMax: 1.8, status: 'Normal' }
      ]
    },
    aiSummary: 'Your Thyroid Panel is entirely normal. TSH is perfectly balanced at 2.1 mIU/L, indicating normal thyroid function.'
  },
  previousRecord: null,
  allHistory: [
    { _id: 'mock_thyroid_current', recordDate: '2026-01-05T00:00:00.000Z', facilityName: 'Care Hospitals', extractedData: { results: [{ name: 'TSH', value: 2.1, status: 'Normal' }] } }
  ],
  comparison: null
};

export const getMockDataForRecord = (record) => {
  const key = record?.groupKey || record?.subType?.toLowerCase() || ''

  if (key.includes('usg') || key.includes('ultrasound')) return MOCK_ULTRASOUND
  if (key.includes('cbc') || key.includes('blood') || key.includes('hemogram')) return MOCK_CBC
  if (key.includes('chest') || key.includes('xray') || key.includes('x-ray')) return MOCK_CHEST_XRAY
  if (key.includes('lipid') || key.includes('cholesterol')) return MOCK_LIPID
  if (key.includes('thyroid') || key.includes('tsh')) return MOCK_THYROID

  return MOCK_ULTRASOUND
};
