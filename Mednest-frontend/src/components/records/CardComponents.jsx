// src/components/records/CardComponents.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Activity, FileText, Pill, Users, ChevronDown, CheckCircle, AlertTriangle, AlertCircle, X, Download } from 'lucide-react';

/* --- Shared Components --- */
const ExpandButton = ({ expanded, setExpanded }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
    style={{ 
      background: 'transparent', border: 'none', cursor: 'pointer', 
      marginLeft: 'auto', display: 'flex', alignItems: 'center' 
    }}
  >
    <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
      <ChevronDown size={20} color="#94A3B8" />
    </motion.div>
  </button>
);

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('normal') || s.includes('completed') || s.includes('available')) return { bg: '#ECFDF5', text: '#10B981', icon: <CheckCircle size={14}/> };
  if (s.includes('high') || s.includes('low') || s.includes('abnormal')) return { bg: '#FEF2F2', text: '#EF4444', icon: <AlertCircle size={14}/> };
  if (s.includes('borderline') || s.includes('awaiting') || s.includes('ongoing')) return { bg: '#FFFBEB', text: '#F59E0B', icon: <AlertTriangle size={14}/> };
  return { bg: '#E0F2FE', text: '#0EA5E9', icon: null };
};

const StatusBadge = ({ status }) => {
  if (!status) return null;
  const colors = getStatusColor(status);
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '600',
      background: colors.bg, color: colors.text
    }}>
      {colors.icon}
      {status}
    </div>
  );
};

/* --- 1. VISIT RECORD --- */
export const VisitCard = ({ data, onCompare }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout className="record-card cat-visit" onClick={() => setExpanded(!expanded)}>
      <div className="record-header">
        <div className="category-icon-box"><Stethoscope /></div>
        <div className="record-meta">
          <div className="record-title-row">
            <h3 className="record-title">{data.title}</h3>
            <span className="timestamp">{data.time} &middot; {data.facility}</span>
          </div>
          <div className="record-sub">{data.doctor} &middot; {data.specialty}</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#0F172A' }}>{data.summary}</div>
        </div>
        <ExpandButton expanded={expanded} setExpanded={setExpanded} />
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(14,165,233,0.1)' }}>
              <h4 style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Vitals</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {data.vitals && Object.entries(data.vitals).map(([k, v]) => (
                  <span key={k} style={{ padding: '4px 12px', background: '#F8FBFF', borderRadius: '8px', fontSize: '13px', border: '1px solid #E0F2FE' }}>
                    <span style={{ color: '#94A3B8', marginRight: '4px', textTransform: 'capitalize' }}>{k}</span> 
                    <span style={{ fontWeight: '500' }}>{v}</span>
                  </span>
                ))}
              </div>
              <div style={{ fontSize: '13px', color: '#334155', marginBottom: '16px' }}>
                <strong>Doctor's Notes:</strong> {data.notes || 'No extended notes available.'}
              </div>
              <button onClick={(e) => { e.stopPropagation(); onCompare(data); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #0EA5E9', color: '#0EA5E9', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Compare Past Visits
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --- 2. SCAN RECORD (Includes Internal Timeline logic if Grouped) --- */
export const ScanCard = ({ data, onCompare }) => {
  const [expanded, setExpanded] = useState(false);
  const isGroup = data.type === 'scanGroup';
  const records = isGroup ? data.items : [data];
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const activeRecord = records[activeIndex];

  return (
    <>
    <motion.div layout className={`record-card cat-scan ${isGroup ? 'smart-group' : ''}`} onClick={() => setExpanded(!expanded)}>
      {isGroup && (
        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed rgba(139,92,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8B5CF6', fontWeight: '600', fontSize: '14px' }}>
            <Activity size={16} /> 
            {data.subType} &middot; {records.length} records
          </div>
          {expanded && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', overflowX: 'auto' }}>
              {records.map((r, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); setActiveIndex(i); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: activeIndex === i ? 1 : 0.5 }}>
                  <span style={{ fontSize: '11px', marginBottom: '4px' }}>{new Date(r.date).toLocaleDateString(undefined, {month:'short', year:'numeric'})}</span>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeIndex === i ? '#8B5CF6' : 'transparent', border: '2px solid #8B5CF6' }}></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="record-header">
        <div className="category-icon-box" style={{ background: isGroup ? 'transparent' : ''}}><Activity /></div>
        <div className="record-meta">
          <div className="record-title-row">
            <h3 className="record-title">{activeRecord.subType}</h3>
            <span className="timestamp">{activeRecord.time}</span>
          </div>
          <div className="record-sub">{activeRecord.doctor} &middot; {activeRecord.facility}</div>
          <div style={{ marginTop: '8px' }}><StatusBadge status={activeRecord.status} /></div>
        </div>
        <ExpandButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(139,92,246,0.1)' }}>
              {/* Scan Image */}
              {activeRecord.originalFile && activeRecord.originalFile.url ? (
                <div 
                  onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                  style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px', cursor: 'zoom-in', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <img src={activeRecord.originalFile.url} alt="Scan result" style={{ height: '100%', width: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ width: '100%', height: '120px', background: 'linear-gradient(45deg, #1E293B, #334155)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', marginBottom: '16px' }}>
                  <Activity size={32} style={{ opacity: 0.5, marginRight: '8px' }} /> DICOM / Image Placeholder
                </div>
              )}
              <div style={{ background: '#F8FBFF', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Radiologist: {activeRecord.report?.radiologist}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Reported: {activeRecord.report?.date}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#334155', marginBottom: '12px' }}>
                  <strong>Findings:</strong> {activeRecord.report?.findings}
                </div>
                <div style={{ fontSize: '14px', background: '#E0F2FE', color: '#0369A1', padding: '12px', borderRadius: '8px', fontWeight: '500' }}>
                  <strong>Impression:</strong> {activeRecord.report?.impression}
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                <button onClick={(e) => { e.stopPropagation(); onCompare(activeRecord); }} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #8B5CF6', color: '#8B5CF6', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  Compare with Previous
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
      <AnimatePresence>
        {lightboxOpen && activeRecord.originalFile?.url && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
          >
            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '12px' }}>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  const link = document.createElement('a');
                  link.href = activeRecord.originalFile.url;
                  link.download = `scan-${activeRecord.date || 'image'}.jpg`;
                  link.target = '_blank';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', transition: 'background 0.2s' }}
                title="Download Image"
              >
                <Download size={24} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', transition: 'background 0.2s' }}
                title="Close"
              >
                <X size={24} />
              </button>
            </div>
            <img 
              src={activeRecord.originalFile.url} 
              alt="Enlarged Scan" 
              style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }} 
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

/* --- 3. LAB RECORD --- */
export const LabCard = ({ data, onCompare }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout className="record-card cat-lab" onClick={() => setExpanded(!expanded)}>
      <div className="record-header">
        <div className="category-icon-box"><FileText /></div>
        <div className="record-meta">
          <div className="record-title-row">
            <h3 className="record-title">{data.title}</h3>
            <span className="timestamp">Collected: {data.date}</span>
          </div>
          <div className="record-sub">Ordered By: {data.doctor} &middot; {data.labName}</div>
          <div style={{ marginTop: '8px' }}><StatusBadge status={data.status} /></div>
        </div>
        <ExpandButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(16,185,129,0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#94A3B8' }}>
                    <th style={{ padding: '8px 4px', fontWeight: '500' }}>Test Name</th>
                    <th style={{ padding: '8px 4px', fontWeight: '500' }}>Result</th>
                    <th style={{ padding: '8px 4px', fontWeight: '500' }}>Unit</th>
                    <th style={{ padding: '8px 4px', fontWeight: '500' }}>Ref Range</th>
                    <th style={{ padding: '8px 4px', fontWeight: '500' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results?.map((res, i) => {
                    const c = getStatusColor(res.status);
                    const isAlert = res.status !== 'Normal';
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #F1F5F9', background: isAlert ? c.bg : 'transparent' }}>
                        <td style={{ padding: '10px 4px', fontWeight: '500', color: '#334155' }}>{res.name}</td>
                        <td style={{ padding: '10px 4px', fontWeight: '700', color: c.text }}>{res.value}</td>
                        <td style={{ padding: '10px 4px', color: '#64748B' }}>{res.unit}</td>
                        <td style={{ padding: '10px 4px', color: '#64748B' }}>{res.range}</td>
                        <td style={{ padding: '10px 4px', color: c.text, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {c.icon} {res.status}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <button onClick={(e) => { e.stopPropagation(); onCompare(data); }} style={{ marginTop: '16px', padding: '8px 16px', background: 'transparent', border: '1px solid #10B981', color: '#10B981', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Compare with Last Report
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --- 4. MEDICATION RECORD --- */
export const MedicationCard = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  const isGroup = data.type === 'medGroup';
  const records = isGroup ? data.items : [data];
  const activeRecord = records[0]; // Just showing the most recent for simplicity in meds

  return (
    <motion.div layout className="record-card cat-med" onClick={() => setExpanded(!expanded)}>
      <div className="record-header">
        <div className="category-icon-box"><Pill /></div>
        <div className="record-meta">
          <div className="record-title-row">
            <h3 className="record-title" style={{ fontSize: '18px' }}>{activeRecord.name} <span style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '400' }}>{activeRecord.generic}</span></h3>
            <span className="timestamp">Started: {activeRecord.date}</span>
          </div>
          <div className="record-sub" style={{ color: '#0F172A', fontWeight: '500' }}>{activeRecord.dosage} &middot; {activeRecord.frequency}</div>
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <span style={{ padding: '4px 8px', background: '#FFFBEB', color: '#F59E0B', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>{activeRecord.form}</span>
            <StatusBadge status={activeRecord.status} />
          </div>
        </div>
        <ExpandButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(245,158,11,0.1)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#64748B', marginBottom: '4px' }}>Prescribed By</div>
                  <div style={{ fontWeight: '500' }}>{activeRecord.doctor}</div>
                </div>
                <div>
                  <div style={{ color: '#64748B', marginBottom: '4px' }}>Indication</div>
                  <div style={{ fontWeight: '500' }}>{activeRecord.indication}</div>
                </div>
              </div>
              <div style={{ marginTop: '16px', background: '#FFFBEB', color: '#B45309', padding: '12px', borderRadius: '8px', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ marginTop: '2px' }}/>
                <div>
                  <strong>Instructions:</strong> {activeRecord.instructions}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* --- 5. CONSULTATION RECORD --- */
export const ConsultationCard = ({ data, onCompare }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div layout className="record-card cat-consult" onClick={() => setExpanded(!expanded)}>
      <div className="record-header">
        <div className="category-icon-box"><Users /></div>
        <div className="record-meta">
          <div className="record-title-row">
            <h3 className="record-title">{data.specialty} Consultation</h3>
            <span className="timestamp">{data.date} &middot; {data.mode}</span>
          </div>
          <div className="record-sub">{data.doctor} &middot; {data.facility}</div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#0F172A' }}>{data.reason}</div>
        </div>
        <ExpandButton expanded={expanded} setExpanded={setExpanded} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(236,72,153,0.1)' }}>
              <div style={{ fontSize: '13px', color: '#334155', marginBottom: '16px' }}>
                <strong>Assessment:</strong> {data.summary}
              </div>
              {data.recommendations && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Recommendations</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155' }}>
                    {data.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
              <button onClick={(e) => { e.stopPropagation(); onCompare(data); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #EC4899', color: '#EC4899', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                Compare Assessments
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
