import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSharedReport } from '../services/api';
import PatientReportView from '../components/insights/PatientReportView';
import DoctorReportView from '../components/insights/DoctorReportView';
import InsuranceReportView from '../components/insights/InsuranceReportView';
import '../insights.css';

const SharedReportPage = () => {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedReport = async () => {
      try {
        const response = await getSharedReport(token);
        setReport(response.data.data.report);
      } catch (err) {
        console.error('Failed to fetch shared report', err);
        setError('This shared report link is invalid, has expired, or was removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedReport();
  }, [token]);

  if (loading) {
    return (
      <div className="insights-page" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <p>Loading shared report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="insights-page" style={{ paddingTop: '100px', textAlign: 'center' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '40px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <h2 style={{ fontFamily: 'Sora', color: '#0F172A', marginBottom: '16px' }}>Link Expired</h2>
          <p style={{ color: '#64748B', marginBottom: '24px' }}>{error}</p>
          <Link to="/" style={{ color: '#0EA5E9', fontWeight: '600', textDecoration: 'none' }}>Back to MedNest</Link>
        </div>
      </div>
    );
  }

  const renderReport = () => {
    if (report.reportType === 'doctor') return <DoctorReportView report={report} />;
    if (report.reportType === 'insurance') return <InsuranceReportView report={report} />;
    return <PatientReportView report={report} />;
  };

  return (
    <div className="insights-page">
      {/* Read-Only CTA Banner */}
      <div style={{ background: '#0F172A', color: '#fff', textAlign: 'center', padding: '12px', fontSize: '14px', position: 'sticky', top: 0, zIndex: 100 }}>
        You are viewing a secure, read-only AI health summary. 
        <Link to="/" style={{ color: '#38BDF8', marginLeft: '12px', fontWeight: '600', textDecoration: 'none' }}>Create your own on MedNest →</Link>
      </div>

      <div className="insights-content" style={{ padding: '40px' }}>
        <div className="report-container" style={{ minHeight: '80vh' }}>
          {renderReport()}
        </div>
      </div>
    </div>
  );
};

export default SharedReportPage;
