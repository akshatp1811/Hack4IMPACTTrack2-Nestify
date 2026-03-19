// src/data/records.js
export const rawRecords = [
  // --- 2025 MARCH ---
  {
    id: "v_1",
    type: "visit",
    date: "2025-03-12",
    time: "09:30 AM",
    title: "General Checkup",
    doctor: "Dr. Priya Sharma",
    specialty: "Internal Medicine",
    facility: "Apollo Hospital",
    summary: "Annual general checkup. Patient reports feeling well.",
    vitals: { temp: "98.6°F", bp: "120/80", hr: "72 bpm", weight: "75 kg", spO2: "99%" },
    notes: "Patient is doing well. Continue current medications.",
    actions: ["Refill prescriptions", "Schedule next annual visit"]
  },
  {
    id: "l_1",
    type: "lab",
    date: "2025-03-12",
    dateReported: "2025-03-13",
    title: "Complete Blood Count",
    doctor: "Dr. Priya Sharma",
    labName: "Apollo Diagnostics",
    status: "borderline", // "normal", "abnormal", "borderline"
    results: [
      { name: "Hemoglobin", value: 13.2, unit: "g/dL", range: "13.5–17.5", status: "Low" },
      { name: "WBC Count", value: 7200, unit: "/μL", range: "4500–11000", status: "Normal" },
      { name: "Platelets", value: 210000, unit: "/μL", range: "150k–400k", status: "Normal" }
    ]
  },
  {
    id: "s_1",
    type: "scan",
    subType: "ECG",
    date: "2025-03-12",
    time: "10:00 AM",
    doctor: "Dr. Priya Sharma",
    facility: "Apollo Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. Arun Kumar, MD (Cardiology)",
      date: "2025-03-12",
      findings: "Normal sinus rhythm. No acute ST-T wave changes.",
      impression: "Normal ECG."
    }
  },

  // --- 2025 JANUARY ---
  {
    id: "m_1",
    type: "medication",
    date: "2025-01-08",
    name: "Amlodipine",
    generic: "Amlodipine Besylate",
    dosage: "5mg",
    frequency: "Once daily",
    form: "Tablet",
    duration: "Ongoing",
    doctor: "Dr. Rajan Mehta",
    status: "Ongoing",
    indication: "Hypertension",
    instructions: "Take in the morning with water"
  },
  {
    id: "c_1",
    type: "consultation",
    date: "2025-01-08",
    doctor: "Dr. Rajan Mehta",
    specialty: "Cardiology",
    facility: "Fortis Hospital",
    mode: "In-Person",
    reason: "Follow-up for hypertension management",
    summary: "BP is well controlled on requested medication. No chest pain or shortness of breath.",
    recommendations: ["Continue Amlodipine 5mg", "Monitor BP at home weekly"],
    prescriptions: ["m_1"]
  },

  // --- 2024 AUGUST ---
  {
    id: "s_2",
    type: "scan",
    subType: "Chest X-Ray",
    date: "2024-08-03",
    time: "11:00 AM",
    doctor: "Dr. Rajan Mehta",
    facility: "Fortis Hospital",
    status: "Report Available",
    report: {
      radiologist: "Dr. S. Gupta, MD (Radiology)",
      date: "2024-08-04",
      findings: "Lungs are clear. Heart size appears upper limit of normal.",
      impression: "Mild cardiomegaly noted."
    }
  },
  {
    id: "s_3",
    type: "scan",
    subType: "Ultrasound Abdomen",
    date: "2024-08-03",
    time: "11:30 AM",
    doctor: "Dr. Priya Sharma",
    facility: "Fortis Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. S. Gupta, MD (Radiology)",
      date: "2024-08-04",
      findings: "Liver is normal in size and echotexture. No focal lesions. Gallbladder is clear.",
      impression: "Normal ultrasound abdomen."
    }
  },
  {
    id: "l_2",
    type: "lab",
    date: "2024-08-03",
    dateReported: "2024-08-04",
    title: "Lipid Profile",
    doctor: "Dr. Rajan Mehta",
    labName: "Fortis PathLabs",
    status: "borderline",
    results: [
      { name: "Total Cholesterol", value: 210, unit: "mg/dL", range: "<200", status: "High" },
      { name: "LDL", value: 138, unit: "mg/dL", range: "<130", status: "High" },
      { name: "HDL", value: 45, unit: "mg/dL", range: ">40", status: "Normal" },
      { name: "Triglycerides", value: 145, unit: "mg/dL", range: "<150", status: "Normal" }
    ]
  },

  // --- 2024 APRIL ---
  {
    id: "s_4",
    type: "scan",
    subType: "MRI Brain",
    date: "2024-04-18",
    time: "02:00 PM",
    doctor: "Dr. Kavitha Rao",
    facility: "NIMHANS",
    status: "Report Available",
    report: {
      radiologist: "Dr. M. Srinivasan, MD (Neuroradiology)",
      date: "2024-04-19",
      findings: "Brain parenchyma shows normal signal intensity. Ventricles and sulci are age-appropriate.",
      impression: "No acute abnormality."
    }
  },
  {
    id: "c_2",
    type: "consultation",
    date: "2024-04-18",
    doctor: "Dr. Kavitha Rao",
    specialty: "Neurology",
    facility: "NIMHANS",
    mode: "In-Person",
    reason: "Occasional tension headaches",
    summary: "Neurological exam normal. Headaches likely due to stress/tension.",
    recommendations: ["Stress management", "Adequate hydration"]
  },

  // --- 2024 JANUARY ---
  {
    id: "s_5",
    type: "scan",
    subType: "Chest X-Ray",
    date: "2024-01-22",
    time: "10:15 AM",
    doctor: "Dr. Rajan Mehta",
    facility: "Fortis Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. S. Gupta, MD (Radiology)",
      date: "2024-01-23",
      findings: "Lungs are clear. Normal cardiac silhouette.",
      impression: "Clear lung fields."
    }
  },
  {
    id: "s_6",
    type: "scan",
    subType: "ECG",
    date: "2024-01-22",
    time: "09:45 AM",
    doctor: "Dr. Rajan Mehta",
    facility: "Fortis Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. Arun Kumar, MD",
      date: "2024-01-22",
      findings: "Normal sinus rhythm. Axis normal. Intervals within normal limits.",
      impression: "Normal ECG."
    }
  },
  {
    id: "m_2",
    type: "medication",
    date: "2024-01-22",
    name: "Atorvastatin",
    generic: "Atorvastatin Calcium",
    dosage: "10mg",
    frequency: "Once daily",
    form: "Tablet",
    duration: "Ongoing",
    doctor: "Dr. Rajan Mehta",
    status: "Ongoing",
    indication: "Hyperlipidemia prevention",
    instructions: "Take at bedtime"
  },

  // --- 2023 OCTOBER ---
  {
    id: "l_3",
    type: "lab",
    date: "2023-10-05",
    dateReported: "2023-10-06",
    title: "Thyroid Panel",
    doctor: "Dr. Priya Sharma",
    labName: "Apollo Diagnostics",
    status: "abnormal",
    results: [
      { name: "TSH", value: 6.2, unit: "μIU/mL", range: "0.27–4.20", status: "High" },
      { name: "Free T4", value: 1.1, unit: "ng/dL", range: "0.93–1.70", status: "Normal" }
    ]
  },
  {
    id: "m_3",
    type: "medication",
    date: "2023-10-05",
    name: "Levothyroxine",
    generic: "Levothyroxine Sodium",
    dosage: "50mcg",
    frequency: "Once daily",
    form: "Tablet",
    duration: "Ongoing",
    doctor: "Dr. Priya Sharma",
    status: "Ongoing",
    indication: "Hypothyroidism",
    instructions: "Take empty stomach in morning"
  },

  // --- 2023 JUNE ---
  {
    id: "s_7",
    type: "scan",
    subType: "Ultrasound Abdomen",
    date: "2023-06-14",
    time: "11:00 AM",
    doctor: "Dr. Priya Sharma",
    facility: "Apollo Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. Ramesh Iyer, MD",
      date: "2023-06-15",
      findings: "Liver size 15cm, increased echogenicity relative to kidney.",
      impression: "Mild fatty liver grade 1."
    }
  },
  {
    id: "v_2",
    type: "visit",
    date: "2023-06-14",
    time: "10:30 AM",
    title: "Follow-up",
    doctor: "Dr. Priya Sharma",
    specialty: "Internal Medicine",
    facility: "Apollo Hospital",
    summary: "Routine follow up.",
    vitals: { temp: "98.4°F", bp: "125/82", hr: "76 bpm", weight: "76.5 kg", spO2: "98%" }
  },
  {
    id: "s_8",
    type: "scan",
    subType: "ECG",
    date: "2023-06-14",
    time: "10:00 AM",
    doctor: "Dr. Priya Sharma",
    facility: "Apollo Hospital",
    status: "Reviewed by Doctor",
    report: {
      radiologist: "Dr. Arun Kumar, MD",
      date: "2023-06-14",
      findings: "Normal sinus rhythm",
      impression: "Normal ECG."
    }
  },

  // --- 2023 FEBRUARY ---
  {
    id: "l_4",
    type: "lab",
    date: "2023-02-28",
    dateReported: "2023-03-01",
    title: "Complete Blood Count",
    doctor: "Dr. Priya Sharma",
    labName: "Apollo Diagnostics",
    status: "normal",
    results: [
      { name: "Hemoglobin", value: 14.5, unit: "g/dL", range: "13.5–17.5", status: "Normal" },
      { name: "WBC Count", value: 6500, unit: "/μL", range: "4500–11000", status: "Normal" },
      { name: "Platelets", value: 250000, unit: "/μL", range: "150k–400k", status: "Normal" }
    ]
  },
  {
    id: "l_5",
    type: "lab",
    date: "2023-02-28",
    dateReported: "2023-03-01",
    title: "Lipid Profile",
    doctor: "Dr. Priya Sharma",
    labName: "Apollo Diagnostics",
    status: "normal",
    results: [
      { name: "Total Cholesterol", value: 185, unit: "mg/dL", range: "<200", status: "Normal" },
      { name: "LDL", value: 110, unit: "mg/dL", range: "<130", status: "Normal" },
      { name: "HDL", value: 50, unit: "mg/dL", range: ">40", status: "Normal" }
    ]
  },
  {
    id: "v_3",
    type: "visit",
    date: "2023-02-28",
    time: "09:00 AM",
    title: "Annual Health Checkup",
    doctor: "Dr. Priya Sharma",
    specialty: "Internal Medicine",
    facility: "Apollo Hospital",
    summary: "Routine annual exam.",
    vitals: { temp: "98.6°F", bp: "118/78", hr: "70 bpm", weight: "74 kg", spO2: "99%" }
  }
];

export const groupRecords = (records) => {
  // We want to group continuous similar items or just globally group scans and meds by name
  // The user rule: "Same scan type taken multiple times = grouped... horizontal mini-timeline"
  // Let's create a grouped array representing nodes on the timeline
  
  const grouped = [];
  const scanGroups = {};
  const medGroups = {};

  records.forEach(rec => {
    if (rec.type === 'scan') {
      if (!scanGroups[rec.subType]) {
        scanGroups[rec.subType] = { id: `sg_${rec.subType}`, type: 'scanGroup', subType: rec.subType, items: [] };
        grouped.push(scanGroups[rec.subType]);
      }
      scanGroups[rec.subType].items.push(rec);
    } else if (rec.type === 'medication') {
      if (!medGroups[rec.name]) {
        medGroups[rec.name] = { id: `mg_${rec.name}`, type: 'medGroup', name: rec.name, items: [] };
        grouped.push(medGroups[rec.name]);
      }
      medGroups[rec.name].items.push(rec);
    } else {
      grouped.push(rec);
    }
  });

  // Sort function to keep chronological order by picking the MOST RECENT date of the group as its anchor
  grouped.forEach(g => {
    if (g.type === 'scanGroup' || g.type === 'medGroup') {
      // items are already roughly chronological since records array is sorted
      g.items.sort((a,b) => new Date(b.date) - new Date(a.date));
      g.date = g.items[0].date; // Anchor to the most recent
    }
  });

  grouped.sort((a,b) => new Date(b.date) - new Date(a.date));

  return grouped;
};

// Utility to group by Year and Month for rendering the spine
export const groupByMonthAndYear = (nodes) => {
  const spine = [];
  nodes.forEach(node => {
    const d = new Date(node.date);
    const yr = d.getFullYear();
    const mo = d.toLocaleString('default', { month: 'long' });
    
    let yearBlock = spine.find(s => s.year === yr);
    if (!yearBlock) {
      yearBlock = { year: yr, months: [] };
      spine.push(yearBlock);
    }
    
    let moBlock = yearBlock.months.find(m => m.month === mo);
    if (!moBlock) {
      moBlock = { month: mo, records: [] };
      yearBlock.months.push(moBlock);
    }
    
    moBlock.records.push(node);
  });
  return spine;
};
