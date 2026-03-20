import React from 'react';
import { LineChart, Line, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import '../../insights.css';

const RiskGauge = ({ score }) => {
  const radius = 50;
  const strokeWidth = 10;
  const circumference = radius * Math.PI; // semicircle
  const percent = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  let color = '#22C55E'; // green
  let label = 'Low Risk';
  if (score >= 40) { color = '#F59E0B'; label = 'Moderate Risk'; }
  if (score >= 70) { color = '#EF4444'; label = 'High Risk'; }

  return (
    <div className="ins-gauge-container">
      <svg width="120" height="70" viewBox="0 0 120 70" className="ins-gauge-svg">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="ins-gauge-score" style={{ color }}>{score}</div>
      <div className="ins-gauge-label">{label}</div>
    </div>
  );
};

const InsuranceReportView = ({ report }) => {
  if (!report || !report.structuredContent) return null;
  const content = report.structuredContent;
  const ctx = report.contextSnapshot || {};
  const demo = ctx.demographics || {};

  return (
    <div className="ins-report-container">
      {/* Header Band */}
      <div className="ins-header-band">
        <div className="ins-header-info">
          <h1 className="ins-patient-name">{ctx?.patientName || 'Patient Report'}</h1>
          <div className="ins-subtitle">Health History Summary — Insurance Reference</div>
          <div className="ins-demographics">
            {demo.age || '--'} yrs • {demo.gender || '--'} • Generated: {new Date(report.generatedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="ins-header-score">
          <RiskGauge score={content.riskScore || 0} />
        </div>
      </div>

      <div className="ins-body">
        {/* Section 1: Risk Factors */}
        {content.riskFactors && content.riskFactors.length > 0 && (
          <div className="ins-section">
            <h2 className="ins-h2">Identified Risk Factors</h2>
            <ol className="ins-risk-list">
              {content.riskFactors.map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Section 2: Health History Timeline */}
        {content.healthHistory && content.healthHistory.length > 0 && (
          <div className="ins-section">
            <h2 className="ins-h2">Health History</h2>
            <div className="ins-timeline">
              {content.healthHistory.map((yearGroup, i) => (
                <div key={i} className="ins-timeline-year-group">
                  <div className="ins-timeline-year-badge">{yearGroup.year}</div>
                  <div className="ins-timeline-events">
                    {yearGroup.events.map((ev, eIdx) => (
                      <div key={eIdx} className="ins-timeline-event">
                        <div className="ins-event-dot"></div>
                        <div className="ins-event-date">{ev.date}</div>
                        <div className="ins-event-desc">{ev.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 3: Current Health Status */}
        {content.currentHealthStatus && (
          <div className="ins-section">
            <h2 className="ins-h2">Current Health Status</h2>
            <div className="ins-status-grid">
              <div className="ins-status-col">
                <div className="ins-status-title">Active Conditions</div>
                <ul className="ins-status-list">
                  {(content.currentHealthStatus.activeConditions || []).map((cond, i) => (
                    <li key={i}><ShieldAlert size={14} className="doc-text-slate-muted"/> {cond}</li>
                  ))}
                  {(!content.currentHealthStatus.activeConditions || content.currentHealthStatus.activeConditions.length === 0) && (
                    <li className="doc-text-muted">No active conditions recorded</li>
                  )}
                </ul>
              </div>
              <div className="ins-status-col">
                <div className="ins-status-title">Current Medications</div>
                <ul className="ins-status-list">
                  {(content.currentHealthStatus.currentMedications || []).map((med, i) => (
                    <li key={i}><CheckCircle size={14} className="doc-text-slate-muted"/> {med}</li>
                  ))}
                  {(!content.currentHealthStatus.currentMedications || content.currentHealthStatus.currentMedications.length === 0) && (
                    <li className="doc-text-muted">No active medications</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Key Health Trends */}
        {content.keyTrends && content.keyTrends.length > 0 && (
          <div className="ins-section">
            <h2 className="ins-h2">Key Health Trends</h2>
            <div className="ins-charts-grid">
              {content.keyTrends.map((trend, i) => {
                const data = trend.trend.map((val, idx) => ({ name: idx, value: val }));
                const avg = trend.trend.reduce((a, b) => a + b, 0) / trend.trend.length;
                return (
                  <div key={i} className="ins-chart-card">
                    <div className="ins-chart-header">
                      <span className="ins-chart-title">{trend.metric}</span>
                      <span className="ins-chart-current">{trend.current}</span>
                    </div>
                    <div className="ins-chart-wrap" style={{ height: '140px', width: '100%', marginTop: '16px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                          <ReferenceLine y={avg} stroke="#E2E8F0" strokeDasharray="3 3" />
                          <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 3, fill: '#0EA5E9' }} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 5: Data Completeness */}
        {content.dataCompleteness !== undefined && (
          <div className="ins-section">
            <h2 className="ins-h2">Data Completeness</h2>
            <div className="ins-completeness-wrapper">
              <div className="ins-completeness-bar">
                <div 
                  className="ins-completeness-fill" 
                  style={{ width: `${content.dataCompleteness}%` }}
                ></div>
              </div>
              <div className="ins-completeness-meta">
                <span className="ins-pct-text">{content.dataCompleteness}%</span> Complete
              </div>
            </div>
            <p className="ins-completeness-note">
              Health data completeness — higher completeness leads to more accurate risk assessment.
            </p>
          </div>
        )}

      </div>
      
      {/* Footer */}
      <div className="ins-footer">
        Generated by MedNest AI · Insurance Reference Document · Data sourced from patient-uploaded medical records
      </div>
    </div>
  );
};

export default InsuranceReportView;
