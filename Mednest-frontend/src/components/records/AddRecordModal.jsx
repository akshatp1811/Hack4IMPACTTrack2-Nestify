// src/components/records/AddRecordModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, Camera, Image, FolderOpen, ArrowLeft, Sparkles, CheckCircle, Pill, Activity, Loader } from 'lucide-react';
import '../../add-record.css';
import { uploadFile, createRecord } from '../../services/api';

const STATUS_MESSAGES = [
  "Detecting document type...",
  "Extracting medical data...",
  "Identifying key findings...",
  "Organizing for your timeline...",
];

// Simulated AI result by document "type" (we randomly pick one)
const MOCK_AI_RESULTS = {
  lab: {
    type: 'lab', confidence: 94,
    extractedData: {
      subType: 'Complete Blood Count', date: '2025-03-12', doctor: 'Dr. Priya Sharma', facility: 'Apollo Hospitals',
      results: [
        { name: 'Hemoglobin', value: 13.2, unit: 'g/dL', range: '13.5–17.5', status: 'Low' },
        { name: 'WBC Count', value: 7200, unit: '/μL', range: '4500–11000', status: 'Normal' },
        { name: 'Platelets', value: 210000, unit: '/μL', range: '150k–400k', status: 'Normal' },
        { name: 'RBC', value: 4.8, unit: 'M/μL', range: '4.5–5.5', status: 'Normal' },
        { name: 'Hematocrit', value: 39, unit: '%', range: '41–53%', status: 'Low' },
      ],
      aiSummary: 'Mild anemia indicated by borderline low Hemoglobin and Hematocrit. All other parameters within normal range. Recommend follow-up with physician.',
    }
  },
  prescription: {
    type: 'prescription', confidence: 88,
    extractedData: {
      date: '2025-01-08', doctor: 'Dr. Rajan Mehta', facility: 'Fortis Hospital',
      medications: [
        { name: 'Amlodipine', generic: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Morning, after meals' },
        { name: 'Atorvastatin', generic: 'Atorvastatin Calcium', dosage: '10mg', frequency: 'Once daily', duration: 'Ongoing', instructions: 'Bedtime' },
      ],
      diagnosis: 'Hypertension, Dyslipidemia',
      doctorNotes: 'Monitor BP weekly. Reduce salt intake. Follow up in 4 weeks.',
    }
  },
  scan: {
    type: 'scan', confidence: 91,
    extractedData: {
      subType: 'Chest X-Ray', bodyRegion: 'Chest', view: 'PA View', date: '2024-08-03', doctor: 'Dr. K. Venkatesh', facility: 'Apollo Radiology',
      findings: ['Mild cardiomegaly noted', 'Lung fields show increased bronchovascular markings', 'No pleural effusion', 'No consolidation seen'],
      impression: 'Mild cardiomegaly. Clinical correlation recommended.',
      groupInfo: { existingCount: 1, label: 'Chest X-Ray', prevDate: 'Jan 2024' },
    }
  }
};

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

const AddRecordModal = ({ isOpen, onClose, onRecordAdded }) => {
  const [step, setStep] = useState(1); // 1, 'processing', 2, 3, 4
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [aiResult, setAiResult] = useState(null);
  const [formData, setFormData] = useState({});
  const [editedFields, setEditedFields] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1); setUploadedFile(null); setAiResult(null); 
      setProcessingProgress(0); setStatusIdx(0); setFormData({}); setEditedFields({});
    }
  }, [isOpen]);

  // AI Processing visual simulation
  useEffect(() => {
    if (step !== 'processing') return;
    setProcessingProgress(0);
    setStatusIdx(0);
    const progressInterval = setInterval(() => {
      setProcessingProgress(p => {
        if (p >= 95) return 95; // wait for real upload
        return p + 4;
      });
    }, 100);
    const statusInterval = setInterval(() => {
      setStatusIdx(i => (i + 1) % STATUS_MESSAGES.length);
    }, 800);
    
    return () => { clearInterval(progressInterval); clearInterval(statusInterval); };
  }, [step]);

  const handleFileSelect = useCallback(async (file) => {
    if (file) {
      setUploadedFile(file);
      setStep('processing');
      
      try {
        const data = new FormData();
        data.append('file', file);
        
        // Execute upload and wait for at least 2.5s for the AI simulation UX
        const [uploadResponse] = await Promise.all([
          uploadFile(data),
          new Promise(res => setTimeout(res, 2500))
        ]);
        
        const fileData = uploadResponse.data.fileData;
        setProcessingProgress(100);
        
        setTimeout(() => {
          // Pick a random AI result type
          const types = ['lab', 'prescription', 'scan'];
          const picked = types[Math.floor(Math.random() * types.length)];
          const result = MOCK_AI_RESULTS[picked];
          setAiResult(result);
          
          setFormData({
            type: result.type,
            subType: result.extractedData.subType || result.extractedData.medications?.[0]?.name || '',
            date: result.extractedData.date,
            doctor: result.extractedData.doctor,
            facility: result.extractedData.facility,
            notes: '',
            originalFile: fileData
          });
          setStep(2);
        }, 400);

      } catch (err) {
        console.error('File upload failed:', err);
        alert(err.response?.data?.message || 'Failed to upload document.');
        setUploadedFile(null);
        setStep(1);
      }
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setEditedFields(prev => ({ ...prev, [field]: true }));
  };

  const handleAddToTimeline = async () => {
    if (!uploadedFile) return;
    
    setIsUploading(true);
    
    try {
      const payload = {
        recordType: formData.type === 'lab' ? 'lab_report' : formData.type,
        subType: formData.subType || '',
        recordDate: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        doctorName: formData.doctor,
        facilityName: formData.facility,
        userNotes: formData.notes,
        originalFile: formData.originalFile
      };

      const response = await createRecord(payload);
      
      // Update UI with the resulting record from API
      onRecordAdded?.(response.data.record);
      onClose();
    } catch (err) {
      console.error('Failed to upload record:', err);
      alert(err.response?.data?.message || 'Failed to upload record to database.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="add-record-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.div
          className="add-record-modal"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ duration: 0.3, type: 'spring', damping: 20, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>

          <AnimatePresence mode="wait">
            {/* ======= STEP 1: UPLOAD ======= */}
            {step === 1 && (
              <motion.div key="step1" className="modal-step" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="step-title">Add a Record</h2>
                <p className="step-subtitle">Upload a medical document — our AI will read and organize it for you.</p>

                <div
                  className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={40} color="#0EA5E9" strokeWidth={1.5} />
                  <div className="upload-zone-title">{dragOver ? 'Release to upload' : 'Drop your document or image here'}</div>
                  <div className="upload-zone-sub">Prescription · Report · Scan · Lab Result · Any medical document</div>
                  <button className="upload-browse-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Browse files</button>
                  <div className="upload-formats">
                    {['PDF', 'JPG', 'PNG', 'HEIC', 'TIFF'].map(f => <span key={f} className="format-pill">{f}</span>)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>Up to 25MB</div>
                </div>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.heic,.tiff" onChange={(e) => handleFileSelect(e.target.files?.[0])} />

                {uploadedFile && (
                  <div className="file-strip">
                    <div className="file-strip-icon"><FileText size={22} /></div>
                    <div className="file-strip-info">
                      <div className="file-strip-name">{uploadedFile.name}</div>
                      <div className="file-strip-size">{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button className="file-remove-btn" onClick={() => setUploadedFile(null)}><X size={18}/></button>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '28px' }}>
                  {[{ icon: <Camera size={20}/>, label: 'Camera' }, { icon: <Image size={20}/>, label: 'Photo Library' }, { icon: <FolderOpen size={20}/>, label: 'Files' }].map(opt => (
                    <button key={opt.label} onClick={() => fileInputRef.current?.click()} style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: '#64748B', fontSize: '12px', cursor: 'pointer' }}>
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ======= STEP 1B: PROCESSING ======= */}
            {step === 'processing' && (
              <motion.div key="processing" className="processing-view" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="scan-doc-icon">
                  <div className="scan-line" />
                </div>
                <div className="processing-label">Analyzing your document...</div>
                <div className="processing-progress">
                  <div className="processing-progress-fill" style={{ width: `${processingProgress}%` }} />
                </div>
                <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: '500' }}>{processingProgress}%</div>
                <motion.div
                  key={statusIdx}
                  className="status-message"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                >
                  {STATUS_MESSAGES[statusIdx]}
                </motion.div>
              </motion.div>
            )}

            {/* ======= STEP 2: CLASSIFICATION ======= */}
            {step === 2 && aiResult && (
              <motion.div key="step2" className="modal-step" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="step-title">AI Classification</h2>
                <p className="step-subtitle">We've analyzed your document. Verify the details below.</p>

                <div className="classification-layout">
                  {/* AI Detection */}
                  <div className="ai-detection-card">
                    <div className="ai-badge"><Sparkles size={14} /> AI Detected</div>
                    <div className="ai-field"><div className="ai-field-label">Type</div><div className="ai-field-value" style={{ textTransform: 'capitalize' }}>{aiResult.type === 'prescription' ? 'Prescription' : aiResult.type === 'lab' ? 'Lab Report' : 'Scan'}</div></div>
                    <div className="ai-field"><div className="ai-field-label">Category</div><div className="ai-field-value">{formData.subType}</div></div>
                    <div className="ai-field"><div className="ai-field-label">Date</div><div className="ai-field-value">{formData.date}</div></div>
                    <div className="ai-field"><div className="ai-field-label">Doctor</div><div className="ai-field-value">{formData.doctor}</div></div>
                    <div className="ai-field"><div className="ai-field-label">Facility</div><div className="ai-field-value">{formData.facility}</div></div>
                    <div className="ai-field">
                      <div className="ai-field-label">Confidence</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="confidence-bar" style={{ flex: 1 }}>
                          <div className="confidence-fill" style={{ width: `${aiResult.confidence}%`, background: aiResult.confidence >= 70 ? '#0EA5E9' : '#F59E0B' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: aiResult.confidence >= 70 ? '#0EA5E9' : '#F59E0B' }}>{aiResult.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Manual Override */}
                  <div className="override-form">
                    <div className="form-field">
                      <label className="form-label">Record Type *</label>
                      <select className="form-select" value={formData.type} onChange={(e) => handleFormChange('type', e.target.value)}>
                        <option value="lab">Lab Report</option>
                        <option value="prescription">Prescription</option>
                        <option value="scan">Scan</option>
                        <option value="visit">Visit Record</option>
                        <option value="consultation">Consultation</option>
                      </select>
                      <span className={`ai-input-badge ${editedFields.type ? 'edited' : 'ai'}`}>{editedFields.type ? 'Edited' : 'AI'}</span>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Sub-type / Test Name *</label>
                      <input className="form-input" value={formData.subType || ''} onChange={(e) => handleFormChange('subType', e.target.value)} />
                      <span className={`ai-input-badge ${editedFields.subType ? 'edited' : 'ai'}`}>{editedFields.subType ? 'Edited' : 'AI'}</span>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Date of Record *</label>
                      <input className="form-input" type="date" value={formData.date || ''} onChange={(e) => handleFormChange('date', e.target.value)} />
                      <span className={`ai-input-badge ${editedFields.date ? 'edited' : 'ai'}`}>{editedFields.date ? 'Edited' : 'AI'}</span>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Doctor Name</label>
                      <input className="form-input" value={formData.doctor || ''} onChange={(e) => handleFormChange('doctor', e.target.value)} />
                      <span className={`ai-input-badge ${editedFields.doctor ? 'edited' : 'ai'}`}>{editedFields.doctor ? 'Edited' : 'AI'}</span>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Hospital / Facility</label>
                      <input className="form-input" value={formData.facility || ''} onChange={(e) => handleFormChange('facility', e.target.value)} />
                      <span className={`ai-input-badge ${editedFields.facility ? 'edited' : 'ai'}`}>{editedFields.facility ? 'Edited' : 'AI'}</span>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Notes (optional)</label>
                      <textarea className="form-textarea" placeholder="Add any personal notes..." value={formData.notes || ''} onChange={(e) => handleFormChange('notes', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '20px 0 0', borderTop: 'none' }}>
                  <button className="btn-back" onClick={() => { setStep(1); setUploadedFile(null); setAiResult(null); }}><ArrowLeft size={16} /> Back</button>
                  <button className="btn-next" onClick={() => setStep(3)}>Continue to Preview →</button>
                </div>
              </motion.div>
            )}

            {/* ======= STEP 3: EXTRACTION PREVIEW ======= */}
            {step === 3 && aiResult && (
              <motion.div key="step3" className="modal-step" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <h2 className="step-title">Extraction Preview</h2>
                <p className="step-subtitle">Here's what our AI extracted from your document.</p>

                {/* PRESCRIPTION VARIANT */}
                {aiResult.type === 'prescription' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#F59E0B' }}>
                      <Pill size={20} /> <span style={{ fontFamily: 'Sora', fontWeight: '600', fontSize: '16px', color: '#0F172A' }}>Prescription Summary</span>
                      <span style={{ fontSize: '13px', color: '#64748B', marginLeft: 'auto' }}>{aiResult.extractedData.doctor} · {aiResult.extractedData.date}</span>
                    </div>
                    <div className="preview-section">
                      <div className="preview-section-title">Extracted Medications</div>
                      {aiResult.extractedData.medications.map((med, i) => (
                        <div key={i} className="med-extract-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <Pill size={16} color="#F59E0B" />
                            <span style={{ fontWeight: '600', fontSize: '15px' }}>{med.name}</span>
                            <span style={{ color: '#94A3B8', fontSize: '13px' }}>{med.generic}</span>
                          </div>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            {med.dosage} · {med.frequency} · {med.duration}<br/>
                            <span style={{ color: '#64748B' }}>Instructions: {med.instructions}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="preview-section">
                      <div className="preview-section-title">Diagnosis / Indication</div>
                      <div style={{ padding: '12px 16px', background: '#F8FBFF', borderRadius: '10px', border: '1px solid #E0F2FE', fontSize: '14px' }}>{aiResult.extractedData.diagnosis}</div>
                    </div>
                    <div className="ai-summary-box">
                      <div className="ai-summary-label"><Sparkles size={14} /> Doctor's Notes (AI Readable)</div>
                      {aiResult.extractedData.doctorNotes}
                      <div style={{ marginTop: '8px', fontSize: '11px', color: '#94A3B8' }}>✦ Handwriting interpreted by AI</div>
                    </div>
                  </>
                )}

                {/* LAB REPORT VARIANT */}
                {aiResult.type === 'lab' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                      <FileText size={20} color="#10B981" />
                      <span style={{ fontFamily: 'Sora', fontWeight: '600', fontSize: '16px', color: '#0F172A' }}>Lab Report Summary</span>
                      <span style={{ fontSize: '13px', color: '#64748B', marginLeft: 'auto' }}>{aiResult.extractedData.subType} · {aiResult.extractedData.date}</span>
                    </div>
                    <div className="preview-section">
                      <div className="preview-section-title">Extracted Results</div>
                      <table className="lab-results-table">
                        <thead><tr><th>Test</th><th>Result</th><th>Ref Range</th><th>Status</th></tr></thead>
                        <tbody>
                          {aiResult.extractedData.results.map((r, i) => (
                            <tr key={i} className={r.status !== 'Normal' ? (r.status === 'Low' || r.status === 'High' ? 'row-abnormal' : 'row-borderline') : ''}>
                              <td style={{ fontWeight: '500' }}>{r.name}</td>
                              <td style={{ fontWeight: '700' }}>{r.value} <span style={{ color: '#94A3B8', fontWeight: '400' }}>{r.unit}</span></td>
                              <td style={{ color: '#64748B' }}>{r.range}</td>
                              <td style={{ fontWeight: '600', color: r.status === 'Normal' ? '#10B981' : r.status === 'Low' || r.status === 'High' ? '#EF4444' : '#F59E0B' }}>
                                {r.status === 'Normal' ? '✓' : '⚠'} {r.status}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="ai-summary-box">
                      <div className="ai-summary-label"><Sparkles size={14} /> AI Summary</div>
                      {aiResult.extractedData.aiSummary}
                    </div>
                  </>
                )}

                {/* SCAN VARIANT */}
                {aiResult.type === 'scan' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                      <Activity size={20} color="#8B5CF6" />
                      <span style={{ fontFamily: 'Sora', fontWeight: '600', fontSize: '16px', color: '#0F172A' }}>Scan Preview</span>
                      <span style={{ fontSize: '13px', color: '#64748B', marginLeft: 'auto' }}>{aiResult.extractedData.subType} · {aiResult.extractedData.date}</span>
                    </div>
                    <div className="scan-image-placeholder" style={{ padding: formData.originalFile?.url ? '0' : '20px', background: formData.originalFile?.url ? 'transparent' : '#F1F5F9', marginBottom: '20px' }}>
                      {formData.originalFile?.url ? (
                        <div style={{ height: '240px', width: '100%', background: '#E2E8F0', borderRadius: '12px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
                          <img src={formData.originalFile.url} alt="scan preview" style={{ height: '100%', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <><Activity size={32} style={{ opacity: 0.4, marginRight: '8px' }} /> Scan Image Placeholder</>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>{aiResult.extractedData.subType} ({aiResult.extractedData.view})</div>
                    <div className="preview-section">
                      <div className="preview-section-title">Extracted Findings</div>
                      <div style={{ padding: '16px', background: '#F8FBFF', borderRadius: '12px', border: '1px solid #E0F2FE' }}>
                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                          {aiResult.extractedData.findings.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    </div>
                    <div className="ai-summary-box" style={{ marginBottom: '20px' }}>
                      <div className="ai-summary-label"><Sparkles size={14} /> Impression</div>
                      {aiResult.extractedData.impression}
                    </div>
                    {aiResult.extractedData.groupInfo && (
                      <div className="grouping-preview">
                        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>{aiResult.extractedData.groupInfo.label} History</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #8B5CF6' }} />
                            {aiResult.extractedData.groupInfo.prevDate}
                          </div>
                          <div style={{ flex: 1, height: '2px', background: '#8B5CF6' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600' }}>
                            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8B5CF6' }} />
                            {aiResult.extractedData.date} (new)
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>This scan will be added to your {aiResult.extractedData.groupInfo.label} group</div>
                      </div>
                    )}
                  </>
                )}

                <div className="modal-footer" style={{ padding: '24px 0 0', borderTop: 'none' }}>
                  <button className="btn-back" onClick={() => setStep(2)}><ArrowLeft size={16} /> Back</button>
                  <button className="btn-next" onClick={() => setStep(4)}>Confirm & Add →</button>
                </div>
              </motion.div>
            )}

            {/* ======= STEP 4: CONFIRMATION ======= */}
            {step === 4 && (
              <motion.div key="step4" className="modal-step" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}>
                <div className="confirm-summary">
                  <div className="confirm-icon"><CheckCircle size={56} color="#10B981" /></div>
                  <div className="confirm-type" style={{ textTransform: 'capitalize' }}>{formData.type === 'prescription' ? 'Prescription' : formData.type === 'lab' ? 'Lab Report' : 'Scan'} — {formData.subType}</div>
                  <div className="confirm-detail">{formData.date}</div>
                  <div className="confirm-detail">{formData.doctor} · {formData.facility}</div>
                  <div className="confirm-placement">
                    <strong>Will be added to:</strong><br/>
                    {new Date(formData.date).toLocaleString('default', { month: 'long', year: 'numeric' })} in your Health Timeline
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '0 0 0', borderTop: 'none', justifyContent: 'center', gap: '16px' }}>
                  <button className="btn-back" onClick={onClose} disabled={isUploading}>Cancel</button>
                  <button className="btn-next" onClick={handleAddToTimeline} disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isUploading ? <><Loader size={16} className="spin" /> Uploading...</> : 'Add to Timeline'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddRecordModal;
