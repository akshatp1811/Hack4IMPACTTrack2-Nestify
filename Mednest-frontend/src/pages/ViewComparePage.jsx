// src/pages/ViewComparePage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Share2, Brain, CheckCircle, AlertTriangle, Sparkles, Activity, FileText, Pill, XCircle } from 'lucide-react';
import { compareRecords } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getMockDataForRecord } from '../data/mockComparisonData';

const ViewComparePage = ({ isOpen, onClose, initialRecord }) => {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [allHistory, setAllHistory] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && initialRecord) {
      loadComparisonData(initialRecord);
    }
  }, [isOpen, initialRecord]);

  const loadComparisonData = async (record) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try real backend first
      const data = await compareRecords(record._id);
      
      // If real data exists and has extractedData
      if (data?.data?.recordA?.extractedData && Object.keys(data.data.recordA.extractedData).length > 0) {
        setSelectedRecord(data.data.recordA);
        setAllHistory(data.data.allHistory || []);
        setComparison(data.data.comparison);
        setIsLoading(false);
        return;
      }
      
      // If real record exists but ML not processed yet, use mock data
      throw new Error('ML not processed yet (missing extractedData)');
      
    } catch (err) {
      console.warn('Backend unavailable or missing ML data, using mock data:', err.message);
      
      const mockResult = getMockDataForRecord(record);
      
      // Specifically ensure we select the exact record requested if it exists in the mock history
      let recToSet = mockResult.currentRecord;
      if (record._id) {
        const found = mockResult.allHistory?.find(r => r._id === record._id);
        if (found) {
           recToSet = { ...mockResult.currentRecord, _id: record._id, recordDate: found.recordDate, facilityName: found.facilityName };
        }
      }
      
      setSelectedRecord(recToSet);
      setAllHistory(mockResult.allHistory || []);
      setComparison(mockResult.comparison);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (recordId) => {
    if (selectedRecord && selectedRecord._id === recordId) return;
    
    // Smooth transition triggered by state change
    const clickedRecord = allHistory.find(r => r._id === recordId) || { _id: recordId };
    loadComparisonData(clickedRecord);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: '#F8FBFF',
          zIndex: 1000,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* NAVIGATION HEADER */}
        <header style={{ padding: '16px 48px 16px', borderBottom: '1px solid rgba(14,165,233,0.12)', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 50 }}>
          <button  
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748B', fontWeight: '500', padding: '0', fontSize: '13px', marginBottom: '8px' }}
          >
            <ArrowLeft size={14} /> Back to Health Records
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: '28px', fontWeight: '700', color: '#0F172A', margin: 0 }}>View & Compare</h1>
            
            {selectedRecord && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'right' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(14,165,233,0.1)', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Activity size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', lineHeight: '1.2' }}>{selectedRecord.subType || selectedRecord.recordType}</div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    {selectedRecord.facilityName || 'Unknown Facility'} &middot; {allHistory.length} record{allHistory.length !== 1 ? 's' : ''} &middot; Last updated {(() => { const sorted = [...allHistory].sort((a,b) => new Date(b.recordDate) - new Date(a.recordDate)); return sorted[0] ? new Date(sorted[0].recordDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric'}) : ''; })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* SECTION 1: HORIZONTAL RECORD TIMELINE */}
        {allHistory.length > 0 && (
          <div style={{ padding: '24px 48px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid rgba(14,165,233,0.12)', boxShadow: '0 2px 12px rgba(14,165,233,0.06)', padding: '24px 40px', overflow: 'visible', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box', position: 'relative' }}>
                {allHistory.map((record, index) => {
                  const isSelected = selectedRecord?._id === record._id;
                  const isAbnormal = record.extractedData?.results?.some(r => r.status !== 'Normal' && r.status !== 'normal') || record.aiSummary?.toLowerCase().includes('abnormal');
                  const d = new Date(record.recordDate);
                  const monthYear = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                  
                  return (
                    <div key={record._id} style={{ display: 'flex', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div 
                        onClick={() => handleNodeClick(record._id)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative', padding: '0 4px' }}
                      >
                        {/* Node container */}
                        <div style={{ position: 'relative', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSelected && (
                            <motion.div 
                              animate={{ boxShadow: ['0 0 0 5px rgba(14,165,233,0.15)', '0 0 0 8px rgba(14,165,233,0)'] }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
                              style={{ position: 'absolute', width: '26px', height: '26px', borderRadius: '50%', zIndex: 1, pointerEvents: 'none' }}
                            />
                          )}
                          <motion.div 
                            animate={{ width: isSelected ? 26 : 20, height: isSelected ? 26 : 20 }}
                            whileHover={{ scale: 1.15, background: isSelected ? '#0EA5E9' : 'rgba(14,165,233,0.1)' }}
                            transition={{ duration: 0.15 }}
                            style={{
                              borderRadius: '50%',
                              background: isSelected ? '#0EA5E9' : '#FFFFFF',
                              border: isSelected ? '3px solid #0369A1' : '2px solid #0EA5E9',
                              boxShadow: isSelected ? '0 0 0 5px rgba(14,165,233,0.15)' : 'none',
                              cursor: 'pointer',
                              zIndex: 10
                            }}
                          />
                        </div>

                        {/* Label */}
                        <div style={{ marginTop: '8px', textAlign: 'center', transition: 'opacity 0.15s', opacity: isSelected ? 1 : 0.8 }}>
                          <div style={{ fontSize: '13px', fontWeight: isSelected ? '700' : '600', color: isSelected ? '#0F172A' : '#64748B', whiteSpace: 'nowrap' }}>{monthYear}</div>
                          <div style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px', margin: '2px auto 0' }}>
                            {record.facilityName ? record.facilityName.split(' ')[0] : ''}
                          </div>
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '100px', background: isAbnormal ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', color: isAbnormal ? '#D97706' : '#059669' }}>
                              {isAbnormal ? 'Abnormal' : 'Normal'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Connection Line */}
                      {index < allHistory.length - 1 && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '16px', flex: 1, minWidth: 0 }}>
                          <div style={{ height: '2px', width: '100%', background: 'rgba(14,165,233,0.25)' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE CONTENT */}
        <main style={{ flex: 1, padding: '40px 48px', maxWidth: '1400px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <AnimatePresence mode="wait">
            {selectedRecord && (
              <motion.div
                key={selectedRecord._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '100px' }}
              >
                {/* SECTION 2: SELECTED RECORD DETAIL */}
                <div>
                  <h2 style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>
                    Record Details
                  </h2>
                  <div style={{ padding: '24px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    
                    {/* SCANS */}
                    {(selectedRecord.recordType === 'scan' || selectedRecord.recordType === 'scanGroup') && (
                      <div style={{ display: 'flex', gap: '32px' }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          {selectedRecord.originalFile?.url ? (
                            <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', height: '300px', position: 'relative', background: '#F1F5F9' }}>
                              <img src={selectedRecord.originalFile.url} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              <button style={{ position: 'absolute', bottom: '16px', right: '16px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                                View Full Size
                              </button>
                            </div>
                          ) : (
                            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F1F5F9', borderRadius: '16px', color: '#94A3B8' }}>
                              No image attached
                            </div>
                          )}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', background: '#F8FBFF', padding: '16px', borderRadius: '12px' }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Facility</div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{selectedRecord.facilityName || 'Unknown'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#94A3B8', textTransform: 'uppercase' }}>Radiologist</div>
                              <div style={{ fontSize: '13px', fontWeight: '500', color: '#334155' }}>{selectedRecord.doctorName || 'Unknown'}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div style={{ flex: '1.5' }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0EA5E9', marginTop: 0, marginBottom: '16px' }}>Report Findings</h3>
                          {selectedRecord.mlPipeline?.status === 'pending' ? (
                             <div style={{ display: 'flex', gap: '8px', color: '#94A3B8', fontSize: '14px', alignItems: 'center' }}>
                               <div style={{ width: '14px', height: '14px', border: '2px solid #CBD5E1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}/>
                               AI extraction in progress...
                             </div>
                          ) : (
                            <>
                              {selectedRecord.extractedData?.findings?.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                  {selectedRecord.extractedData.findings.map((finding, idx) => (
                                    <li key={idx} style={{ paddingLeft: '16px', borderLeft: '3px solid #E2E8F0', fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                                      {finding}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p style={{ fontSize: '14px', color: '#64748B' }}>No discrete findings extracted.</p>
                              )}

                              {selectedRecord.extractedData?.impression && (
                                <div style={{ marginTop: '32px', background: 'rgba(14,165,233,0.06)', borderLeft: '3px solid #0EA5E9', padding: '16px', borderRadius: '0 12px 12px 0' }}>
                                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#0369A1', marginBottom: '8px', textTransform: 'uppercase' }}>Impression</div>
                                  <div style={{ fontSize: '15px', color: '#0F172A', fontWeight: '500', lineHeight: '1.6' }}>
                                    {selectedRecord.extractedData.impression}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* LABS */}
                    {(selectedRecord.recordType === 'lab_report' || selectedRecord.recordType === 'lab') && (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Parameter</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Result</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Unit</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Ref Range</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedRecord.extractedData?.results?.map((row, idx) => {
                              const isLow = row.status === 'Low' || row.status?.toLowerCase().includes('low');
                              const isHigh = row.status === 'High' || row.status?.toLowerCase().includes('high');
                              const isAbnormal = isLow || isHigh || row.status === 'Abnormal';
                              
                              const bg = isAbnormal ? (isLow ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)') : 'transparent';
                              const statusColor = isAbnormal ? (isLow ? '#D97706' : '#DC2626') : '#15803D';
                              const StatusIcon = isAbnormal ? AlertTriangle : CheckCircle;

                              return (
                                <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} style={{ borderBottom: '1px solid #F1F5F9', background: bg }}>
                                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: '#0F172A' }}>{row.name}</td>
                                  <td style={{ padding: '16px', fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{row.value}</td>
                                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748B' }}>{row.unit}</td>
                                  <td style={{ padding: '16px', fontSize: '13px', color: '#64748B' }}>{row.referenceRange || `${row.referenceMin} - ${row.referenceMax}`}</td>
                                  <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: statusColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <StatusIcon size={14} /> {row.status}
                                  </td>
                                </motion.tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* PRESCRIPTIONS */}
                    {(selectedRecord.recordType === 'prescription' || selectedRecord.recordType === 'medication') && (
                      <div>
                        {selectedRecord.extractedData?.diagnosis && (
                          <div style={{ padding: '16px', background: '#F8FBFF', borderRadius: '12px', marginBottom: '24px', border: '1px solid #E0F2FE' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', color: '#0EA5E9', textTransform: 'uppercase' }}>Diagnosis / Indication</span>
                            <div style={{ fontSize: '15px', fontWeight: '500', color: '#0F172A', marginTop: '4px' }}>{selectedRecord.extractedData.diagnosis}</div>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                          {selectedRecord.extractedData?.medications?.map((med, idx) => (
                            <div key={idx} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: '#FEF3C7', color: '#D97706', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Pill size={20} />
                                </div>
                                <div>
                                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{med.brandName || med.name}</h4>
                                  <div style={{ fontSize: '13px', color: '#64748B' }}>{med.genericName}</div>
                                </div>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                                <span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}>{med.dosage}</span>
                                <span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}>{med.frequency}</span>
                                <span style={{ padding: '4px 10px', background: '#F1F5F9', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#334155' }}>{med.duration}</span>
                              </div>
                              {med.instructions && (
                                <div style={{ padding: '12px', background: '#FFFBEB', borderRadius: '8px', fontSize: '13px', color: '#92400E', border: '1px solid #FEF3C7' }}>
                                  <strong>Instructions:</strong> {med.instructions}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: AI SUMMARY */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '2px solid rgba(14,165,233,0.2)', paddingBottom: '12px', marginBottom: '16px' }}>
                    <Sparkles size={18} color="#0EA5E9" /> AI Summary 
                    <span style={{ textTransform: 'none', letterSpacing: 'normal', color: '#94A3B8', fontWeight: '500', marginLeft: 'auto', fontSize: '13px' }}>
                      Generated by MedAI
                    </span>
                  </div>
                  
                  <div style={{ padding: '32px', background: 'rgba(14,165,233,0.02)', border: '1px solid rgba(14,165,233,0.15)', borderLeft: '4px solid #0EA5E9', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
                    
                    {selectedRecord.aiSummary ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#0369A1' }}>AI Summary</span>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            {new Date(selectedRecord.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        
                        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>
                          {selectedRecord.aiSummary.split('\n\n').map((paragraph, i) => {
                            if (paragraph.startsWith('KEY FINDINGS') || paragraph.startsWith('RECOMMENDATION') || paragraph.startsWith('OVERALL')) {
                              const [label, ...rest] = paragraph.split('\n');
                              return (
                                <div key={i} style={{ marginTop: '24px' }}>
                                  <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#64748B', textTransform: 'uppercase', fontWeight: '700', marginBottom: '8px' }}>
                                    {label}
                                  </div>
                                  <div style={{ paddingLeft: '8px' }}>
                                    {rest.map((line, j) => (
                                      <div key={j} style={{ fontSize: '14px', marginBottom: '6px', fontStyle: label.includes('RECOMMEND') ? 'italic' : 'normal', color: label.includes('RECOMMEND') ? '#475569' : '#334155' }}>
                                        {line.startsWith('•') ? line : `• ${line}`}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            }
                            return <p key={i} style={{ margin: '0 0 16px 0' }}>{paragraph}</p>;
                          })}
                        </div>
                      </>
                    ) : selectedRecord.mlPipeline?.status === 'pending' ? (
                       <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: '20px', color: '#94A3B8' }}>
                          <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: '-100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)', animation: 'shimmer 2s infinite' }} />
                          <Sparkles size={24} style={{ opacity: 0.3, marginBottom: '12px' }} />
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>AI is reading your document...</div>
                       </div>
                    ) : (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94A3B8' }}>
                         <XCircle size={20} />
                         <span style={{ fontSize: '14px' }}>AI Summary unavailable for this record.</span>
                       </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: AI COMPARISON REPORT */}
                {allHistory.length > 1 && comparison && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '700', color: '#0F172A', letterSpacing: '0.04em', textTransform: 'uppercase', borderBottom: '2px solid rgba(139,92,246,0.2)', paddingBottom: '12px', marginBottom: '24px' }}>
                      <Brain size={18} color="#8B5CF6" /> AI Comparison Report
                      <span style={{ textTransform: 'none', letterSpacing: 'normal', color: '#64748B', fontWeight: '500', marginLeft: 'auto', fontSize: '13px' }}>
                        Comparing {new Date(selectedRecord.recordDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric'})} with Previous
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      
                      {/* Top Row — Side by Side Dates */}
                      <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={{ flex: 1, padding: '16px 24px', background: '#F8FBFF', border: '1px solid #E2E8F0', borderRadius: '12px', borderTop: '4px solid #0EA5E9' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#0EA5E9', letterSpacing: '0.08em', textTransform: 'uppercase' }}>CURRENT</span>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
                            {new Date(selectedRecord.recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>{selectedRecord.facilityName || 'Facility Details'}</div>
                        </div>
                        <div style={{ flex: 1, padding: '16px 24px', background: '#F8FBFF', border: '1px solid #E2E8F0', borderRadius: '12px', borderTop: '4px solid #94A3B8' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PREVIOUS</span>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: '#334155', marginTop: '8px' }}>
                            {allHistory.findIndex(r => r._id === selectedRecord._id) > 0 
                              ? new Date(allHistory[allHistory.findIndex(r => r._id === selectedRecord._id) - 1].recordDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                              : 'Initial Record'
                            }
                          </div>
                          <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                            {allHistory.findIndex(r => r._id === selectedRecord._id) > 0 
                              ? (allHistory[allHistory.findIndex(r => r._id === selectedRecord._id) - 1].facilityName || 'Facility Details')
                              : 'N/A'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Scans: Side-by-side images */}
                      {(selectedRecord.recordType === 'scan' || selectedRecord.recordType === 'scanGroup') && (
                        <div style={{ display: 'flex', gap: '24px' }}>
                          <div style={{ flex: 1, height: '280px', background: '#F1F5F9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', position: 'relative' }}>
                            {selectedRecord.originalFile?.url && selectedRecord.originalFile.url !== 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg' ? (
                              <img src={selectedRecord.originalFile.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Current Scan" />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '8px' }}>
                                <FileText size={32} style={{ opacity: 0.4 }} />
                                <span style={{ fontSize: '13px' }}>Image not uploaded</span>
                                <span style={{ fontSize: '11px', color: '#CBD5E1' }}>Current</span>
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, height: '280px', background: '#F1F5F9', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E2E8F0', opacity: 0.85, filter: 'grayscale(15%)' }}>
                            {(() => {
                              const prevIdx = allHistory.findIndex(r => r._id === selectedRecord._id) - 1;
                              const prevUrl = prevIdx >= 0 ? allHistory[prevIdx]?.originalFile?.url : null;
                              const isPlaceholder = !prevUrl || prevUrl === 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg';
                              return isPlaceholder ? (
                                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '8px' }}>
                                  <FileText size={32} style={{ opacity: 0.3 }} />
                                  <span style={{ fontSize: '13px' }}>Image not uploaded</span>
                                  <span style={{ fontSize: '11px', color: '#CBD5E1' }}>Previous</span>
                                </div>
                              ) : (
                                <img src={prevUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Previous Scan" />
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Labs: Changes Table & Recharts Trend */}
                      {(selectedRecord.recordType === 'lab_report' || selectedRecord.recordType === 'lab') && comparison.changes?.length > 0 && (
                        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                              <thead style={{ background: '#F8FBFF' }}>
                                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Parameter</th>
                                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#0EA5E9', fontWeight: '700', textTransform: 'uppercase' }}>Current</th>
                                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Previous</th>
                                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Change</th>
                                  <th style={{ padding: '12px 20px', fontSize: '12px', color: '#64748B', fontWeight: '700', textTransform: 'uppercase' }}>Significance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {comparison.changes.map((row, idx) => {
                                  const isWorsened = row.significance?.toLowerCase().includes('worsened') || row.significance?.toLowerCase().includes('increased') && row.parameter !== 'HDL Cholesterol';
                                  const isImproved = row.significance?.toLowerCase().includes('improved');
                                  
                                  return (
                                    <motion.tr key={idx} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>{row.parameter}</td>
                                      <td style={{ padding: '16px 20px', fontSize: '15px', fontWeight: '700', color: '#0F172A' }}>{row.current}</td>
                                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#64748B' }}>{row.previous}</td>
                                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700', color: row.change.includes('↑') ? (isWorsened ? '#DC2626' : '#10B981') : (row.change.includes('↓') ? (isWorsened ? '#DC2626' : '#10B981') : '#94A3B8') }}>
                                        {row.change}
                                      </td>
                                      <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '500', color: isWorsened ? '#D97706' : (isImproved ? '#15803D' : '#64748B') }}>
                                        {row.significance}
                                      </td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* RECHARTS TREND GRAPHS */}
                          <div style={{ padding: '24px', borderTop: '1px dashed #E2E8F0', background: '#FAFAFA' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', marginTop: 0 }}>Parameter Trends (All History)</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                              {comparison.changes.map(changeParam => {
                                // Extract longitudinal data points for this specific parameter
                                const chartData = allHistory.map(rec => {
                                  const res = rec.extractedData?.results?.find(r => r.name === changeParam.parameter);
                                  return {
                                    date: new Date(rec.recordDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                                    value: res ? parseFloat(res.value) : null
                                  };
                                }).filter(d => d.value !== null && !isNaN(d.value));

                                if (chartData.length < 2) return null;

                                return (
                                  <div key={changeParam.parameter} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#0F172A', marginBottom: '12px' }}>{changeParam.parameter}</div>
                                    <div style={{ height: '140px', width: '100%' }}>
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                          <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} tick={{fill:'#94A3B8'}} />
                                          <YAxis domain={['auto', 'auto']} fontSize={10} tickLine={false} axisLine={false} tick={{fill:'#94A3B8'}} />
                                          <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: '600' }}
                                            labelStyle={{ color: '#64748B', marginBottom: '4px' }}
                                            itemStyle={{ color: '#0EA5E9' }}
                                          />
                                          <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} animationDuration={1000} />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* AI COMPARISON NARRATIVE CARD */}
                      <div style={{ padding: '32px', background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.2)', borderLeft: '4px solid #8B5CF6', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <span style={{ fontSize: '16px', fontWeight: '700', color: '#6D28D9' }}>AI Comparison Analysis</span>
                          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: '500' }}>
                            Comparing {allHistory.length} records
                          </span>
                        </div>
                        
                        {/* Overall Trend Badge */}
                        <div style={{ marginBottom: '24px' }}>
                          <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#8B5CF6', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>OVERALL TREND</div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '6px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: '700',
                            background: comparison.overallTrend === 'improving' ? 'rgba(16,185,129,0.1)' : comparison.overallTrend === 'worsening' ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                            color: comparison.overallTrend === 'improving' ? '#059669' : comparison.overallTrend === 'worsening' ? '#DC2626' : '#64748B',
                            border: `1px solid ${comparison.overallTrend === 'improving' ? 'rgba(16,185,129,0.3)' : comparison.overallTrend === 'worsening' ? 'rgba(239,68,68,0.3)' : 'rgba(100,116,139,0.3)'}`
                          }}>
                            {comparison.overallTrend === 'improving' ? '↑ Improving' : comparison.overallTrend === 'worsening' ? '↓ Worsening' : '→ Stable'}
                          </span>
                        </div>

                        {/* Parsed AI Insight Sections */}
                        <div style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>
                          {comparison.aiInsight?.split('\n\n').map((section, sIdx) => {
                            if (!section.trim()) return null;
                            const lines = section.split('\n');
                            const firstLine = lines[0].trim();
                            const isHeader = firstLine === firstLine.toUpperCase() && firstLine.length < 60;
                            const isClinical = firstLine.includes('CLINICAL NOTE');
                            
                            if (isHeader) {
                              const bodyLines = lines.slice(1).filter(l => l.trim());
                              const hasBullets = bodyLines.some(l => l.trim().startsWith('•'));
                              return (
                                <div key={sIdx} style={{ marginBottom: '24px' }}>
                                  <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: isClinical ? '#EF4444' : '#8B5CF6', textTransform: 'uppercase', fontWeight: '600', marginBottom: '8px' }}>{firstLine}</div>
                                  {hasBullets ? (
                                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                      {bodyLines.map((line, lIdx) => (
                                        <li key={lIdx} style={{ fontSize: '14px', marginBottom: '6px', paddingLeft: '16px', color: isClinical ? '#64748B' : '#334155', fontStyle: isClinical ? 'italic' : 'normal', position: 'relative' }}>
                                          <span style={{ position: 'absolute', left: 0 }}>•</span>
                                          {line.replace(/^•\s*/, '')}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p style={{ margin: 0, fontSize: isClinical ? '13px' : '14px', color: isClinical ? '#64748B' : '#475569', fontStyle: isClinical ? 'italic' : 'normal', lineHeight: '1.7' }}>
                                      {bodyLines.join(' ')}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return <p key={sIdx} style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.7', color: '#334155' }}>{section}</p>;
                          })}
                          
                          {/* Clinical Note fallback */}
                          {comparison.clinicalNote && !comparison.aiInsight?.includes('CLINICAL NOTE') && (
                            <div style={{ borderTop: '1px solid rgba(139,92,246,0.1)', paddingTop: '16px', marginTop: '24px' }}>
                              <div style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#EF4444', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>CLINICAL NOTE</div>
                              <p style={{ margin: 0, fontSize: '13px', color: '#64748B', fontStyle: 'italic' }}>{comparison.clinicalNote}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* SECTION 5: ACTION BAR */}
        <div style={{ position: 'sticky', bottom: 0, left: 0, width: '100%', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderTop: '1px solid #E2E8F0', padding: '16px 48px', display: 'flex', justifyContent: 'center', gap: '16px', zIndex: 100 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'transparent', border: '1px solid #CBD5E1', borderRadius: '100px', fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Download size={18} /> Export PDF
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#0EA5E9', border: 'none', borderRadius: '100px', fontSize: '14px', fontWeight: '600', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14,165,233,0.3)', transition: 'all 0.2s' }}>
            <Share2 size={18} /> Share with Doctor
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#F8FBFF', border: '1px solid #0EA5E9', borderRadius: '100px', fontSize: '14px', fontWeight: '600', color: '#0EA5E9', cursor: 'pointer', transition: 'all 0.2s' }}>
            <Sparkles size={18} /> Add to AI Insights
          </button>
        </div>

      </motion.div>
    </AnimatePresence>
  );
};

export default ViewComparePage;
