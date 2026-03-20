import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, FileText, ChevronDown, ChevronUp, Image as ImageIcon, Activity, CheckSquare } from 'lucide-react';
import '../../insights.css';

const DoctorReportView = ({ report }) => {
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState({ 0: true });

  if (!report || !report.structuredContent) return null;
  const content = report.structuredContent;
  const ctx = report.contextSnapshot || {};
  const demo = ctx.demographics || {};

  const toggleGroup = (idx) => {
    setOpenGroups(prev => ({...prev, [idx]: !prev[idx]}));
  };

  const getRiskColor = (level) => {
    if (level === 'high') return 'red';
    if (level === 'moderate' || level === 'amber') return 'amber';
    return 'green';
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('active') || s.includes('uncontrolled') || s.includes('high') || s.includes('abnormal')) return 'badge-red';
    if (s.includes('controlled') || s.includes('stable')) return 'badge-amber';
    return 'badge-green';
  };

  return (
    <div className="doc-report-container">
      {/* Header Band */}
      <div className="doc-header-band">
        <div className="doc-header-main">
          <h1 className="doc-patient-name">{ctx?.patientName || 'Patient Report'}</h1>
          <div className="doc-subtitle">Clinical Summary — For Physician Use</div>
        </div>
        <div className="doc-demographics-row">
          <div className="doc-demo-item"><span>Age</span>{demo.age || '--'} yrs</div>
          <div className="doc-demo-item"><span>Gender</span>{demo.gender || '--'}</div>
          <div className="doc-demo-item"><span>Blood</span>{demo.bloodGroup || '--'}</div>
          <div className="doc-demo-item"><span>BMI</span>{demo.bmi || '--'}</div>
        </div>
        <div className="doc-report-meta">
          <span>Generated:</span> {new Date(report.generatedAt).toLocaleDateString()}
        </div>
      </div>

      <div className="doc-body">
        {/* Section 1: Clinical Summary */}
        <div className="doc-section summary-sect">
          <div className="doc-section-header with-risk">
            <h2 className="doc-h2">Clinical Summary</h2>
            {content.riskLevel && (
              <div className={`doc-risk-indicator risk-${getRiskColor(content.riskLevel)}`}>
                <Activity size={18} />
                Risk: {content.riskLevel.toUpperCase()}
              </div>
            )}
          </div>
          <p className="doc-clinical-text">{content.clinicalSummary}</p>
        </div>

        {/* Section 2: Active Problem List */}
        {content.activeProblemList && content.activeProblemList.length > 0 && (
          <div className="doc-section">
            <h2 className="doc-h2">Active Problem List</h2>
            <div className="doc-table-wrapper">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>First Noted</th>
                    <th>Managing Doctor</th>
                  </tr>
                </thead>
                <tbody>
                  {content.activeProblemList.map((prob, i) => (
                    <tr key={i}>
                      <td className="doc-fw-600">{prob.condition}</td>
                      <td>
                        <span className={`doc-status-badge ${getStatusBadgeClass(prob.status)}`}>
                          {prob.status || 'Active'}
                        </span>
                      </td>
                      <td>{prob.firstNoted || '--'}</td>
                      <td>{prob.managingDoctor || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Medication Review */}
        {content.medicationReview && content.medicationReview.length > 0 && (
          <div className="doc-section">
            <h2 className="doc-h2">Medication Review</h2>
            <div className="doc-table-wrapper">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Medication</th>
                    <th>Dose</th>
                    <th>Frequency</th>
                    <th style={{ width: '180px' }}>Adherence</th>
                    <th>Concerns</th>
                  </tr>
                </thead>
                <tbody>
                  {content.medicationReview.map((med, i) => {
                    const adPct = Number(med.adherencePct) || 0;
                    const isLow = adPct < 80;
                    return (
                      <tr key={i}>
                        <td className="doc-fw-600">{med.medication}</td>
                        <td>{med.dose}</td>
                        <td>{med.frequency}</td>
                        <td>
                          <div className="doc-adherence-cell">
                            <div className="doc-progress-bar">
                              <div 
                                className={`doc-progress-fill ${isLow ? 'bg-amber' : 'bg-green'}`} 
                                style={{ width: `${adPct}%` }}
                              ></div>
                            </div>
                            <span className={isLow ? 'doc-text-amber doc-fw-600' : 'doc-text-slate'}>{adPct}%</span>
                          </div>
                        </td>
                        <td>
                          {isLow && med.concerns !== 'None' ? (
                            <span className="doc-concern-flag"><AlertCircle size={14}/> {med.concerns}</span>
                          ) : (
                            <span className="doc-text-muted">{med.concerns || '--'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Investigation Summary */}
        {content.investigationSummary && content.investigationSummary.length > 0 && (
          <div className="doc-section">
            <h2 className="doc-h2">Investigation Summary</h2>
            <div className="doc-accordion-container">
              {content.investigationSummary.map((group, idx) => {
                const isOpen = openGroups[idx];
                const isScan = group.groupType?.toLowerCase().includes('scan') || group.groupType?.toLowerCase().includes('imaging');
                
                return (
                  <div key={idx} className={`doc-accordion ${isOpen ? 'open' : ''}`}>
                    <div className="doc-accordion-header" onClick={() => toggleGroup(idx)}>
                      <div className="doc-acc-title">
                        {isScan ? <ImageIcon size={20} className="doc-text-sky"/> : <FileText size={20} className="doc-text-sky"/>}
                        {group.groupType || 'Results'}
                        <span className="doc-acc-count">{group.items?.length || 0} items</span>
                      </div>
                      <div className="doc-acc-icon">
                        {isOpen ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </div>
                    </div>
                    
                    {isOpen && (
                      <div className="doc-accordion-body">
                        {isScan ? (
                          <div className="doc-scan-list">
                            {group.items.map((scan, sIdx) => (
                              <div key={sIdx} className="doc-scan-card">
                                {scan.originalFile?.url ? (
                                  <img src={scan.originalFile.url} alt="Scan thumbnail" className="doc-scan-thumb"/>
                                ) : (
                                  <div className="doc-scan-thumb"><ImageIcon size={24} className="doc-text-muted"/></div>
                                )}
                                <div className="doc-scan-info">
                                  <div className="doc-scan-meta">
                                    <span className="doc-fw-600">{scan.date}</span> • {scan.facility || 'Facility'}
                                  </div>
                                  <div className="doc-scan-impression">"{scan.impression || scan.name || 'No impression extracted'}"</div>
                                </div>
                                <button 
                                  className="doc-btn-view-scan"
                                  onClick={() => navigate(`/records/compare?groupKey=chest_xray`)}
                                >
                                  View Scan
                                </button>
                              </div>
                            ))}
                            {group.items.length === 0 && <div className="doc-text-muted">No specific item details available.</div>}
                          </div>
                        ) : (
                          <div className="doc-table-wrapper mini">
                            <table className="doc-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Parameter</th>
                                  <th>Value</th>
                                  <th>Status</th>
                                  <th>Trend</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.items.map((item, iIdx) => (
                                  <tr key={iIdx}>
                                    <td>{item.date || new Date().toLocaleDateString()}</td>
                                    <td className="doc-fw-600">{item.name}</td>
                                    <td>{item.value}</td>
                                    <td>
                                      <span className={`doc-status-badge ${getStatusBadgeClass(item.status)}`}>
                                        {item.status || 'Normal'}
                                      </span>
                                    </td>
                                    <td className="doc-trend-cell">{item.trendAction || '→'}</td>
                                  </tr>
                                ))}
                                {group.items.length === 0 && (
                                  <tr><td colSpan="5" className="doc-text-muted text-center py-4">No specific item details available.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 5: Risk Flags */}
        {content.riskFlags && content.riskFlags.length > 0 && (
          <div className="doc-section">
            <h2 className="doc-h2 doc-text-red">Clinical Risk Flags</h2>
            <div className="doc-flags-grid">
              {content.riskFlags.map((flag, i) => (
                <div key={i} className="doc-flag-card">
                  <div className="doc-flag-icon"><AlertCircle size={22} /></div>
                  <div className="doc-flag-text">{flag}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 6: Recommended Actions */}
        {content.recommendedActions && content.recommendedActions.length > 0 && (
          <div className="doc-section">
            <h2 className="doc-h2">Recommended Actions</h2>
            <div className="doc-actions-list">
              {content.recommendedActions.map((act, i) => (
                <div key={i} className="doc-action-card">
                  <div className="doc-checkbox"><CheckSquare size={22} /></div>
                  <div className="doc-action-text">{act}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReportView;
