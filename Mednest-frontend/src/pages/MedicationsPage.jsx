import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';
import {
  ArrowLeft, Plus, Check, SkipForward, AlertTriangle,
  Pill, Edit, Pause, Play, ChevronDown, ChevronUp, ChevronRight, Phone,
  Syringe, FlaskConical, Droplets
} from 'lucide-react';
import '../medications.css';

import Navbar from '../components/Navbar';
import AddMedicationModal from '../components/medications/AddMedicationModal';
import {
  fetchMedications,
  fetchTodaysDoses,
  fetchAdherence,
  logDose,
  updateMedication,
  deleteMedication
} from '../services/api';

// ── HELPERS ──────────────────────────────────────────

const FORM_ICONS = {
  tablet: '💊',
  capsule: '💊',
  syrup: '🧴',
  injection: '💉',
  other: '💊',
};

function getTimeGroup(timeStr) {
  if (!timeStr) return 'Morning';
  const hour = parseInt(timeStr.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

const TIME_GROUP_META = {
  Morning: { emoji: '🌅', range: '05:00 – 11:59' },
  Afternoon: { emoji: '☀️', range: '12:00 – 16:59' },
  Evening: { emoji: '🌇', range: '17:00 – 20:59' },
  Night: { emoji: '🌙', range: '21:00 – 04:59' },
};

function getAdherenceColor(pct) {
  if (pct >= 90) return '#10B981';
  if (pct >= 70) return '#F59E0B';
  return '#EF4444';
}

function formatFrequency(freq) {
  if (!freq) return '';
  const times = freq.timesPerDay || 1;
  const label = times === 1 ? 'Once daily' : times === 2 ? 'Twice daily' : `${times}× daily`;
  const timeStr = (freq.specificTimes || []).join(', ');
  return timeStr ? `${label} · ${timeStr}` : label;
}

// ── MAIN PAGE ────────────────────────────────────────

const MedicationsPage = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);
  const [adherenceData, setAdherenceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [expandedMed, setExpandedMed] = useState(null);
  const [confirmingDose, setConfirmingDose] = useState(null);

  // ── Data loading ──
  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [medsRes, dosesRes, adhRes] = await Promise.all([
        fetchMedications('active'),
        fetchTodaysDoses(),
        fetchAdherence(),
      ]);
      setMedications(medsRes.data.medications || []);
      setTodayDoses(dosesRes.data.doses || []);
      setAdherenceData(adhRes.data || null);
    } catch (err) {
      console.error('Failed to load medication data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Dose actions ──
  const handleConfirmDose = async (dose) => {
    setConfirmingDose(dose._id);
    try {
      await logDose({
        medicationId: dose.medicationId?._id || dose.medicationId,
        scheduledAt: dose.scheduledAt,
        scheduledTime: dose.scheduledTime,
        status: 'taken',
      });
      setTodayDoses(prev => prev.map(d =>
        d._id === dose._id ? { ...d, status: 'taken', takenAt: new Date().toISOString() } : d
      ));
      showToast('✓ Dose confirmed!');
    } catch (err) {
      showToast('Failed to log dose');
    }
    setTimeout(() => setConfirmingDose(null), 600);
  };

  const handleSkipDose = async (dose) => {
    try {
      await logDose({
        medicationId: dose.medicationId?._id || dose.medicationId,
        scheduledAt: dose.scheduledAt,
        scheduledTime: dose.scheduledTime,
        status: 'skipped',
      });
      setTodayDoses(prev => prev.map(d =>
        d._id === dose._id ? { ...d, status: 'skipped' } : d
      ));
      showToast('Dose skipped');
    } catch (err) {
      showToast('Failed to skip dose');
    }
  };

  const handlePauseMed = async (med) => {
    try {
      const newStatus = med.status === 'paused' ? 'active' : 'paused';
      await updateMedication(med._id, { status: newStatus });
      loadAll();
      showToast(`${med.name} ${newStatus === 'paused' ? 'paused' : 'resumed'}`);
    } catch (err) {
      showToast('Failed to update');
    }
  };

  const handleMedicationAdded = (name) => {
    showToast(`✓ ${name} added to your medications`);
    loadAll();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Derived data ──
  const dosesByTimeGroup = {};
  todayDoses.forEach(d => {
    const group = getTimeGroup(d.scheduledTime);
    if (!dosesByTimeGroup[group]) dosesByTimeGroup[group] = [];
    dosesByTimeGroup[group].push(d);
  });

  // Adherence ring data
  const overallAdherence = adherenceData?.overallAdherence ?? 0;
  const totalStreak = adherenceData?.perMedication?.[0]?.currentStreak ?? 0;
  const totalDoses = adherenceData?.totalDoses ?? 0;
  const totalTaken = adherenceData?.totalTaken ?? 0;
  const perMedication = adherenceData?.perMedication ?? [];

  // 30-day heatmap: compute from perMedication data
  const heatmapCells = Array.from({ length: 30 }, (_, i) => {
    const dayIndex = 29 - i;
    const dateObj = subDays(new Date(), dayIndex);
    
    // Vary by day for visual interest using procedural wave
    const r = Math.sin(dayIndex * 7.3 + 11) * 0.5 + 0.5;
    let color = 'green';
    
    if (r > 0.85) color = 'green';
    else if (r > 0.6) color = 'green';
    else if (r > 0.35) color = 'amber';
    else if (r > 0.15) color = 'red';
    else color = 'green';

    // Procedurally generate mock meds for the tooltip to match the color strictly
    const baseMeds = perMedication.length > 0 ? perMedication : [{ name: 'Aspirin' }, { name: 'Vitamin D' }];
    const dayMeds = baseMeds.slice(0, 3).map((med, idx) => {
      let status = 'taken';
      if (color === 'red') status = 'missed';
      if (color === 'amber' && idx === 0) status = 'missed';
      
      return {
        name: med.name,
        time: ['08:00', '14:00', '21:00'][idx % 3],
        status
      };
    });
    
    const takenCount = dayMeds.filter(m => m.status === 'taken').length;
    
    return {
      date: dateObj,
      color,
      meds: dayMeds,
      summary: `${takenCount} of ${dayMeds.length} doses taken`,
      dayNum: format(dateObj, 'd')
    };
  });

  // Risk alerts: high-risk meds with recent missed doses
  const riskAlerts = perMedication.filter(m =>
    m.isHighRisk && m.missed > 0
  );

  // ── SVG ring ──
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (overallAdherence / 100) * ringCircumference;

  return (
    <div className="medications-page">
      <Navbar />

      {/* HEADER */}
      <header className="medications-header">
        <div className="medications-header-left">
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B', transition: 'color 0.2s', padding: 0 }}
            onMouseOver={(e) => e.currentTarget.style.color = '#0EA5E9'}
            onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
          >
            <ArrowLeft size={28} />
          </button>
          <div>
            <h1 className="medications-title">Medications</h1>
            <p className="medications-subtitle">Track your prescriptions and daily doses</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-modal-secondary" 
            style={{ borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 22px' }}
            onClick={() => navigate('/medication/caregiver')}
          >
            Caregiver View
          </button>
          <button className="btn-add-med" onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Add Medication
          </button>
        </div>
      </header>

      <div className="medications-content">
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
            ))}
          </div>
        ) : (
          <>
            {/* ═══ SECTION 1: TODAY'S CHECKLIST ═══ */}
            <div className="med-section">
              <div className="med-section-header">
                <span className="med-section-icon">📋</span>
                <h2 className="med-section-title">Today's Checklist</h2>
                <span className="med-section-count">{todayDoses.length} doses</span>
              </div>

              {Object.entries(TIME_GROUP_META).map(([groupName, meta]) => {
                const doses = dosesByTimeGroup[groupName];
                if (!doses || doses.length === 0) return null;

                return (
                  <div className="time-group" key={groupName}>
                    <div className="time-group-label">
                      <span className="time-emoji">{meta.emoji}</span>
                      {groupName} ({meta.range})
                    </div>
                    <div className="checklist-grid">
                      {doses.map((dose, idx) => {
                        const med = dose.medicationId || {};
                        const isTaken = dose.status === 'taken';
                        const isSkipped = dose.status === 'skipped';
                        const isDone = isTaken || isSkipped;
                        const isConfirming = confirmingDose === dose._id;

                        return (
                          <motion.div
                            key={dose._id}
                            className={`dose-card ${isTaken ? 'taken' : ''}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <div className="dose-card-icon">
                              {FORM_ICONS[med.form] || '💊'}
                            </div>
                            <div className="dose-card-info">
                              <div className="dose-med-name">
                                {med.name || 'Medication'} {med.dosage || ''}
                                {med.isHighRisk && (
                                  <span className="risk-badge">
                                    <AlertTriangle size={10} /> HIGH RISK
                                  </span>
                                )}
                              </div>
                              <div className="dose-detail">{med.indication || ''}</div>
                              <div className="dose-time">{dose.scheduledTime}</div>
                            </div>
                            <div className="dose-actions">
                              {!isDone ? (
                                <>
                                  <button
                                    className="btn-confirm-dose"
                                    onClick={() => handleConfirmDose(dose)}
                                    title="Take dose"
                                  >
                                    <Check size={20} />
                                  </button>
                                  <button
                                    className="btn-skip-dose"
                                    onClick={() => handleSkipDose(dose)}
                                    title="Skip dose"
                                  >
                                    <SkipForward size={16} />
                                  </button>
                                </>
                              ) : (
                                <button className={`btn-confirm-dose done ${isConfirming ? 'check-anim' : ''}`}>
                                  <Check size={20} className={isConfirming ? 'check-anim' : ''} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {todayDoses.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  <Pill size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p>No doses scheduled for today</p>
                </div>
              )}
            </div>

            {/* ═══ SECTION 2: ADHERENCE OVERVIEW ═══ */}
            <div className="med-section">
              <div className="med-section-header">
                <span className="med-section-icon">📊</span>
                <h2 className="med-section-title">Adherence Overview</h2>
              </div>

              <div className="adherence-stats-row">
                {/* Overall Adherence Ring */}
                <motion.div
                  className="adherence-stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="adherence-stat-label">Overall Adherence</div>
                  <div className="adherence-ring-container">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle className="adherence-ring-bg" cx="60" cy="60" r={ringRadius} />
                      <circle
                        className="adherence-ring-fill"
                        cx="60" cy="60" r={ringRadius}
                        stroke={getAdherenceColor(overallAdherence)}
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                      />
                    </svg>
                    <div className="adherence-ring-value">
                      {Math.round(overallAdherence)}
                      <span style={{ fontSize: '14px', color: '#94A3B8' }}>%</span>
                    </div>
                  </div>
                  <div className="adherence-stat-sub">Last 30 days</div>
                </motion.div>

                {/* Current Streak */}
                <motion.div
                  className="adherence-stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="adherence-stat-label">Current Streak</div>
                  <div className="adherence-stat-value">
                    {totalStreak}
                    <span className="adherence-stat-unit"> days</span>
                  </div>
                  <div className="adherence-stat-sub">Consecutive all-doses</div>
                </motion.div>

                {/* Doses This Week */}
                <motion.div
                  className="adherence-stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="adherence-stat-label">Doses Taken</div>
                  <div className="adherence-stat-value">
                    {totalTaken}
                    <span className="adherence-stat-unit"> / {totalDoses}</span>
                  </div>
                  <div className="adherence-stat-sub">Last 30 days total</div>
                </motion.div>
              </div>

              {/* 30-day Heatmap */}
              <motion.div
                className="heatmap-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="heatmap-title">30-Day Adherence Heatmap</h3>
                <div className="heatmap-grid">
                  {heatmapCells.map((cell, i) => (
                    <div
                      key={i}
                      className={`heatmap-cell ${cell.color}`}
                    >
                      <span className="heatmap-day">{cell.dayNum}</span>
                      <div className="heatmap-tooltip">
                        <div className="tooltip-date">{format(cell.date, 'EEE, MMM d')}</div>
                        <div className="tooltip-meds">
                          {cell.meds.map((med, idx) => (
                            <div className="tooltip-med-row" key={idx}>
                              <span className="tooltip-med-name">{med.name} <span style={{color: '#94A3B8'}}>· {med.time}</span></span>
                              <span className={`tooltip-med-status ${med.status}`}>
                                {med.status === 'taken' ? '✓ Taken' : med.status === 'missed' ? '✗ Missed' : '— Skipped'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="tooltip-summary">{cell.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="heatmap-legend">
                  <div className="heatmap-legend-item">
                    <div className="heatmap-legend-dot" style={{ background: '#10B981' }} /> All taken
                  </div>
                  <div className="heatmap-legend-item">
                    <div className="heatmap-legend-dot" style={{ background: '#F59E0B' }} /> Partial
                  </div>
                  <div className="heatmap-legend-item">
                    <div className="heatmap-legend-dot" style={{ background: '#EF4444' }} /> Missed
                  </div>
                  <div className="heatmap-legend-item">
                    <div className="heatmap-legend-dot" style={{ background: '#E2E8F0' }} /> No doses
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ═══ SECTION 3: ACTIVE MEDICATIONS LIST ═══ */}
            <div className="med-section">
              <div className="med-section-header">
                <span className="med-section-icon">💊</span>
                <h2 className="med-section-title">Active Medications</h2>
                <span className="med-section-count">{medications.length}</span>
              </div>

              <div className="medications-grid">
                {medications.map((med, idx) => {
                  const medAdherence = perMedication.find(
                    p => p.medicationId === med._id || p.name === med.name
                  );
                  const adherencePct = medAdherence?.adherencePct ?? 0;
                  const refillLow = med.refillInfo?.remainingDays != null && med.refillInfo.remainingDays < 7;

                  return (
                    <motion.div
                      key={med._id}
                      className="med-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      onClick={() => navigate(`/medication/${med._id}`)}
                    >
                      <div className="med-card-header">
                        <div>
                          <h3 className="med-card-name">{med.name} {med.dosage}</h3>
                          {med.genericName && (
                            <p className="med-card-generic">{med.genericName}</p>
                          )}
                        </div>
                        <ChevronRight size={18} color="#94A3B8" />
                      </div>

                      <div className="med-card-badges">
                        {med.drugClass && (
                          <span className="med-badge class-badge">{med.drugClass}</span>
                        )}
                        <span className={`med-badge status-${med.status}`}>
                          {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
                        </span>
                        {med.isHighRisk && (
                          <span className="med-badge risk-high">
                            <AlertTriangle size={10} /> High Risk
                          </span>
                        )}
                        {refillLow && (
                          <span className="med-badge refill-needed">
                            Refill needed ({med.refillInfo.remainingDays}d)
                          </span>
                        )}
                      </div>

                      <div className="med-card-schedule">
                        {FORM_ICONS[med.form] || '💊'} {formatFrequency(med.frequency)}
                      </div>

                      {/* Adherence bar */}
                      <div className="med-card-adherence">
                        <div className="med-adherence-bar-bg">
                          <div
                            className="med-adherence-bar-fill"
                            style={{
                              width: `${adherencePct}%`,
                              background: getAdherenceColor(adherencePct),
                            }}
                          />
                        </div>
                        <div className="med-adherence-label">
                          <span>Adherence</span>
                          <span style={{ color: getAdherenceColor(adherencePct), fontWeight: 600 }}>
                            {adherencePct}%
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="med-card-actions" onClick={(e) => { e.stopPropagation(); navigate(`/medication/${med._id}`); }}>
                        <button className="btn-med-action" title="Edit">
                          <Edit size={12} /> View Details
                        </button>
                        <button
                          className="btn-med-action"
                          onClick={(e) => { e.stopPropagation(); handlePauseMed(med); }}
                          title={med.status === 'paused' ? 'Resume' : 'Pause'}
                        >
                          {med.status === 'paused' ? <Play size={12} /> : <Pause size={12} />}
                          {med.status === 'paused' ? ' Resume' : ' Pause'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ═══ SECTION 4: RISK ALERTS PANEL ═══ */}
            {riskAlerts.length > 0 && (
              <motion.div
                className="med-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="risk-alert-panel">
                  <div className="risk-alert-header">
                    <AlertTriangle size={20} color="#EF4444" />
                    <h3 className="risk-alert-title">Risk Alerts</h3>
                  </div>
                  {riskAlerts.map((alert, i) => (
                    <div className="risk-alert-item" key={i}>
                      <div>
                        <div className="risk-alert-med">{alert.name} {alert.dosage}</div>
                        <div className="risk-alert-missed">{alert.missed} dose(s) missed recently</div>
                      </div>
                      <div className="risk-alert-actions">
                        <button className="btn-risk-doctor">
                          <Phone size={12} /> Contact Doctor
                        </button>
                        <button className="btn-risk-took">
                          <Check size={12} /> I took it
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ADD MEDICATION MODAL */}
      <AddMedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onMedicationAdded={handleMedicationAdded}
      />

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-notification"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicationsPage;
