import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, Clock, Moon, Sun } from 'lucide-react';
import { logVital } from '../../services/api';

// ── VITAL TYPE CONFIG ──
const VITAL_TYPES = [
  { id: 'blood_pressure', icon: '🫀', label: 'Blood Pressure', color: '#EF4444' },
  { id: 'blood_glucose', icon: '🩸', label: 'Blood Glucose', color: '#F59E0B' },
  { id: 'weight', icon: '⚖️', label: 'Weight', color: '#8B5CF6' },
  { id: 'heart_rate', icon: '💓', label: 'Heart Rate', color: '#EC4899' },
  { id: 'spo2', icon: '🫁', label: 'SpO2', color: '#0EA5E9' },
  { id: 'sleep', icon: '🌙', label: 'Sleep', color: '#6366F1' },
  { id: 'activity', icon: '🏃', label: 'Activity', color: '#10B981' },
  { id: 'calories', icon: '🔥', label: 'Calories', color: '#F97316' },
  { id: 'stress_score', icon: '🧠', label: 'Stress Score', color: '#7C3AED' },
];

// ── CLINICAL CATEGORIZATION (mirrors backend) ──
function categorizeBP(sys, dia) {
  if (!sys || !dia) return null;
  if (sys >= 180 || dia >= 120) return { label: 'Hypertensive Crisis', cls: 'cat-high' };
  if (sys >= 140 || dia >= 90) return { label: 'Stage 2 Hypertension', cls: 'cat-high' };
  if (sys >= 130 || dia >= 80) return { label: 'Stage 1 Hypertension', cls: 'cat-elevated' };
  if (sys >= 120 && dia < 80) return { label: 'Elevated', cls: 'cat-elevated' };
  return { label: 'Normal', cls: 'cat-normal' };
}

function categorizeGlucose(val, when) {
  if (!val) return null;
  if (when === 'fasting') {
    if (val < 70) return { label: 'Low', cls: 'cat-low' };
    if (val <= 99) return { label: 'Normal', cls: 'cat-normal' };
    if (val <= 125) return { label: 'Pre-diabetes', cls: 'cat-elevated' };
    return { label: 'Diabetes Range', cls: 'cat-high' };
  }
  if (val < 70) return { label: 'Low', cls: 'cat-low' };
  if (val <= 140) return { label: 'Normal', cls: 'cat-normal' };
  if (val <= 199) return { label: 'Pre-diabetes', cls: 'cat-elevated' };
  return { label: 'Diabetes Range', cls: 'cat-high' };
}

function categorizeHR(bpm) {
  if (!bpm) return null;
  if (bpm < 60) return { label: 'Bradycardia', cls: 'cat-low' };
  if (bpm <= 100) return { label: 'Normal', cls: 'cat-normal' };
  if (bpm <= 120) return { label: 'Elevated', cls: 'cat-elevated' };
  return { label: 'Tachycardia', cls: 'cat-high' };
}

function categorizeSpO2(val) {
  if (!val) return null;
  if (val >= 95) return { label: 'Normal', cls: 'cat-normal' };
  if (val >= 90) return { label: 'Mild Hypoxemia', cls: 'cat-elevated' };
  return { label: 'Low Oxygen', cls: 'cat-high' };
}

function categorizeWeight(kg, heightCm = 175) {
  if (!kg) return null;
  const bmi = (kg / ((heightCm / 100) ** 2)).toFixed(1);
  if (bmi < 18.5) return { label: `Underweight (BMI ${bmi})`, cls: 'cat-low' };
  if (bmi < 25) return { label: `Normal (BMI ${bmi})`, cls: 'cat-normal' };
  if (bmi < 30) return { label: `Overweight (BMI ${bmi})`, cls: 'cat-elevated' };
  return { label: `Obese (BMI ${bmi})`, cls: 'cat-high' };
}

// ── COMPONENT ──
const AddVitalModal = ({ isOpen, onClose, onVitalAdded, presetType = null }) => {
  const [step, setStep] = useState(presetType ? 2 : 1);
  const [selectedType, setSelectedType] = useState(presetType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({});
  const [weightUnit, setWeightUnit] = useState('kg');

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleTypeSelect = (typeId) => {
    setSelectedType(typeId);
    setFormData({});
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2 && !presetType) {
      setStep(1);
      setSelectedType(null);
    } else {
      onClose();
    }
  };

  // Compute category preview
  const categoryPreview = useMemo(() => {
    if (!selectedType) return null;
    switch (selectedType) {
      case 'blood_pressure':
        return categorizeBP(Number(formData.systolic), Number(formData.diastolic));
      case 'blood_glucose':
        return categorizeGlucose(Number(formData.glucoseValue), formData.measuredWhen || 'random');
      case 'heart_rate':
        return categorizeHR(Number(formData.bpm));
      case 'spo2':
        return categorizeSpO2(Number(formData.spo2Value));
      case 'weight': {
        const kg = weightUnit === 'lbs' ? Number(formData.weightValue) * 0.453592 : Number(formData.weightValue);
        return categorizeWeight(kg);
      }
      case 'sleep': {
        if (!formData.bedtime || !formData.wakeTime) return null;
        const dur = computeSleepDuration(formData.bedtime, formData.wakeTime);
        if (dur <= 0) return null;
        const hrs = dur / 60;
        if (hrs >= 7 && (formData.sleepQuality === 'good' || formData.sleepQuality === 'excellent')) return { label: 'Excellent Sleep', cls: 'cat-normal' };
        if (hrs >= 6) return { label: 'Fair Sleep', cls: 'cat-elevated' };
        return { label: 'Poor Sleep', cls: 'cat-high' };
      }
      case 'activity': {
        const steps = Number(formData.steps);
        if (!steps) return null;
        if (steps >= 10000) return { label: 'Very Active', cls: 'cat-normal' };
        if (steps >= 7500) return { label: 'Active', cls: 'cat-normal' };
        if (steps >= 5000) return { label: 'Low Active', cls: 'cat-elevated' };
        return { label: 'Sedentary', cls: 'cat-high' };
      }
      case 'calories': {
        const net = Number(formData.intake || 0) - Number(formData.burned || 0);
        if (!formData.intake && !formData.burned) return null;
        if (net > 300) return { label: 'Surplus', cls: 'cat-elevated' };
        if (net < -300) return { label: 'Deficit', cls: 'cat-low' };
        return { label: 'Balanced', cls: 'cat-normal' };
      }
      case 'stress_score':
        return { label: 'Auto-computed from your latest sleep, HR & activity', cls: 'cat-default' };
      default:
        return null;
    }
  }, [selectedType, formData, weightUnit]);

  // Submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let payload = { vitalType: selectedType, recordedAt: new Date().toISOString() };

      switch (selectedType) {
        case 'blood_pressure':
          payload.data = {
            systolic: Number(formData.systolic),
            diastolic: Number(formData.diastolic),
            pulse: formData.pulse ? Number(formData.pulse) : undefined,
          };
          break;
        case 'blood_glucose':
          payload.data = {
            value: Number(formData.glucoseValue),
            measuredWhen: formData.measuredWhen || 'random',
          };
          break;
        case 'weight':
          payload.data = {
            value: weightUnit === 'lbs' ? +(Number(formData.weightValue) * 0.453592).toFixed(1) : Number(formData.weightValue),
          };
          break;
        case 'heart_rate':
          payload.data = {
            bpm: Number(formData.bpm),
            context: formData.hrContext || 'resting',
          };
          break;
        case 'spo2':
          payload.data = { value: Number(formData.spo2Value) };
          break;
        case 'sleep': {
          const dur = computeSleepDuration(formData.bedtime, formData.wakeTime);
          payload.data = {
            bedtime: new Date(formData.bedtime).toISOString(),
            wakeTime: new Date(formData.wakeTime).toISOString(),
            durationMinutes: dur,
            quality: formData.sleepQuality || 'fair',
          };
          break;
        }
        case 'activity':
          payload.data = {
            steps: Number(formData.steps || 0),
            activeMinutes: Number(formData.activeMinutes || 0),
            distanceKm: Number(formData.distanceKm || 0),
          };
          break;
        case 'calories':
          payload.data = {
            intake: Number(formData.intake || 0),
            burned: Number(formData.burned || 0),
          };
          break;
        case 'stress_score':
          // Server computes it
          break;
      }

      await logVital(payload);
      onVitalAdded?.();
      onClose();
    } catch (err) {
      console.error('Failed to log vital:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const typeConfig = VITAL_TYPES.find(t => t.id === selectedType);

  return (
    <AnimatePresence>
      <motion.div
        className="add-vital-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="add-vital-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>

          {/* STEP 1: Type Selector */}
          {step === 1 && (
            <div className="modal-step">
              <h2 className="step-title">Log a Vital</h2>
              <p className="step-subtitle">What would you like to record?</p>
              <div className="vital-type-grid">
                {VITAL_TYPES.map(t => (
                  <button
                    key={t.id}
                    className="vital-type-btn"
                    onClick={() => handleTypeSelect(t.id)}
                  >
                    <span className="type-icon">{t.icon}</span>
                    <span className="type-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Type-Specific Form */}
          {step === 2 && selectedType && (
            <div className="modal-step">
              <h2 className="step-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px' }}>{typeConfig?.icon}</span> {typeConfig?.label}
              </h2>
              <p className="step-subtitle">Enter your reading below</p>

              <div className="vital-form">
                {renderForm(selectedType, formData, updateField, weightUnit, setWeightUnit)}

                {/* Category Preview */}
                {categoryPreview && (
                  <div className={`category-preview ${categoryPreview.cls}`}>
                    <span>📋</span> {categoryPreview.label}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {step === 2 && (
            <div className="modal-footer">
              <button className="btn-back" onClick={handleBack}>
                <ChevronLeft size={16} /> Back
              </button>
              <button
                className="btn-next"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
              >
                {isSubmitting ? 'Saving...' : selectedType === 'stress_score' ? 'Compute & Save' : 'Save Reading'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── SLEEP DURATION HELPER ──
function computeSleepDuration(bedtime, wakeTime) {
  if (!bedtime || !wakeTime) return 0;
  const bed = new Date(bedtime);
  let wake = new Date(wakeTime);
  if (wake <= bed) wake.setDate(wake.getDate() + 1);
  return Math.round((wake - bed) / 60000);
}

function formatDuration(mins) {
  if (mins <= 0) return '--';
  const hrs = Math.floor(mins / 60);
  const m = mins % 60;
  return `${hrs}h ${m}m`;
}

// ── TYPE-SPECIFIC FORMS ──
function renderForm(type, data, update, weightUnit, setWeightUnit) {
  switch (type) {
    case 'blood_pressure':
      return (
        <>
          <div className="vital-form-row">
            <div className="vital-form-field">
              <label className="vital-form-label">Systolic (mmHg)</label>
              <input
                className="vital-form-input"
                type="number"
                placeholder="120"
                min="60" max="250"
                value={data.systolic || ''}
                onChange={e => update('systolic', e.target.value)}
                autoFocus
              />
            </div>
            <div className="vital-form-field">
              <label className="vital-form-label">Diastolic (mmHg)</label>
              <input
                className="vital-form-input"
                type="number"
                placeholder="80"
                min="40" max="180"
                value={data.diastolic || ''}
                onChange={e => update('diastolic', e.target.value)}
              />
            </div>
          </div>
          <div className="vital-form-field">
            <label className="vital-form-label">Pulse (bpm) — optional</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="72"
              min="30" max="220"
              value={data.pulse || ''}
              onChange={e => update('pulse', e.target.value)}
            />
          </div>
        </>
      );

    case 'blood_glucose':
      return (
        <>
          <div className="vital-form-field">
            <label className="vital-form-label">Glucose (mg/dL)</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="100"
              min="20" max="600"
              value={data.glucoseValue || ''}
              onChange={e => update('glucoseValue', e.target.value)}
              autoFocus
            />
          </div>
          <div className="vital-form-field">
            <label className="vital-form-label">Meal Context</label>
            <select
              className="vital-form-select"
              value={data.measuredWhen || 'random'}
              onChange={e => update('measuredWhen', e.target.value)}
            >
              <option value="fasting">Fasting (before eating)</option>
              <option value="post_meal">Post-Meal (2 hrs after food)</option>
              <option value="random">Random</option>
              <option value="bedtime">Bedtime</option>
            </select>
          </div>
        </>
      );

    case 'weight':
      return (
        <>
          <div className="vital-form-field">
            <label className="vital-form-label">Weight</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder={weightUnit === 'kg' ? '72' : '158'}
              min="20" max={weightUnit === 'kg' ? 300 : 660}
              step="0.1"
              value={data.weightValue || ''}
              onChange={e => update('weightValue', e.target.value)}
              autoFocus
            />
            <div className="unit-toggle">
              <button className={`unit-toggle-btn ${weightUnit === 'kg' ? 'active' : ''}`} onClick={() => setWeightUnit('kg')}>kg</button>
              <button className={`unit-toggle-btn ${weightUnit === 'lbs' ? 'active' : ''}`} onClick={() => setWeightUnit('lbs')}>lbs</button>
            </div>
          </div>
          {data.weightValue && (
            <div className="bmi-display">
              BMI: <strong>{((weightUnit === 'lbs' ? Number(data.weightValue) * 0.453592 : Number(data.weightValue)) / (1.75 * 1.75)).toFixed(1)}</strong>
              <span style={{ color: '#94A3B8', marginLeft: '4px' }}>kg/m²</span>
            </div>
          )}
        </>
      );

    case 'heart_rate':
      return (
        <>
          <div className="vital-form-field">
            <label className="vital-form-label">Heart Rate (bpm)</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="72"
              min="30" max="220"
              value={data.bpm || ''}
              onChange={e => update('bpm', e.target.value)}
              autoFocus
            />
          </div>
          <div className="vital-form-field">
            <label className="vital-form-label">Context</label>
            <select
              className="vital-form-select"
              value={data.hrContext || 'resting'}
              onChange={e => update('hrContext', e.target.value)}
            >
              <option value="resting">Resting</option>
              <option value="active">Active</option>
              <option value="post_exercise">Post-Exercise</option>
            </select>
          </div>
        </>
      );

    case 'spo2':
      return (
        <div className="vital-form-field">
          <label className="vital-form-label">Blood Oxygen (%)</label>
          <input
            className="vital-form-input"
            type="number"
            placeholder="98"
            min="70" max="100"
            value={data.spo2Value || ''}
            onChange={e => update('spo2Value', e.target.value)}
            autoFocus
          />
        </div>
      );

    case 'sleep':
      return (
        <>
          <div className="vital-form-row">
            <div className="vital-form-field">
              <label className="vital-form-label">Bedtime</label>
              <input
                className="vital-form-input"
                type="datetime-local"
                value={data.bedtime || ''}
                onChange={e => update('bedtime', e.target.value)}
              />
            </div>
            <div className="vital-form-field">
              <label className="vital-form-label">Wake Time</label>
              <input
                className="vital-form-input"
                type="datetime-local"
                value={data.wakeTime || ''}
                onChange={e => update('wakeTime', e.target.value)}
              />
            </div>
          </div>
          {data.bedtime && data.wakeTime && (
            <div className="duration-display">
              <Clock size={16} /> Duration: {formatDuration(computeSleepDuration(data.bedtime, data.wakeTime))}
            </div>
          )}
          <div className="vital-form-field">
            <label className="vital-form-label">Sleep Quality</label>
            <select
              className="vital-form-select"
              value={data.sleepQuality || 'fair'}
              onChange={e => update('sleepQuality', e.target.value)}
            >
              <option value="poor">Poor</option>
              <option value="fair">Fair</option>
              <option value="good">Good</option>
              <option value="excellent">Excellent</option>
            </select>
          </div>
        </>
      );

    case 'activity':
      return (
        <>
          <div className="vital-form-field">
            <label className="vital-form-label">Steps</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="8000"
              min="0" max="100000"
              value={data.steps || ''}
              onChange={e => update('steps', e.target.value)}
              autoFocus
            />
          </div>
          <div className="vital-form-row">
            <div className="vital-form-field">
              <label className="vital-form-label">Active Minutes</label>
              <input
                className="vital-form-input"
                type="number"
                placeholder="45"
                min="0" max="1440"
                value={data.activeMinutes || ''}
                onChange={e => update('activeMinutes', e.target.value)}
              />
            </div>
            <div className="vital-form-field">
              <label className="vital-form-label">Distance (km)</label>
              <input
                className="vital-form-input"
                type="number"
                placeholder="5.2"
                min="0" max="100"
                step="0.1"
                value={data.distanceKm || ''}
                onChange={e => update('distanceKm', e.target.value)}
              />
            </div>
          </div>
        </>
      );

    case 'calories':
      return (
        <div className="vital-form-row">
          <div className="vital-form-field">
            <label className="vital-form-label">Calories Consumed (kcal)</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="2000"
              min="0" max="10000"
              value={data.intake || ''}
              onChange={e => update('intake', e.target.value)}
              autoFocus
            />
          </div>
          <div className="vital-form-field">
            <label className="vital-form-label">Calories Burned (kcal)</label>
            <input
              className="vital-form-input"
              type="number"
              placeholder="2200"
              min="0" max="10000"
              value={data.burned || ''}
              onChange={e => update('burned', e.target.value)}
            />
          </div>
        </div>
      );

    case 'stress_score':
      return (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748B', fontSize: '14px', lineHeight: '1.6' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🧠</span>
          <p><strong>Stress score is auto-computed</strong></p>
          <p style={{ maxWidth: '340px', margin: '8px auto 0' }}>
            It's calculated from your latest sleep quality, resting heart rate, and activity data. Just hit save!
          </p>
        </div>
      );

    default:
      return null;
  }
}

export default AddVitalModal;
export { VITAL_TYPES };
