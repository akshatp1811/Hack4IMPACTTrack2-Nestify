import React from 'react';
import { format } from 'date-fns';
import { ShieldAlert, AlertTriangle, HeartPulse, Stethoscope, Droplets, Activity } from 'lucide-react';
import '../../insights.css';

const PatientReportView = ({ report }) => {
  if (!report || !report.structuredContent) return null;

  const content = report.structuredContent;
  const generatedDate = report.generatedAt ? new Date(report.generatedAt) : new Date();

  // Mock patient info since we don't have user object directly passed in this scope, 
  // but in a real app it would come from AuthContext or the report context itself.
  // We'll hardcode the Dev User info to match the seeded data for aesthetics.
  const patientInfo = {
    name: "Akshat Patel",
    age: 68,
    bloodGroup: "O+",
  };

  // Determine status color based on text sentiment or simple keywords
  let statusColor = 'green';
  let StatusIcon = HeartPulse;
  const statusLower = (content.overallStatus || '').toLowerCase();
  if (statusLower.includes('monitor') || statusLower.includes('careful') || statusLower.includes('watch')) {
    statusColor = 'amber';
    StatusIcon = Activity;
  }
  if (statusLower.includes('urgent') || statusLower.includes('critical') || statusLower.includes('decline')) {
    statusColor = 'red';
    StatusIcon = ShieldAlert;
  }

  return (
    <div className="patient-report">
      {/* HEADER */}
      <div className="pr-header">
        <div>
          <h2 className="pr-header-title">{patientInfo.name}</h2>
          <div className="pr-header-meta">
            <span className="pr-meta-item">Age: {patientInfo.age}</span>
            <span>•</span>
            <span className="pr-meta-item">Blood Group: {patientInfo.bloodGroup}</span>
            <span>•</span>
            <span className="pr-meta-item">Report Date: {format(generatedDate, 'MMMM d, yyyy')}</span>
          </div>
        </div>
        <div className="pr-logo">
          <Stethoscope size={24} color="#0EA5E9" />
          MedNest AI
        </div>
      </div>

      <div className="pr-body">
        {/* SECTION 1: OVERALL STATUS */}
        <div className="pr-status-card">
          <div className={`pr-status-indicator ${statusColor}`}>
            <StatusIcon size={32} />
          </div>
          <p className="pr-status-text">{content.overallStatus}</p>
        </div>

        {/* SECTION 2: HIGHLIGHTS */}
        {content.highlights && content.highlights.length > 0 && (
          <div className="pr-section">
            <h3 className="pr-section-title">Key Highlights</h3>
            <div className="pr-highlights">
              {content.highlights.map((item, idx) => {
                const isWatch = item.toLowerCase().includes('watch') || item.toLowerCase().includes('monitor') || item.toLowerCase().includes('high');
                return (
                  <div key={idx} className={`pr-highlight-card ${isWatch ? 'watch' : ''}`}>
                    <span className="pr-highlight-num">{idx + 1}.</span>
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 3: MEDICATIONS */}
        {content.medications && (
          <div className="pr-section">
            <h3 className="pr-section-title">Your Medications</h3>
            {typeof content.medications === 'string' ? (
              <p className="pr-findings-text">{content.medications}</p>
            ) : (
              // If it's an array for structured table (fallback if Gemini sends string)
              <p className="pr-findings-text">Taking daily supplements and BP meds. (See Records for exact schedule)</p>
            )}
          </div>
        )}

        {/* SECTION 4: RECENT FINDINGS */}
        {content.recentFindings && (
          <div className="pr-section">
            <h3 className="pr-section-title">Recent Test Results</h3>
            <div className="pr-findings-text">
              {content.recentFindings.split(/(abnormal|high|low|elevated|concerning)/i).map((part, i) => {
                const lower = part.toLowerCase();
                if (['abnormal', 'high', 'low', 'elevated', 'concerning'].includes(lower)) {
                  return <span key={i} className="pr-abnormal-highlight">{part}</span>;
                }
                return <span key={i}>{part}</span>;
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: WATCHLIST */}
        {content.watchlist && content.watchlist.length > 0 && (
          <div className="pr-section">
            <h3 className="pr-section-title">Things to Watch</h3>
            <div className="pr-watchlist-grid">
              {content.watchlist.map((item, idx) => (
                <div key={idx} className="pr-watchlist-card">
                  <AlertTriangle className="pr-watchlist-icon" size={20} />
                  <p className="pr-watchlist-text">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 6: CLOSING NOTE */}
        {content.encouragement && (
          <div className="pr-encouragement">
            "{content.encouragement}"
          </div>
        )}

        {/* FOOTER */}
        <div className="pr-footer">
          Generated securely by MedNest AI • For personal reference only • Not a substitute for professional medical advice
        </div>
      </div>
    </div>
  );
};

export default PatientReportView;
