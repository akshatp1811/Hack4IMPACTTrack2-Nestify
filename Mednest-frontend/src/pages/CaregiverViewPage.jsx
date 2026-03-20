import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, AlertTriangle, Check, Info } from 'lucide-react';
import { fetchCaregiverView } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const FORM_ICONS = {
  tablet: '💊',
  capsule: '💊',
  syrup: '🥄',
  injection: '💉',
  drops: '💧',
  other: '📦',
};

const CaregiverViewPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetchCaregiverView();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  // Poll every 60 seconds
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="medications-content" style={{ padding: '40px' }}>
        <div className="skeleton" style={{ height: '140px', borderRadius: '16px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  const { patientInfo, todaySchedule, last7DaysAdherence } = data;

  // Check for missed high risk doses TODAY
  const missedHighRisk = todaySchedule.filter(d => d.status === 'missed' && d.medicationId.isHighRisk);

  return (
    <div className="medications-content" style={{ padding: '24px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Header Back Button */}
      <button
        onClick={() => navigate('/medication')}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B', gap: '8px', padding: 0, marginBottom: '24px' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* 1. PATIENT INFO BAR */}
      <div className="caregiver-patient-bar">
        <div className="patient-info-main">
          <div className="patient-avatar">
            {patientInfo.name.charAt(0)}
          </div>
          <div>
            <h2 className="patient-name">{patientInfo.name}</h2>
            <div className="patient-details">
              {patientInfo.age}y/o • {patientInfo.medicalConditions}
            </div>
          </div>
        </div>
        <a href={`tel:${patientInfo.emergencyContact.phone}`} className="btn-call-patient">
          <Phone size={18} /> {patientInfo.emergencyContact.name.split(' ')[0]}
        </a>
      </div>

      {/* 4. MISSED DOSE ALERTS */}
      <AnimatePresence>
        {missedHighRisk.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }} 
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="missed-alert-banner">
              <AlertTriangle size={24} />
              <div>
                <strong style={{ display: 'block', fontSize: '15px' }}>CRITICAL: Missed High-Risk Medication</strong>
                <span style={{ fontSize: '14px', opacity: 0.9 }}>
                  {missedHighRisk.map(d => `${d.medicationId.name} at ${d.scheduledTime}`).join(', ')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        
        {/* 2. TODAY'S SCHEDULE (READ ONLY) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Today's Schedule <span style={{ fontSize: '12px', background: '#E2E8F0', padding: '2px 8px', borderRadius: '100px', fontWeight: 600, color: '#64748B' }}>LIVE</span>
            </h3>
          </div>
          
          <div className="caregiver-checklist readonly" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todaySchedule.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94A3B8', border: '1px dashed #CBD5E1', borderRadius: '12px' }}>
                No medications shared today.
              </div>
            ) : todaySchedule.map((dose, idx) => {
              const med = dose.medicationId;
              const isTaken = dose.status === 'taken';
              
              return (
                <motion.div
                  key={dose._id}
                  className={`dose-card ${isTaken ? 'taken' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div className="dose-card-info" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="dose-card-icon" style={{ background: isTaken ? 'rgba(16, 185, 129, 0.1)' : '#F1F5F9', color: isTaken ? '#10B981' : '#64748B', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '18px' }}>
                      {FORM_ICONS[med.form] || '💊'}
                    </div>
                    <div>
                      <div className="dose-med-name" style={{ fontSize: '15px', color: isTaken ? '#64748B' : '#0F172A', textDecoration: isTaken ? 'line-through' : 'none' }}>
                        {med.name} {med.dosage}
                      </div>
                      <div className="dose-time" style={{ fontSize: '13px' }}>{dose.scheduledTime}</div>
                    </div>
                  </div>
                  <div>
                    <span className={`dose-status-badge ${dose.status}`}>
                      {dose.status === 'taken' && <Check size={14} />}
                      {dose.status.toUpperCase()}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 3. 7-DAY ADHERENCE SUMMARY */}
        <div>
          <h3 style={{ fontSize: '18px', color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Recent Adherence
          </h3>
          <div style={{ background: 'rgba(255,255,255,0.7)', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '16px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="day-circle green" style={{ width: '10px', height: '10px' }} /> Taken</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="day-circle amber" style={{ width: '10px', height: '10px' }} /> Partial</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div className="day-circle red" style={{ width: '10px', height: '10px' }} /> Missed</div>
            </div>

            <table className="caregiver-adherence-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  {last7DaysAdherence[0]?.dailyStatus.map((d, i) => (
                    <th key={i} style={{ textAlign: 'center' }}>{d.date.slice(5).replace('-', '/')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {last7DaysAdherence.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: '#94A3B8' }}>No data available</td>
                  </tr>
                ) : last7DaysAdherence.map(row => (
                  <tr key={row.medicationId}>
                    <td>
                      <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {row.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 400 }}>{row.dosage}</div>
                    </td>
                    {row.dailyStatus.map((d, i) => (
                      <td key={i} style={{ textAlign: 'center', padding: '12px 4px' }}>
                        <div className={`day-circle ${d.status}`} title={`${d.date}: ${d.status}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px', color: '#475569', fontSize: '13px' }}>
            <Info size={20} color="#94A3B8" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              This page automatically refreshes every minute. To modify medications or view full details, the patient must log into their main dashboard.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CaregiverViewPage;
