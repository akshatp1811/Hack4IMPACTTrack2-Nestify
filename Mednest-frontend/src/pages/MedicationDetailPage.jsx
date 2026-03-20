import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock, Calendar, User, FileText, AlertTriangle, ChevronLeft, ChevronRight, Activity, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import {
  fetchMedicationById,
  fetchDoseHistory,
  fetchDrugInfo,
  updateMedication
} from '../services/api';

const FORM_ICONS = {
  tablet: '💊',
  capsule: '💊',
  syrup: '🥄',
  injection: '💉',
  drops: '💧',
  other: '📦',
};

const formatFrequency = (freq) => {
  if (!freq) return '';
  if (freq.timesPerDay) {
    if (freq.timesPerDay === 1) return 'Once daily';
    if (freq.timesPerDay === 2) return 'Twice daily';
    if (freq.timesPerDay === 3) return 'Three times daily';
    return `${freq.timesPerDay} times daily`;
  }
  return 'As needed';
};

const MedicationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [med, setMed] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // all, taken, missed, skipped
  const [loading, setLoading] = useState(true);
  const [fetchingAI, setFetchingAI] = useState(false);

  // 30 days data
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  useEffect(() => {
    if (med) loadHistory(page, filter);
  }, [page, filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch medication details
      const medRes = await fetchMedicationById(id);
      setMed(medRes.medication);

      // 2. Fetch 30 days history for chart
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const chartRes = await fetchDoseHistory({
        medicationId: id,
        from: thirtyDaysAgo,
        limit: 100 // assuming max ~90 doses in 30 days (3/day)
      });
      
      const allDoses = chartRes.doses;

      // Build chart data
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const d = subDays(new Date(), i);
        const dayStr = format(d, 'MMM dd');
        const dayDoses = allDoses.filter(dose => isSameDay(new Date(dose.scheduledAt), d));
        
        let status = 'none'; // no doses scheduled
        if (dayDoses.length > 0) {
          const taken = dayDoses.filter(x => x.status === 'taken').length;
          const missed = dayDoses.filter(x => x.status === 'missed').length;
          // color logic
          if (taken === dayDoses.length) status = 'green';
          else if (taken > 0) status = 'amber';
          else if (missed > 0) status = 'red';
          else status = 'none';
        }

        data.push({
          date: dayStr,
          rawDate: d,
          status,
          total: dayDoses.length,
          taken: dayDoses.filter(x => x.status === 'taken').length
        });
      }
      setChartData(data);

      // 3. Load initial paginated history table
      await loadHistory(1, 'all');

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (pageNum, statusFilter) => {
    try {
      const params = { medicationId: id, page: pageNum, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await fetchDoseHistory(params);
      setHistory(res.doses);
      setHistoryTotal(res.pagination.total);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFetchDrugInfo = async () => {
    setFetchingAI(true);
    try {
      const info = await fetchDrugInfo(med.name);
      // Update local state
      const updatedMed = { ...med, drugInfo: info.drugInfo };
      setMed(updatedMed);
      // Persist to DB
      await updateMedication(id, { drugInfo: info.drugInfo });
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve AI drug information.');
    } finally {
      setFetchingAI(false);
    }
  };

  if (loading || !med) {
    return (
      <div className="medications-content" style={{ padding: '40px' }}>
        <div className="skeleton" style={{ height: '200px', borderRadius: '16px', marginBottom: '24px' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: '16px' }} />
      </div>
    );
  }

  const refillLow = med.refillInfo?.remainingDays != null && med.refillInfo.remainingDays < 7;
  const progressPct = med.refillInfo?.totalDays 
    ? Math.min(100, Math.max(0, (med.refillInfo.remainingDays / med.refillInfo.totalDays) * 100))
    : 0;

  return (
    <div className="medications-content" style={{ padding: '24px 40px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* 1. HEADER */}
      <div className="med-detail-header">
        <div className="med-detail-header-left">
          <button
            onClick={() => navigate('/medication')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B', gap: '8px', padding: 0, marginBottom: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Medications
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="medications-title" style={{ margin: 0, fontSize: '28px' }}>
              {med.name}
            </h1>
            {med.isHighRisk && (
              <span className="med-badge risk-high">
                <AlertTriangle size={12} /> High Risk
              </span>
            )}
            {med.drugClass && <span className="med-badge class-badge">{med.drugClass}</span>}
            <span className={`med-badge status-${med.status}`}>
              {med.status.charAt(0).toUpperCase() + med.status.slice(1)}
            </span>
          </div>
          {med.genericName && <p className="medications-subtitle" style={{ margin: 0 }}>{med.genericName}</p>}
        </div>
        <div className="med-detail-header-right">
          <button className="btn-modal-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Edit size={16} /> Edit
          </button>
          <button className="btn-modal-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', borderColor: '#FECACA' }}>
            <Trash2 size={16} /> Discontinue
          </button>
        </div>
      </div>

      {/* 2. OVERVIEW CARD */}
      <div className="med-overview-card">
        <div className="overview-data-point">
          <span className="overview-label">Dosage & Form</span>
          <span className="overview-value">
            {FORM_ICONS[med.form] || '💊'} {med.dosage} {med.form}
          </span>
        </div>
        <div className="overview-data-point">
          <span className="overview-label">Frequency</span>
          <span className="overview-value">{formatFrequency(med.frequency)}</span>
          <span style={{ fontSize: '12px', color: '#64748B' }}>
            {med.frequency?.specificTimes?.join(', ')}
          </span>
        </div>
        <div className="overview-data-point">
          <span className="overview-label">Prescription Details</span>
          <span className="overview-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} color="#94A3B8" /> {med.prescribedBy || 'Unknown'}
          </span>
          {med.linkedPrescriptionId && (
            <a href={`/records?id=${med.linkedPrescriptionId}`} className="overview-link" style={{ fontSize: '13px', marginTop: '4px' }}>
              <FileText size={12} /> View Health Record
            </a>
          )}
        </div>
        <div className="overview-data-point">
          <span className="overview-label">Indication</span>
          <span className="overview-value">{med.indication || 'Not specified'}</span>
          <span style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Calendar size={12} /> Started {format(new Date(med.startDate), 'MMM dd, yyyy')}
          </span>
        </div>
        
        {/* Refill Info */}
        <div className="overview-data-point" style={{ gridColumn: '1 / -1', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
          <span className="overview-label">Refill Status</span>
          {med.refillInfo?.remainingDays != null ? (
            <>
              <div className="refill-progress-container">
                <div className="refill-progress-bar">
                  <motion.div 
                    className={`refill-progress-fill ${refillLow ? 'low' : ''}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="refill-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><strong style={{ color: refillLow ? '#EF4444' : '#0F172A' }}>{med.refillInfo.remainingDays} days</strong> remaining</span>
                  <span>Total: {med.refillInfo.totalDays} days</span>
                </div>
              </div>
            </>
          ) : (
            <span className="overview-value" style={{ fontSize: '14px', color: '#94A3B8' }}>No refill tracking enabled</span>
          )}
        </div>
      </div>

      <div className="med-detail-grid">
        {/* 3. ADHERENCE CHART */}
        <div className="chart-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <Activity color="#0EA5E9" size={20} />
            <h3 style={{ margin: 0, fontSize: '16px', color: '#0F172A' }}>30-Day Adherence</h3>
          </div>
          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                  cursor={{ fill: 'rgba(14, 165, 233, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.status === 'none') return <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}>{data.date}: No scheduled doses</div>;
                      return (
                        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>{data.date}</div>
                          <div style={{ fontSize: '13px', color: '#64748B' }}>
                            Taken: <strong>{data.taken}</strong> / {data.total}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[4, 4, 4, 4]} 
                  barSize={12}
                >
                  {chartData.map((entry, index) => {
                    let fill = '#E2E8F0';
                    if (entry.status === 'green') fill = '#10B981';
                    else if (entry.status === 'amber') fill = '#F59E0B';
                    else if (entry.status === 'red') fill = '#EF4444';
                    // We render bar height as 1 purely for visualization (binary/ternary state per day)
                    // If we wanted exact doses we'd use 'total' instead of mapping, but requirement says "Each bar represents one day — green if all taken, amber if partial..."
                    // A height of 1 for all days looks cleaner for a daily adherence punchcard.
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. DRUG INFO CARD */}
        <div className="ai-drug-info-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <h3 className="ai-drug-info-title">
            <Zap size={20} /> AI Drug Insights
          </h3>
          
          {med.drugInfo && med.drugInfo.use ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div className="drug-info-section">
                <div className="drug-info-section-title">Common Use</div>
                <div className="drug-info-section-content">{med.drugInfo.use}</div>
              </div>
              <div className="drug-info-section">
                <div className="drug-info-section-title">Side Effects</div>
                <div className="drug-info-section-content">{med.drugInfo.sideEffects}</div>
              </div>
              <div className="drug-info-section">
                <div className="drug-info-section-title">Warnings</div>
                <div className="drug-info-section-content">{med.drugInfo.warnings}</div>
              </div>
              <div className="drug-info-section">
                <div className="drug-info-section-title">Interactions</div>
                <div className="drug-info-section-content">{med.drugInfo.commonInteractions}</div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: '#64748B' }}>
              <p style={{ fontSize: '14px', marginBottom: '16px', lineHeight: 1.5 }}>
                Learn more about {med.name}, including its primary uses, side effects, warnings, and common interactions.
              </p>
              <button 
                className={`btn-modal-primary ${fetchingAI ? 'loading' : ''}`} 
                onClick={handleFetchDrugInfo}
                disabled={fetchingAI}
                style={{ width: '100%' }}
              >
                {fetchingAI ? 'Analyzing...' : 'Fetch Drug Info'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. DOSE HISTORY TABLE */}
      <div className="dose-history-card">
        <div className="history-header">
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A' }}>Dose History</h3>
          <div className="history-filters">
            {['all', 'taken', 'missed', 'skipped'].map(f => (
              <button
                key={f}
                className={`filter-pill ${filter === f ? 'active' : ''}`}
                onClick={() => { setFilter(f); setPage(1); }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="dose-history-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Logged At</th>
                <th>Taken By</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((dose) => (
                <tr key={dose._id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{format(new Date(dose.scheduledAt), 'MMM dd, yyyy')}</div>
                    <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} /> {dose.scheduledTime}
                    </div>
                  </td>
                  <td>
                    <div className="status-cell">
                      <div className={`status-dot ${dose.status}`} />
                      <span style={{ textTransform: 'capitalize' }}>{dose.status}</span>
                    </div>
                  </td>
                  <td style={{ color: '#64748B' }}>
                    {dose.takenAt ? format(new Date(dose.takenAt), 'MMM dd, HH:mm') : '—'}
                  </td>
                  <td style={{ textTransform: 'capitalize', color: '#64748B' }}>
                    {dose.takenBy || '—'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>
                    No matching dose history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {historyTotal > 10 && (
          <div className="history-pagination">
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, historyTotal)} of {historyTotal} doses
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn-modal-secondary" 
                style={{ padding: '6px 12px' }}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                className="btn-modal-secondary" 
                style={{ padding: '6px 12px' }}
                disabled={page * 10 >= historyTotal}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default MedicationDetailPage;
