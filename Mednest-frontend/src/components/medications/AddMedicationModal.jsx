import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { addMedication, fetchDrugInfo } from '../../services/api';

const FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'other'];
const UNITS = ['mg', 'mcg', 'ml', 'units'];

const AddMedicationModal = ({ isOpen, onClose, onMedicationAdded }) => {
  const [step, setStep] = useState(1);

  // Step 1
  const [medName, setMedName] = useState('');
  const [drugInfoData, setDrugInfoData] = useState(null);
  const [drugInfoLoading, setDrugInfoLoading] = useState(false);
  const debounceRef = useRef(null);

  // Step 2
  const [genericName, setGenericName] = useState('');
  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [form, setForm] = useState('tablet');
  const [timesPerDay, setTimesPerDay] = useState(1);
  const [specificTimes, setSpecificTimes] = useState(['08:00']);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(true);
  const [prescribedBy, setPrescribedBy] = useState('');
  const [indication, setIndication] = useState('');
  const [instructions, setInstructions] = useState('');
  const [caregiverVisible, setCaregiverVisible] = useState(false);
  const [drugClass, setDrugClass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setMedName('');
      setDrugInfoData(null);
      setGenericName('');
      setDosageAmount('');
      setDosageUnit('mg');
      setForm('tablet');
      setTimesPerDay(1);
      setSpecificTimes(['08:00']);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setIsOngoing(true);
      setPrescribedBy('');
      setIndication('');
      setInstructions('');
      setCaregiverVisible(false);
      setDrugClass('');
    }
  }, [isOpen]);

  // Debounced drug info lookup
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (medName.length < 3) {
      setDrugInfoData(null);
      return;
    }
    setDrugInfoLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetchDrugInfo(medName);
        setDrugInfoData(res.data.drugInfo);
      } catch {
        setDrugInfoData(null);
      } finally {
        setDrugInfoLoading(false);
      }
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [medName]);

  // Update time pickers when timesPerDay changes
  useEffect(() => {
    const defaults = ['08:00', '14:00', '20:00', '06:00'];
    setSpecificTimes(prev => {
      const arr = [...prev];
      while (arr.length < timesPerDay) arr.push(defaults[arr.length] || '12:00');
      return arr.slice(0, timesPerDay);
    });
  }, [timesPerDay]);

  const handleSubmit = async () => {
    if (!medName || !dosageAmount) return;
    setSubmitting(true);
    try {
      await addMedication({
        name: medName,
        genericName: genericName || null,
        drugClass: drugClass || null,
        dosage: `${dosageAmount}${dosageUnit}`,
        form,
        frequency: {
          timesPerDay,
          specificTimes,
          daysOfWeek: [],
          instructions: instructions || null,
        },
        startDate: startDate || null,
        endDate: isOngoing ? null : (endDate || null),
        prescribedBy: prescribedBy || null,
        indication: indication || null,
        caregiverVisible,
        drugInfo: drugInfoData || {},
      });
      onMedicationAdded?.(medName);
      onClose();
    } catch (err) {
      console.error('Failed to add medication:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="add-med-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="add-med-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">
              {step === 1 ? 'Add Medication' : 'Medication Details'}
            </h2>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className={`step-dot ${step === 1 ? 'active' : ''}`} />
            <div className={`step-dot ${step === 2 ? 'active' : ''}`} />
          </div>

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="med-form-field">
                <label className="med-form-label">Medication Name</label>
                <input
                  type="text"
                  className="med-form-input"
                  placeholder="e.g. Amlodipine, Metformin..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Drug info loading */}
              {drugInfoLoading && (
                <div className="drug-info-loading">
                  <div className="drug-info-spinner" />
                  Looking up drug information...
                </div>
              )}

              {/* Drug info preview */}
              {drugInfoData && !drugInfoLoading && (
                <motion.div
                  className="drug-info-preview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h4>
                    <Sparkles size={16} />
                    AI Drug Information
                  </h4>
                  {drugInfoData.use && (
                    <div className="drug-info-preview-row">
                      <div className="drug-info-preview-label">Use</div>
                      <div className="drug-info-preview-value">{drugInfoData.use}</div>
                    </div>
                  )}
                  {drugInfoData.sideEffects && (
                    <div className="drug-info-preview-row">
                      <div className="drug-info-preview-label">Side Effects</div>
                      <div className="drug-info-preview-value">{drugInfoData.sideEffects}</div>
                    </div>
                  )}
                  {drugInfoData.warnings && (
                    <div className="drug-info-preview-row">
                      <div className="drug-info-preview-label">Warnings</div>
                      <div className="drug-info-preview-value">{drugInfoData.warnings}</div>
                    </div>
                  )}
                  {drugInfoData.commonInteractions && (
                    <div className="drug-info-preview-row">
                      <div className="drug-info-preview-label">Interactions</div>
                      <div className="drug-info-preview-value">{drugInfoData.commonInteractions}</div>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="modal-footer">
                <button className="btn-modal-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-modal-primary"
                  disabled={!medName.trim()}
                  onClick={() => setStep(2)}
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="med-form">
                {/* Generic Name & Drug Class */}
                <div className="med-form-row">
                  <div className="med-form-field">
                    <label className="med-form-label">Generic Name</label>
                    <input
                      type="text"
                      className="med-form-input"
                      placeholder="e.g. Amlodipine Besylate"
                      value={genericName}
                      onChange={(e) => setGenericName(e.target.value)}
                    />
                  </div>
                  <div className="med-form-field">
                    <label className="med-form-label">Drug Class</label>
                    <input
                      type="text"
                      className="med-form-input"
                      placeholder="e.g. Antihypertensive"
                      value={drugClass}
                      onChange={(e) => setDrugClass(e.target.value)}
                    />
                  </div>
                </div>

                {/* Dosage & Form */}
                <div className="med-form-row">
                  <div className="med-form-field">
                    <label className="med-form-label">Dosage</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        className="med-form-input"
                        placeholder="5"
                        value={dosageAmount}
                        onChange={(e) => setDosageAmount(e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <select
                        className="med-form-select"
                        value={dosageUnit}
                        onChange={(e) => setDosageUnit(e.target.value)}
                        style={{ width: '80px' }}
                      >
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="med-form-field">
                    <label className="med-form-label">Form</label>
                    <div className="form-pill-group">
                      {FORMS.map(f => (
                        <button
                          key={f}
                          className={`form-pill ${form === f ? 'selected' : ''}`}
                          onClick={() => setForm(f)}
                          type="button"
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Frequency */}
                <div className="med-form-field">
                  <label className="med-form-label">Frequency</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="med-form-select"
                      value={timesPerDay}
                      onChange={(e) => setTimesPerDay(parseInt(e.target.value))}
                      style={{ width: '160px' }}
                    >
                      <option value={1}>Once daily</option>
                      <option value={2}>Twice daily</option>
                      <option value={3}>Three times daily</option>
                      <option value={4}>Four times daily</option>
                    </select>
                    <span style={{ fontSize: '13px', color: '#64748B' }}>at</span>
                    {specificTimes.map((t, i) => (
                      <input
                        key={i}
                        type="time"
                        className="med-form-input"
                        value={t}
                        onChange={(e) => {
                          const arr = [...specificTimes];
                          arr[i] = e.target.value;
                          setSpecificTimes(arr);
                        }}
                        style={{ width: '110px' }}
                      />
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="med-form-row">
                  <div className="med-form-field">
                    <label className="med-form-label">Start Date</label>
                    <input
                      type="date"
                      className="med-form-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="med-form-field">
                    <div className="toggle-row" style={{ marginBottom: '5px' }}>
                      <label className="med-form-label">End Date</label>
                      <label className="toggle-switch" style={{ transform: 'scale(0.8)' }}>
                        <input
                          type="checkbox"
                          checked={isOngoing}
                          onChange={(e) => setIsOngoing(e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>Ongoing</span>
                    </div>
                    {!isOngoing && (
                      <input
                        type="date"
                        className="med-form-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    )}
                  </div>
                </div>

                {/* Prescribed by & Indication */}
                <div className="med-form-row">
                  <div className="med-form-field">
                    <label className="med-form-label">Prescribed By</label>
                    <input
                      type="text"
                      className="med-form-input"
                      placeholder="Dr. Name"
                      value={prescribedBy}
                      onChange={(e) => setPrescribedBy(e.target.value)}
                    />
                  </div>
                  <div className="med-form-field">
                    <label className="med-form-label">Indication</label>
                    <input
                      type="text"
                      className="med-form-input"
                      placeholder="What it's prescribed for"
                      value={indication}
                      onChange={(e) => setIndication(e.target.value)}
                    />
                  </div>
                </div>

                {/* Instructions */}
                <div className="med-form-field">
                  <label className="med-form-label">Instructions</label>
                  <textarea
                    className="med-form-textarea"
                    placeholder="e.g. Take after meals, avoid grapefruit..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                  />
                </div>

                {/* Toggles */}
                <div className="toggle-row">
                  <span className="toggle-label">Visible to Caregiver</span>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={caregiverVisible}
                      onChange={(e) => setCaregiverVisible(e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-modal-secondary" onClick={() => setStep(1)}>
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  className="btn-modal-primary"
                  disabled={submitting || !dosageAmount}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Adding...' : `Add ${medName}`}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddMedicationModal;
