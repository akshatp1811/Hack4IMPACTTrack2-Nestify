import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Share2, Plus, AlertCircle, TrendingUp, TrendingDown, Minus, Trash2, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import '../tracking.css';

import Navbar from '../components/Navbar';
import AddVitalModal, { VITAL_TYPES } from '../components/vitals/AddVitalModal';
import { fetchVitalTrends, fetchVitalInsight, fetchVitalHistory, deleteVital } from '../services/api';

const PERIODS = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
  { id: 'all', label: 'All' }
];

// Helper: safe date formatter
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const TrackingDetailPage = () => {
  const { vitalType } = useParams();
  const navigate = useNavigate();

  const vitalConfig = VITAL_TYPES.find(t => t.id === vitalType);

  const [period, setPeriod] = useState('30d');
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [trends, setTrends] = useState([]);
  const [insight, setInsight] = useState(null);
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  
  // Loading states
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingInsight, setLoadingInsight] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Load Data
  const loadData = useCallback(async () => {
    // 1. Trends
    setLoadingTrends(true);
    try {
      const res = await fetchVitalTrends(vitalType, period);
      setTrends(res.data.dataPoints || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrends(false);
    }

    // 2. Insight
    setLoadingInsight(true);
    try {
      const res = await fetchVitalInsight(vitalType, period);
      setInsight(res.data.context);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInsight(false);
    }

    loadHistory(1);
  }, [vitalType, period]);

  const loadHistory = async (page) => {
    setLoadingHistory(true);
    try {
      // Calculate from date based on period
      const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, 'all': 3650 }[period] || 30;
      const fromD = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetchVitalHistory(vitalType, page, 10, fromD, null);
      setHistory(res.data.entries || []);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!vitalConfig) {
      navigate('/tracking');
      return;
    }
    loadData();
  }, [loadData, vitalConfig, navigate]);

  // Derived Stats
  const stats = useMemo(() => {
    if (!trends.length) return { avg: '--', min: '--', max: '--', count: 0 };
    
    let vals = [];
    switch (vitalType) {
      case 'blood_pressure':
        // For BP, display avg sys/dia
        const sys = trends.map(t => t.systolic).filter(Boolean);
        const dia = trends.map(t => t.diastolic).filter(Boolean);
        if (!sys.length) return { avg: '--', min: '--', max: '--', count: 0 };
        const avgS = Math.round(sys.reduce((a, b) => a + b, 0) / sys.length);
        const avgD = Math.round(dia.reduce((a, b) => a + b, 0) / dia.length);
        return {
          avg: `${avgS}/${avgD}`,
          min: `${Math.min(...sys)}/${Math.min(...dia)}`,
          max: `${Math.max(...sys)}/${Math.max(...dia)}`,
          count: trends.length
        };
      case 'blood_glucose': vals = trends.map(t => t.value).filter(Boolean); break;
      case 'weight': vals = trends.map(t => t.value).filter(Boolean); break;
      case 'heart_rate': vals = trends.map(t => t.bpm).filter(Boolean); break;
      case 'spo2': vals = trends.map(t => t.value).filter(Boolean); break;
      case 'sleep': vals = trends.map(t => t.durationMinutes ? t.durationMinutes / 60 : null).filter(Boolean); break;
      case 'activity': vals = trends.map(t => t.steps).filter(v => v != null); break;
      case 'calories': vals = trends.map(t => (t.intake || 0) - (t.burned || 0)); break;
      case 'stress_score': vals = trends.map(t => t.value).filter(Boolean); break;
    }

    if (!vals.length) return { avg: '--', min: '--', max: '--', count: 0 };
    
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    
    return {
      avg: vitalType === 'sleep' ? `${avg.toFixed(1)}h` : vitalType === 'activity' ? Math.round(avg).toLocaleString() : Math.round(avg),
      min: vitalType === 'sleep' ? `${Math.min(...vals).toFixed(1)}h` : vitalType === 'activity' ? Math.round(Math.min(...vals)).toLocaleString() : Math.round(Math.min(...vals)),
      max: vitalType === 'sleep' ? `${Math.max(...vals).toFixed(1)}h` : vitalType === 'activity' ? Math.round(Math.max(...vals)).toLocaleString() : Math.round(Math.max(...vals)),
      count: trends.length
    };
  }, [trends, vitalType]);

  // Actions
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    if (!history.length && !trends.length) {
      showToast('No data to export');
      return;
    }
    // Simple CSV generator
    const headers = ['Date', 'Category'];
    if (vitalType === 'blood_pressure') headers.push('Systolic', 'Diastolic', 'Pulse');
    else if (vitalType === 'blood_glucose') headers.push('Glucose', 'Context');
    else if (vitalType === 'activity') headers.push('Steps', 'Active Mins', 'Distance(km)');
    else if (vitalType === 'sleep') headers.push('Duration(hrs)', 'Quality');
    else if (vitalType === 'calories') headers.push('Intake', 'Burned');
    else if (vitalType === 'weight') headers.push('Weight');
    else if (vitalType === 'heart_rate') headers.push('BPM', 'Context');
    else if (vitalType === 'spo2') headers.push('SpO2');
    else if (vitalType === 'stress_score') headers.push('Score');

    let csv = headers.join(',') + '\n';
    
    // We use history if loaded fully, but trends has the sorted data in right order
    trends.forEach(t => {
      const row = [formatDate(t.date), t.category || ''];
      if (vitalType === 'blood_pressure') row.push(t.systolic, t.diastolic, t.pulse || '');
      else if (vitalType === 'blood_glucose') row.push(t.value, t.measuredWhen || '');
      else if (vitalType === 'activity') row.push(t.steps, t.activeMinutes || '', t.distanceKm || '');
      else if (vitalType === 'sleep') row.push(t.durationMinutes ? (t.durationMinutes/60).toFixed(1) : '', t.quality || '');
      else if (vitalType === 'calories') row.push(t.intake || '', t.burned || '');
      else if (vitalType === 'weight') row.push(t.value);
      else if (vitalType === 'heart_rate') row.push(t.bpm, t.context || '');
      else if (vitalType === 'spo2') row.push(t.value);
      else if (vitalType === 'stress_score') row.push(t.value);
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mednest_${vitalType}_${period}.csv`;
    a.click();
    showToast('Export downloaded');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reading?')) return;
    try {
      await deleteVital(id);
      showToast('Reading deleted');
      loadData();
    } catch (err) {
      showToast('Failed to delete');
    }
  };

  if (!vitalConfig) return null;

  // Chart Rendering
  const renderChart = () => {
    if (loadingTrends) return <div className="chart-loading">Loading chart data...</div>;
    if (!trends.length) return <div className="chart-empty">No data for this period</div>;

    const data = trends.map(t => ({
      ...t,
      dateFormatted: new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      // computed fields for chart display
      sleepHrs: t.durationMinutes ? Number((t.durationMinutes / 60).toFixed(1)) : 0,
    }));

    // Find min max for y-axis domain for continuous vitals
    const getDomain = (key, offset = 10) => {
      const vals = data.map(d => d[key]).filter(v => typeof v === 'number');
      if (!vals.length) return ['auto', 'auto'];
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      return [Math.max(0, min - offset), max + offset];
    };

    switch (vitalType) {
      case 'blood_pressure':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="dateFormatted" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              {/* Reference Zones */}
              <ReferenceArea y1={140} y2={200} fill="#FEE2E2" fillOpacity={0.3} />
              <ReferenceArea y1={90} y2={120} fill="#DCFCE7" fillOpacity={0.3} />
              <ReferenceLine y={120} stroke="#10B981" strokeDasharray="3 3" opacity={0.5} />
              <ReferenceLine y={140} stroke="#EF4444" strokeDasharray="3 3" opacity={0.5} />
              <Line type="monotone" dataKey="systolic" name="Systolic" stroke={vitalConfig.color} strokeWidth={3} dot={{ r: 4, fill: vitalConfig.color }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#6366F1" strokeWidth={3} dot={{ r: 4, fill: "#6366F1" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'sleep':
      case 'activity':
      case 'calories':
        const dKey = vitalType === 'sleep' ? 'sleepHrs' : vitalType === 'activity' ? 'steps' : 'intake';
        const fillC = vitalConfig.color;
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="dateFormatted" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F1F5F9' }} />
              {vitalType === 'activity' && <ReferenceLine y={8000} stroke="#10B981" strokeDasharray="4 4" label={{ position: 'top', value: 'Goal', fill: '#10B981', fontSize: 12 }} />}
              <Bar dataKey={dKey} name={vitalConfig.label} fill={fillC} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        // Continuous vitals (glucose, wt, hr, spo2, stress)
        const vKey = (vitalType === 'heart_rate') ? 'bpm' : 'value';
        return (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id={`color-${vitalType}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={vitalConfig.color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={vitalConfig.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="dateFormatted" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} domain={getDomain(vKey)} />
              <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey={vKey} name={vitalConfig.label} stroke={vitalConfig.color} strokeWidth={3} fillOpacity={1} fill={`url(#color-${vitalType})`} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="tracking-page">
      <Navbar />
      
      <div className="detail-container">
        {/* Breadcrumb / Back */}
        <button onClick={() => navigate('/tracking')} className="btn-back-link">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        {/* HEADER */}
        <div className="detail-header">
          <div className="detail-title-group">
            <div className="detail-icon" style={{ background: vitalConfig.bg, color: vitalConfig.color }}>
              {vitalConfig.icon}
            </div>
            <div>
              <h1 className="detail-title">{vitalConfig.label}</h1>
              <p className="detail-subtitle">Last updated {trends.length ? formatDate(trends[trends.length-1].date) : 'never'}</p>
            </div>
          </div>
          <div className="detail-actions">
            <button className="btn-secondary" onClick={handleExport}><Download size={16} /> Export</button>
            <button className="btn-secondary" onClick={handleShare}><Share2 size={16} /> Share</button>
            <button className="btn-primary" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Reading</button>
          </div>
        </div>

        {/* TIME PERIOD TABS */}
        <div className="period-tabs">
          {PERIODS.map(p => (
            <button
              key={p.id}
              className={`period-tab ${period === p.id ? 'active' : ''}`}
              onClick={() => setPeriod(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* CHART SECTION */}
        <div className="chart-card">
          <div className="chart-wrapper">
            {renderChart()}
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT FOR DESKTOP */}
        <div className="detail-grid">
          
          <div className="detail-main-col">
            {/* STAT CARDS */}
            <div className="stat-cards-grid">
              <div className="stat-card">
                <p className="stat-label">Average</p>
                <p className="stat-val">{stats.avg}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Min</p>
                <p className="stat-val">{stats.min}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Max</p>
                <p className="stat-val">{stats.max}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Total Readings</p>
                <p className="stat-val">{stats.count}</p>
              </div>
            </div>

            {/* AI INSIGHT CARD */}
            <div className="insight-card">
              <div className="insight-header">
                <h3><img src="https://www.gstatic.com/lamda/images/sparkle_resting_v2_darkmode_2bdb7df2724e450073ede.gif" alt="AI" width={20} style={{ marginRight: 8 }} /> AI Insight</h3>
                {!loadingInsight && insight?.assessment && (
                  <div className={`assessment-badge ${insight.assessment}`}>
                    {insight.assessment === 'improving' && <><TrendingUp size={14}/> Improving</>}
                    {insight.assessment === 'worsening' && <><TrendingDown size={14}/> Worsening</>}
                    {insight.assessment === 'stable' && <><Minus size={14}/> Stable</>}
                    {insight.assessment === 'insufficient_data' && <><AlertCircle size={14}/> Insufficient Data</>}
                  </div>
                )}
              </div>
              
              <div className="insight-body">
                {loadingInsight ? (
                  <div className="shimmer-block" style={{ height: '60px' }}></div>
                ) : (
                  <>
                    <p className="insight-summary">{insight?.trendSummary}</p>
                    
                    {insight?.actionableRecommendation && (
                      <div className="insight-recommendation">
                        <CheckCircle2 size={16} color="#10B981" /> 
                        <span>{insight.actionableRecommendation}</span>
                      </div>
                    )}

                    {insight?.seeDoctor && (
                      <div className="insight-warning">
                        <AlertCircle size={16} color="#EF4444" />
                        <span>Based on recent trends, consulting a healthcare professional is recommended.</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="detail-side-col">
            {/* HISTORY LIST */}
            <div className="history-card">
              <div className="history-header">
                <h3>Log History</h3>
                <span>{pagination.total || 0} entries</span>
              </div>
              
              <div className="history-list">
                {loadingHistory ? (
                   Array.from({length: 4}).map((_, i) => <div key={i} className="shimmer-block" style={{ height: '50px', marginBottom: '10px' }} />)
                ) : history.length === 0 ? (
                  <p className="empty-text">No records for this period.</p>
                ) : (
                  history.map((entry) => {
                    // format val for history UI
                    let valStr = '';
                    switch (vitalType) {
                      case 'blood_pressure': valStr = `${entry.bloodPressure?.systolic}/${entry.bloodPressure?.diastolic}`; break;
                      case 'blood_glucose': valStr = `${entry.bloodGlucose?.value}`; break;
                      case 'weight': valStr = `${entry.weight?.value} kg`; break;
                      case 'heart_rate': valStr = `${entry.heartRate?.bpm} bpm`; break;
                      case 'spo2': valStr = `${entry.spo2?.value}%`; break;
                      case 'sleep': valStr = `${(entry.sleep?.durationMinutes/60).toFixed(1)}h`; break;
                      case 'activity': valStr = `${entry.activity?.steps} st`; break;
                      case 'calories': valStr = `${entry.calories?.intake} kcal`; break;
                      case 'stress_score': valStr = `${Math.round(entry.stressScore?.value)}`; break;
                    }

                    return (
                      <div key={entry._id} className="history-item">
                        <div className="history-meta">
                          <span className="history-date">{formatDate(entry.recordedAt)}</span>
                          <span className="history-time">{formatTime(entry.recordedAt)}</span>
                        </div>
                        <div className="history-val">
                          <strong>{valStr}</strong>
                          {entry.category && <span className="cat-badge">{entry.category.split(' ')[0]}</span>}
                        </div>
                        <button className="btn-icon-danger" onClick={() => handleDelete(entry._id)} title="Delete entry">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="history-pagination">
                  <button disabled={!pagination.hasPrevPage} onClick={() => loadHistory(pagination.page - 1)}>Prev</button>
                  <span>{pagination.page} / {pagination.totalPages}</span>
                  <button disabled={!pagination.hasNextPage} onClick={() => loadHistory(pagination.page + 1)}>Next</button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <AddVitalModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        presetType={vitalType}
        onVitalAdded={() => {
          showToast('Vital logged');
          loadData();
        }}
      />

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

export default TrackingDetailPage;
