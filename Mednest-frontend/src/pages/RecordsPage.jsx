// src/pages/RecordsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Filter, ArrowLeft, Plus, Users, FileText, ChevronLeft } from 'lucide-react';
import '../records.css';

import { groupRecords, groupByMonthAndYear } from '../data/records';
import { fetchAllRecords } from '../services/api';
import { VisitCard, ScanCard, LabCard, MedicationCard, ConsultationCard } from '../components/records/CardComponents';
import ViewComparePage from './ViewComparePage';
import AddRecordModal from '../components/records/AddRecordModal';
import Navbar from '../components/Navbar';

const FILTERS = [
  { id: 'all', label: 'All Records' },
  { id: 'visit', label: 'Visits' },
  { id: 'scan', label: 'Scans' },
  { id: 'lab', label: 'Lab Reports' },
  { id: 'medication', label: 'Medications' },
  { id: 'consultation', label: 'Consultations' }
];

const RecordsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'grouped'
  const [selectedGroupKey, setSelectedGroupKey] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // basic mock state

  const [compareRecord, setCompareRecord] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // New state for live API data
  const [dbRecords, setDbRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch records on mount
  const loadRecords = async () => {
    try {
      setIsLoading(true);
      const res = await fetchAllRecords();
      
      // Map backend schema to frontend expectations
      const mapped = (res.data.records || []).map(r => ({
        id: r._id,
        // Backend 'lab_report' -> Frontend 'lab', etc.
        type: r.recordType === 'lab_report' ? 'lab' : r.recordType,
        subType: r.subType,
        date: r.recordDate,
        time: new Date(r.recordDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        title: r.subType || (r.recordType.charAt(0).toUpperCase() + r.recordType.slice(1)),
        doctor: r.doctorName || 'Unknown Doctor',
        facility: r.facilityName || 'Unknown Facility',
        // Support scans
        report: r.recordType === 'scan' ? {
          date: new Date(r.recordDate).toLocaleDateString(),
          findings: r.aiSummary || 'No summary yet',
          impression: r.userNotes || 'No notes provided'
        } : undefined,
        // Support UI for files
        originalFile: r.originalFile,
        mlPipeline: r.mlPipeline
      }));
      
      setDbRecords(mapped);
    } catch (err) {
      setToast('Failed to load records from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  // Handle filter clicks uniquely to reset sub-views
  const handleFilterClick = (fId) => {
    setActiveFilter(fId);
    setViewMode('timeline');
    setSelectedGroupKey(null);
  };

  // 1. Filter raw records strictly based on text search and category
  const filteredRaw = useMemo(() => {
    return dbRecords.filter(r => {
      // If a specific group is selected, override category filter and grab exact matches
      if (selectedGroupKey) {
        if (activeFilter === 'visit' && r.doctor !== selectedGroupKey) return false;
        if (activeFilter === 'lab' && (r.type !== 'lab' || r.subType !== selectedGroupKey)) return false;
      } else {
        // Standard category filter
        if (activeFilter !== 'all' && r.type !== activeFilter) return false;
      }
      
      // Text search (if > 2 chars or exact)
      if (searchQuery.length > 2) {
        const q = searchQuery.toLowerCase();
        const textBlob = JSON.stringify(r).toLowerCase();
        if (!textBlob.includes(q)) return false;
      }
      return true;
    });
  }, [searchQuery, activeFilter, dbRecords, selectedGroupKey]);

  // Groupings logic for the New Grid Views
  const doctorsGroups = useMemo(() => {
    const groups = {};
    dbRecords.forEach(r => {
      if (['visit', 'consultation', 'medication'].includes(r.type)) {
        const docName = r.doctor || 'Unknown Doctor';
        if (!groups[docName]) {
          groups[docName] = { name: docName, records: [], visits: 0, scripts: 0 };
        }
        groups[docName].records.push(r);
        if (['visit', 'consultation'].includes(r.type)) groups[docName].visits++;
        if (r.type === 'medication') groups[docName].scripts++;
      }
    });
    return Object.values(groups).sort((a,b) => b.records.length - a.records.length);
  }, [dbRecords]);

  const labGroups = useMemo(() => {
    const groups = {};
    dbRecords.forEach(r => {
      if (r.type === 'lab') {
        const typeName = r.subType || 'General Report';
        if (!groups[typeName]) {
          groups[typeName] = { name: typeName, records: [] };
        }
        groups[typeName].records.push(r);
      }
    });
    return Object.values(groups).sort((a,b) => b.records.length - a.records.length);
  }, [dbRecords]);

  // 2. Group the filtered records (Smart Grouping)
  const groupedNodes = useMemo(() => groupRecords(filteredRaw), [filteredRaw]);

  // 3. Build the Spine (Years and Months)
  const spineData = useMemo(() => groupByMonthAndYear(groupedNodes), [groupedNodes]);

  const handleCompare = (record) => {
    setCompareRecord(record);
    setDrawerOpen(true);
  };
  const handleRecordAdded = (record) => {
    setToast(`✓ Record added successfully`);
    setTimeout(() => setToast(null), 3500);
    // Reload data from backend to show new record
    loadRecords();
  };

  return (
    <div className="records-page">
      <Navbar />
      {/* HEADER ZONE */}
      <header className="records-header" style={{ top: '72px' }}>
        <div className="records-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B', transition: 'color 0.2s', padding: 0 }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0EA5E9'}
              onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
            >
              <ArrowLeft size={28} />
            </button>
            <div className="records-logo-zone">
              <h1 className="records-title">Health Records</h1>
              <p className="records-subtitle">Your complete medical history, organized intelligently</p>
            </div>
          </div>
          <div className="records-controls">
            <div className="search-bar">
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search records, doctors, dates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.85)', padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.12)', fontSize: '14px', color: '#64748B', cursor: 'pointer' }}>
              <Calendar size={16} /> All time
            </div>
            <button onClick={() => setAddModalOpen(true)} style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0EA5E9', transition: 'all 0.2s' }}>
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Filter Bar with Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="filters-row">
            <Filter size={16} color="#94A3B8" style={{ marginTop: '8px', marginRight: '8px' }}/>
            {FILTERS.map(f => (
              <button 
                key={f.id} 
                className={`filter-pill ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => handleFilterClick(f.id)}
              >
                {f.label}
                {activeFilter === f.id && f.id !== 'all' && !selectedGroupKey && <span style={{ background: '#FFFFFF', color: '#0EA5E9', padding: '2px 6px', borderRadius: '100px', fontSize: '10px', marginLeft: '6px' }}>{filteredRaw.length}</span>}
              </button>
            ))}
          </div>

          {(activeFilter === 'visit' || activeFilter === 'lab') && !selectedGroupKey && (
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '4px', borderRadius: '8px', marginTop: '16px' }}>
              <button 
                onClick={() => setViewMode('timeline')}
                style={{ background: viewMode === 'timeline' ? '#fff' : 'transparent', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: viewMode === 'timeline' ? '#0F172A' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'timeline' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                Timeline
              </button>
              <button 
                onClick={() => setViewMode('grouped')}
                style={{ background: viewMode === 'grouped' ? '#fff' : 'transparent', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: viewMode === 'grouped' ? '#0F172A' : '#64748B', cursor: 'pointer', boxShadow: viewMode === 'grouped' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s' }}>
                Grouped by {activeFilter === 'visit' ? 'Doctor' : 'Category'}
              </button>
            </div>
          )}
        </div>
      </header>

      <ViewComparePage 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        initialRecord={compareRecord} 
      />

      {/* TIMELINE ENGINE */}
      <div style={{ display: 'flex', gap: '32px', maxWidth: '1400px', margin: '0 auto', paddingRight: '20px' }}>
        <main className="timeline-viewport" style={{ flex: 1, paddingRight: '0' }}>
        
        {viewMode === 'grouped' && !selectedGroupKey ? (
          <div style={{ padding: '60px 0 80px 0', width: '100%', boxSizing: 'border-box' }}>
            {activeFilter === 'visit' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {doctorsGroups.map((doc, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedGroupKey(doc.name)}
                    style={{ flex: '1 1 280px', minWidth: '280px', maxWidth: '400px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#0EA5E9'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#F0F9FF', color: '#0EA5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>
                        <Users size={24} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: 0 }}>{doc.name}</h3>
                        <span style={{ fontSize: '13px', color: '#64748B' }}>{doc.records.length} interactions</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Visits & Consults</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>{doc.visits}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '4px' }}>Prescriptions</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#334155' }}>{doc.scripts}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            
            {activeFilter === 'lab' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {labGroups.map((cat, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedGroupKey(cat.name)}
                    style={{ flex: '1 1 280px', minWidth: '280px', maxWidth: '400px', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#10B981'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#E2E8F0'}
                  >
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                      <FileText size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A', margin: '0 0 4px 0' }}>{cat.name}</h3>
                      <span style={{ fontSize: '14px', color: '#64748B' }}>{cat.records.length} reports attached</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        {selectedGroupKey && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setSelectedGroupKey(null)}
              style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#0EA5E9'}
              onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
            >
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0F172A', margin: 0 }}>
              {activeFilter === 'visit' ? `History with ${selectedGroupKey}` : `${selectedGroupKey} Reports`}
            </h2>
          </div>
        )}
        {/* Central Spine */}
        <div className="timeline-central-spine" style={{ top: selectedGroupKey ? '80px' : '0' }} />

        <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
          {spineData.map((yearBlock) => (
            <div key={yearBlock.year} className="timeline-year-block">
              <div className="year-watermark">{yearBlock.year}</div>
              
              {yearBlock.months.map((monthBlock) => (
                <div key={monthBlock.month} style={{ position: 'relative', paddingTop: '40px' }}>
                  <div className="month-marker">{monthBlock.month} {yearBlock.year}</div>
                  
                  <motion.div layout>
                    <AnimatePresence>
                      {monthBlock.records.map((node, i) => (
                        <motion.div 
                          key={node.id} 
                          className="record-row"
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, type: 'spring', bounce: 0.2 }}
                        >
                          <div className={`node-dot cat-${node.type === 'scanGroup' ? 'scan' : node.type === 'medGroup' ? 'med' : node.type}`} />
                          
                          {/* Render specific card based on type */}
                          {node.type === 'visit' && <VisitCard data={node} onCompare={handleCompare} />}
                          {(node.type === 'scan' || node.type === 'scanGroup') && <ScanCard data={node} onCompare={handleCompare} />}
                          {node.type === 'lab' && <LabCard data={node} onCompare={handleCompare} />}
                          {(node.type === 'medication' || node.type === 'medGroup') && <MedicationCard data={node} />}
                          {node.type === 'consultation' && <ConsultationCard data={node} onCompare={handleCompare} />}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              ))}
            </div>
          ))}

          {isLoading ? (
            <div style={{ paddingLeft: '140px', marginTop: '60px', textAlign: 'center', color: '#64748B' }}>
              <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #0EA5E9', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '16px' }}>Loading records from the database...</p>
            </div>
          ) : (
            groupedNodes.length === 0 && (
              <div style={{ paddingLeft: '140px', marginTop: '60px' }}>
                <div style={{ background: 'rgba(255,255,255,0.6)', border: '1px dashed #94A3B8', borderRadius: '16px', padding: '40px', textAlign: 'center', color: '#64748B' }}>
                  <Search size={32} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
                  <h3>No records found</h3>
                  <p style={{ fontSize: '14px' }}>Try adjusting your filters or search query.</p>
                </div>
              </div>
            )
          )}
        </div>
        </>
        )}
        </main>

        {/* RIGHT SIDE PANEL */}
        <aside className="records-right-panel" style={{ width: '320px', paddingTop: '100px', position: 'sticky', top: '72px', height: 'max-content', paddingBottom: '40px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0EA5E9' }} /> Latest Biomarkers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Hemoglobin</span>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>13.2 <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '400' }}>g/dL</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Blood Pressure</span>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>120/80 <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '400' }}>mmHg</span></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ color: '#64748B' }}>Heart Rate</span>
                <span style={{ fontWeight: '600', color: '#0F172A' }}>72 <span style={{ color: '#94A3B8', fontSize: '12px', fontWeight: '400' }}>bpm</span></span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} /> Allergies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '500', border: '1px solid #FEE2E2' }}>Penicillin</span>
              <span style={{ background: '#FEF2F2', color: '#EF4444', padding: '6px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '500', border: '1px solid #FEE2E2' }}>Peanuts</span>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} /> Medical Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7' }}>Hypertension</div>
              <div style={{ fontSize: '14px', color: '#334155', fontWeight: '500', padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FEF3C7' }}>Asthma</div>
            </div>
          </div>
        </aside>
      </div>

      <AddRecordModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onRecordAdded={handleRecordAdded}
      />

      {/* FAB */}
      <button className="fab-add-record" onClick={() => setAddModalOpen(true)}>
        <Plus size={20} /> Add Record
      </button>

      {/* Toast */}
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

export default RecordsPage;
