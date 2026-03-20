import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ChevronDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, Tooltip } from 'recharts';
import '../tracking.css';

import Navbar from '../components/Navbar';
import AddVitalModal, { VITAL_TYPES } from '../components/vitals/AddVitalModal';
import { fetchVitalsDashboard } from '../services/api';

// ── VITAL DISPLAY CONFIG ──
const VITAL_CONFIG = {
  blood_pressure: { icon: '🫀', label: 'Blood Pressure', color: '#EF4444', bg: '#FEF2F2', chartType: 'line' },
  blood_glucose: { icon: '🩸', label: 'Blood Glucose', color: '#F59E0B', bg: '#FFFBEB', chartType: 'line' },
  weight: { icon: '⚖️', label: 'Weight', color: '#8B5CF6', bg: '#F5F3FF', chartType: 'line' },
  heart_rate: { icon: '💓', label: 'Heart Rate', color: '#EC4899', bg: '#FDF2F8', chartType: 'line' },
  spo2: { icon: '🫁', label: 'SpO2', color: '#0EA5E9', bg: '#F0F9FF', chartType: 'line' },
  sleep: { icon: '🌙', label: 'Sleep', color: '#6366F1', bg: '#EEF2FF', chartType: 'bar' },
  activity: { icon: '🏃', label: 'Activity', color: '#10B981', bg: '#ECFDF5', chartType: 'bar' },
  calories: { icon: '🔥', label: 'Calories', color: '#F97316', bg: '#FFF7ED', chartType: 'bar' },
};

// Map category to badge class
function badgeClass(category) {
  if (!category) return 'badge-recorded';
  const c = category.toLowerCase();
  if (c.includes('normal') || c.includes('good') || c.includes('excellent') || c.includes('active') || c.includes('balanced')) return 'badge-normal';
  if (c.includes('elevated') || c.includes('stage 1') || c.includes('fair') || c.includes('pre-') || c.includes('surplus') || c.includes('low active')) return 'badge-elevated';
  if (c.includes('stage 2') || c.includes('crisis') || c.includes('diabetes') || c.includes('tachycardia') || c.includes('hypoxemia') || c.includes('poor') || c.includes('sedentary') || c.includes('critical')) return 'badge-high';
  if (c.includes('low') || c.includes('bradycardia') || c.includes('deficit') || c.includes('underweight')) return 'badge-low';
  return 'badge-recorded';
}

// Extract primary value for display
function getLatestDisplay(type, latest) {
  if (!latest) return { value: '--', unit: '' };
  switch (type) {
    case 'blood_pressure':
      return { value: `${latest.bloodPressure?.systolic || '--'}/${latest.bloodPressure?.diastolic || '--'}`, unit: 'mmHg' };
    case 'blood_glucose':
      return { value: latest.bloodGlucose?.value ?? '--', unit: 'mg/dL' };
    case 'weight':
      return { value: latest.weight?.value ?? '--', unit: 'kg' };
    case 'heart_rate':
      return { value: latest.heartRate?.bpm ?? '--', unit: 'bpm' };
    case 'spo2':
      return { value: latest.spo2?.value ?? '--', unit: '%' };
    case 'sleep':
      return { value: latest.sleep?.durationMinutes ? `${(latest.sleep.durationMinutes / 60).toFixed(1)}` : '--', unit: 'hrs' };
    case 'activity':
      return { value: latest.activity?.steps?.toLocaleString() ?? '--', unit: 'steps' };
    case 'calories': {
      const net = (latest.calories?.intake ?? 0) - (latest.calories?.burned ?? 0);
      return { value: net > 0 ? `+${net}` : `${net}`, unit: 'kcal net' };
    }
    default:
      return { value: '--', unit: '' };
  }
}

// Get sparkline data from 7-day entries
function getSparklineData(type, sevenDayData) {
  if (!sevenDayData || sevenDayData.length === 0) return [];
  return sevenDayData.slice().reverse().map((e, i) => {
    let val = 0;
    switch (type) {
      case 'blood_pressure': val = e.bloodPressure?.systolic || 0; break;
      case 'blood_glucose': val = e.bloodGlucose?.value || 0; break;
      case 'weight': val = e.weight?.value || 0; break;
      case 'heart_rate': val = e.heartRate?.bpm || 0; break;
      case 'spo2': val = e.spo2?.value || 0; break;
      case 'sleep': val = (e.sleep?.durationMinutes || 0) / 60; break;
      case 'activity': val = e.activity?.steps || 0; break;
      case 'calories': val = (e.calories?.intake || 0) - (e.calories?.burned || 0); break;
    }
    return { idx: i, value: val };
  });
}

// Get 30-day avg display
function get30DayAvg(type, stats) {
  if (!stats || stats.count === 0) return '--';
  switch (type) {
    case 'blood_pressure':
      return stats.systolic ? `${Math.round(stats.systolic.avg)}/${Math.round(stats.diastolic?.avg || 0)}` : '--';
    case 'blood_glucose':
      return stats.value?.avg ?? '--';
    case 'weight':
      return stats.value?.avg ?? '--';
    case 'heart_rate':
      return stats.bpm?.avg ?? '--';
    case 'spo2':
      return stats.value?.avg ?? '--';
    case 'sleep':
      return stats.durationMinutes?.avg ? `${(stats.durationMinutes.avg / 60).toFixed(1)}h` : '--';
    case 'activity':
      return stats.steps?.avg ? Math.round(stats.steps.avg).toLocaleString() : '--';
    case 'calories': {
      const net = (stats.intake?.avg || 0) - (stats.burned?.avg || 0);
      return net > 0 ? `+${Math.round(net)}` : Math.round(net);
    }
    default:
      return '--';
  }
}

// ── STRESS GAUGE SVG ──
const StressGauge = ({ value = 0, label = '' }) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const angle = (clampedValue / 100) * 180;

  // Color zones
  const getColor = (v) => {
    if (v <= 25) return '#10B981';
    if (v <= 50) return '#F59E0B';
    if (v <= 75) return '#F97316';
    return '#EF4444';
  };

  const gaugeColor = getColor(clampedValue);

  // Arc path for semicircle
  const cx = 110, cy = 110, r = 90;
  const startAngle = Math.PI;
  const endAngle = Math.PI + (angle * Math.PI / 180);

  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const largeArc = angle > 180 ? 1 : 0;

  return (
    <div className="stress-gauge-wrap">
      <svg className="stress-gauge-svg" viewBox="0 0 220 130">
        {/* Background arc */}
        <path
          d={`M 20 110 A 90 90 0 0 1 200 110`}
          fill="none" stroke="#F1F5F9" strokeWidth="14" strokeLinecap="round"
        />
        {/* Color zone arcs */}
        <path d={`M 20 110 A 90 90 0 0 1 ${cx + r * Math.cos(Math.PI + Math.PI * 0.25)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.25)}`}
          fill="none" stroke="#10B981" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        <path d={`M ${cx + r * Math.cos(Math.PI + Math.PI * 0.25)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.25)} A 90 90 0 0 1 ${cx + r * Math.cos(Math.PI + Math.PI * 0.5)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.5)}`}
          fill="none" stroke="#F59E0B" strokeWidth="14" opacity="0.15" />
        <path d={`M ${cx + r * Math.cos(Math.PI + Math.PI * 0.5)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.5)} A 90 90 0 0 1 ${cx + r * Math.cos(Math.PI + Math.PI * 0.75)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.75)}`}
          fill="none" stroke="#F97316" strokeWidth="14" opacity="0.15" />
        <path d={`M ${cx + r * Math.cos(Math.PI + Math.PI * 0.75)} ${cy + r * Math.sin(Math.PI + Math.PI * 0.75)} A 90 90 0 0 1 200 110`}
          fill="none" stroke="#EF4444" strokeWidth="14" strokeLinecap="round" opacity="0.15" />
        {/* Value arc */}
        {clampedValue > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY}`}
            fill="none" stroke={gaugeColor} strokeWidth="14" strokeLinecap="round"
          />
        )}
        {/* Needle dot */}
        <circle cx={endX} cy={endY} r="6" fill={gaugeColor} />
        <circle cx={endX} cy={endY} r="3" fill="#fff" />
      </svg>
      <div className="stress-score-value">{clampedValue}</div>
      <div className="stress-score-label" style={{ color: gaugeColor }}>{label}</div>
    </div>
  );
};

// ── MAIN PAGE COMPONENT ──
const TrackingPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [presetType, setPresetType] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchVitalsDashboard();
      setDashboard(res.data.dashboard);
    } catch (err) {
      console.error('Failed to load vitals dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleAddVital = (typeId = null) => {
    setPresetType(typeId);
    setModalOpen(true);
    setMenuOpen(false);
  };

  const handleVitalAdded = () => {
    setToast('✓ Vital logged successfully');
    setTimeout(() => setToast(null), 3500);
    loadDashboard();
  };

  // Stress data
  const stressData = dashboard?.stress_score;
  const stressLatest = stressData?.latest;
  const stressValue = stressLatest?.stressScore?.value ?? 0;
  const stressCategory = stressLatest?.category ?? 'Unknown';

  // Estimate component contributions for display
  const sleepLatest = dashboard?.sleep?.latest;
  const hrLatest = dashboard?.heart_rate?.latest;
  const activityLatest = dashboard?.activity?.latest;

  const sleepContrib = sleepLatest?.sleep ? Math.min(100, Math.max(0, 100 - (sleepLatest.sleep.durationMinutes / 480) * 100)) : 50;
  const hrContrib = hrLatest?.heartRate ? Math.min(100, Math.max(0, ((hrLatest.heartRate.bpm - 60) / 60) * 100)) : 50;
  const actContrib = activityLatest?.activity ? Math.min(100, Math.max(0, 100 - (activityLatest.activity.steps / 10000) * 100)) : 50;

  const CARD_TYPES = Object.keys(VITAL_CONFIG);

  return (
    <div className="tracking-page">
      <Navbar />

      {/* HEADER */}
      <header className="tracking-header">
        <div className="tracking-header-left">
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B', transition: 'color 0.2s', padding: 0 }}
            onMouseOver={(e) => e.currentTarget.style.color = '#0EA5E9'}
            onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
          >
            <ArrowLeft size={28} />
          </button>
          <div>
            <h1 className="tracking-title">Vitals Tracking</h1>
            <p className="tracking-subtitle">Monitor your daily health metrics</p>
          </div>
        </div>

        {/* Log Vital Dropdown */}
        <div className="log-vital-dropdown">
          <button className="log-vital-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <Plus size={18} /> Log Vital <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="log-vital-menu"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {VITAL_TYPES.map(t => (
                  <button key={t.id} className="log-vital-menu-item" onClick={() => handleAddVital(t.id)}>
                    <span className="item-icon">{t.icon}</span> {t.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* CONTENT */}
      <div className="tracking-content">
        {isLoading ? (
          <>
            <div className="skeleton skeleton-stress" />
            <div className="vitals-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton skeleton-card" />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* STRESS SCORE CARD */}
            <motion.div
              className="stress-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <StressGauge value={stressValue} label={stressCategory} />
              <div className="stress-info">
                <h3>Stress Score</h3>
                <p>Computed from your latest sleep, heart rate, and activity data. Lower is better.</p>
                <div className="stress-components">
                  <div className="stress-component-row">
                    <span className="stress-component-label">🌙 Sleep</span>
                    <div className="stress-component-bar-bg">
                      <div className="stress-component-bar-fill" style={{ width: `${sleepContrib}%`, background: '#6366F1' }} />
                    </div>
                    <span className="stress-component-val">{Math.round(sleepContrib)}%</span>
                  </div>
                  <div className="stress-component-row">
                    <span className="stress-component-label">💓 Heart Rate</span>
                    <div className="stress-component-bar-bg">
                      <div className="stress-component-bar-fill" style={{ width: `${hrContrib}%`, background: '#EC4899' }} />
                    </div>
                    <span className="stress-component-val">{Math.round(hrContrib)}%</span>
                  </div>
                  <div className="stress-component-row">
                    <span className="stress-component-label">🏃 Activity</span>
                    <div className="stress-component-bar-bg">
                      <div className="stress-component-bar-fill" style={{ width: `${actContrib}%`, background: '#10B981' }} />
                    </div>
                    <span className="stress-component-val">{Math.round(actContrib)}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* VITAL CARDS GRID */}
            <div className="vitals-grid">
              {CARD_TYPES.map((type, idx) => {
                const config = VITAL_CONFIG[type];
                const data = dashboard?.[type];
                const latest = data?.latest;
                const display = getLatestDisplay(type, latest);
                const sparkData = getSparklineData(type, data?.sevenDayData);
                const avg30 = get30DayAvg(type, data?.thirtyDayStats);
                const count = data?.thirtyDayStats?.count || 0;

                return (
                  <motion.div
                    key={type}
                    className="vital-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    onClick={() => navigate(`/tracking/${type}`)}
                  >
                    <div className="vital-card-header">
                      <div className="vital-card-icon" style={{ background: config.bg, color: config.color }}>
                        {config.icon}
                      </div>
                      <button
                        className="vital-card-add-btn"
                        onClick={(e) => { e.stopPropagation(); handleAddVital(type); }}
                        title={`Add ${config.label}`}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="vital-card-name">{config.label}</div>
                    <div className="vital-card-value">
                      {display.value}
                      <span className="vital-card-unit"> {display.unit}</span>
                    </div>

                    {latest?.category && (
                      <div className={`vital-card-badge ${badgeClass(latest.category)}`}>
                        {latest.category}
                      </div>
                    )}

                    {/* Sparkline */}
                    <div className="vital-card-sparkline">
                      {sparkData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {config.chartType === 'bar' ? (
                            <BarChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                              <Tooltip
                                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(val) => [val, config.label]}
                                labelFormatter={() => ''}
                              />
                              <Bar dataKey="value" fill={config.color} radius={[3, 3, 0, 0]} opacity={0.7} />
                            </BarChart>
                          ) : (
                            <LineChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                              <Tooltip
                                contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                                formatter={(val) => [typeof val === 'number' ? val.toFixed(1) : val, config.label]}
                                labelFormatter={() => ''}
                              />
                              <Line type="monotone" dataKey="value" stroke={config.color} strokeWidth={2} dot={false} />
                            </LineChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="no-data-text">No recent data</div>
                      )}
                    </div>

                    <div className="vital-card-footer">
                      <span className="vital-card-avg">30d avg: <span>{avg30}</span></span>
                      <span>{count} readings</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ADD VITAL MODAL */}
      <AddVitalModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPresetType(null); }}
        onVitalAdded={handleVitalAdded}
        presetType={presetType}
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

export default TrackingPage;
