import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share2, Sparkles, FileText, Activity, ShieldCheck, HeartPulse, Stethoscope, ClipboardList, X, Copy, Check } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import Navbar from '../components/Navbar';
import PatientReportView from '../components/insights/PatientReportView';
import DoctorReportView from '../components/insights/DoctorReportView';
import InsuranceReportView from '../components/insights/InsuranceReportView';
import { fetchUserReports, generateAiReport, exportAiReport } from '../services/api';
import '../insights.css';

const REPORT_TYPES = [
  { id: 'patient', title: 'Patient Summary', icon: HeartPulse },
  { id: 'doctor', title: 'Doctor Summary', icon: Stethoscope },
  { id: 'insurance', title: 'Insurance Report', icon: ClipboardList }
];

const AiInsightsPage = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({ patient: false, doctor: false, insurance: false });
  const [activeReportId, setActiveReportId] = useState('patient');
  const [errors, setErrors] = useState({ patient: null, doctor: null, insurance: null });
  const [exporting, setExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const res = await fetchUserReports();
      const reportMap = {};
      res.reports.forEach(r => {
        reportMap[r.reportType] = r;
      });
      setReports(reportMap);
      
      // Auto-select a valid report if current is missing
      if (!reportMap['patient'] && res.reports.length > 0) {
        setActiveReportId(res.reports[0].reportType);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (type) => {
    if (reports[type]) {
      const confirm = window.confirm(`Regenerating the ${type} report will consume AI credits. Continue?`);
      if (!confirm) return;
    }

    setGenerating(prev => ({ ...prev, [type]: true }));
    setErrors(prev => ({ ...prev, [type]: null }));
    try {
      await generateAiReport(type);
      await loadReports();
      setActiveReportId(type);
    } catch (error) {
      setErrors(prev => ({ ...prev, [type]: error.response?.data?.message || `Failed to generate ${type} report.` }));
    } finally {
      setGenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleExport = async () => {
    const active = reports[activeReportId];
    if (!active) return;
    
    setExporting(true);
    try {
      const res = await exportAiReport(active._id);
      window.open(res.exportUrl, '_blank');
    } catch (err) {
      alert('Failed to export report as PDF.');
    } finally {
      setExporting(false);
    }
  };

  const handleShare = () => {
    const active = reports[activeReportId];
    if (!active || !active.shareToken) return;
    setShowShareModal(true);
  };

  const shareUrl = reports[activeReportId] ? `${window.location.origin}/share/report/${reports[activeReportId].shareToken}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderActiveReport = () => {
    const active = reports[activeReportId];
    if (!active) return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#94A3B8' }}>
        <Sparkles size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h3 style={{ fontFamily: 'Sora', color: '#334155', marginBottom: '8px' }}>No Report Available</h3>
        <p>Click "Generate Report" above to create an AI summary from your health data.</p>
      </div>
    );

    switch (activeReportId) {
      case 'patient': return <PatientReportView report={active} />;
      case 'doctor': return <DoctorReportView report={active} />;
      case 'insurance': return <InsuranceReportView report={active} />;
      default: return null;
    }
  };

  return (
    <div className="insights-page">
      <Navbar />
      
      <div className="insights-header">
        <h1 className="insights-title">AI Health Insights</h1>
        <p className="insights-subtitle">AI-generated summaries of your complete health data</p>
      </div>

      <div className="insights-content">
        <div className="generation-cards-grid">
          {REPORT_TYPES.map(({ id, title, icon: Icon }) => {
            const report = reports[id];
            const isGenerating = generating[id];
            
            return (
              <motion.div 
                key={id}
                className={`gen-card ${activeReportId === id && report ? 'active' : ''} ${errors[id] ? 'error' : ''}`}
                style={errors[id] ? { border: '1px solid #EF4444', backgroundColor: '#FEF2F2' } : {}}
                whileHover={{ y: -4 }}
                onClick={() => report && !isGenerating && setActiveReportId(id)}
              >
                <div className="gen-card-header">
                  <div className="gen-card-icon">
                    <Icon size={22} />
                  </div>
                  <h3 className="gen-card-title">{title}</h3>
                </div>
                
                <div className="gen-card-meta">
                  {isGenerating ? (
                    <div className="skeleton-pulse">
                      <div className="gen-skeleton-bar"></div>
                      <div className="gen-skeleton-bar short"></div>
                    </div>
                  ) : errors[id] ? (
                    <span style={{ color: '#EF4444', fontWeight: 500 }}>{errors[id]}</span>
                  ) : report ? (
                    <span>Last generated:<br/><strong>{new Date(report.generatedAt).toLocaleDateString()}</strong></span>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>Not generated yet</span>
                  )}
                </div>

                <div className="gen-card-actions">
                  {isGenerating ? (
                    <button className="btn-secondary-gen" disabled style={{ opacity: 0.5 }}>Generating...</button>
                  ) : report ? (
                    <>
                      <button className="btn-primary-gen" onClick={(e) => { e.stopPropagation(); setActiveReportId(id); }}>
                        View
                      </button>
                      <button className="btn-secondary-gen" onClick={(e) => { e.stopPropagation(); handleGenerate(id); }}>
                        Regenerate
                      </button>
                    </>
                  ) : (
                    <button className="btn-primary-gen" onClick={(e) => { e.stopPropagation(); handleGenerate(id); }}>
                      <Sparkles size={16} style={{ marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      Generate Report
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div 
          className="report-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {loading ? (
            <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }} className="skeleton-pulse">
              <div style={{ height: '40px', background: '#F1F5F9', borderRadius: '8px', width: '30%' }}></div>
              <div style={{ height: '120px', background: '#F1F5F9', borderRadius: '16px' }}></div>
              <div style={{ height: '200px', background: '#F1F5F9', borderRadius: '16px' }}></div>
            </div>
          ) : (
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeReportId + (reports[activeReportId]?.generatedAt || 'none')}
                 initial={{ opacity: 0, filter: 'blur(4px)' }}
                 animate={{ opacity: 1, filter: 'blur(0px)' }}
                 exit={{ opacity: 0, filter: 'blur(4px)' }}
                 transition={{ duration: 0.3 }}
               >
                 {renderActiveReport()}
               </motion.div>
             </AnimatePresence>
          )}
        </motion.div>

        {reports[activeReportId] && !loading && (
          <div className="report-fixed-actions">
            <button className="btn-share" onClick={handleShare}>
              <Share2 size={18} /> Share
            </button>
            <button className="btn-export" onClick={handleExport} disabled={exporting}>
              <Download size={18} /> {exporting ? 'Generating PDF...' : 'Export PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
            <motion.div 
              className="modal-content"
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
              <button className="modal-close" onClick={() => setShowShareModal(false)}><X size={24} /></button>
              
              <h2 style={{ fontFamily: 'Sora', marginBottom: '8px', color: '#0F172A' }}>Share Report</h2>
              <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px' }}>
                Anyone with this secure link can view a read-only version of this report. 
                <span style={{ display: 'block', marginTop: '4px', color: '#0EA5E9', fontWeight: '500' }}>This link expires in 7 days.</span>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                <div style={{ padding: '16px', background: '#F8FBFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                  <QRCodeCanvas value={shareUrl} size={180} level={"H"} fgColor="#0F172A" />
                </div>
                
                <div style={{ width: '100%' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Share Link</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={shareUrl} 
                      style={{ flex: 1, padding: '12px 16px', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '8px', color: '#334155', fontFamily: 'monospace', fontSize: '14px', outline: 'none' }}
                    />
                    <button 
                      onClick={copyToClipboard}
                      style={{ padding: '0 20px', background: copied ? '#22C55E' : '#0EA5E9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
                    >
                      {copied ? <><Check size={18}/> Copied</> : <><Copy size={18}/> Copy</>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiInsightsPage;
