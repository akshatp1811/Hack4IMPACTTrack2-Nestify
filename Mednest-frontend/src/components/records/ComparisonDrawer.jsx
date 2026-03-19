// src/components/records/ComparisonDrawer.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const ComparisonDrawer = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  // Mocking "Previous Record" data for the sake of the side-by-side comparison
  const prevRecord = { ...record, date: '2024-01-15' };
  
  return (
    <AnimatePresence>
      <motion.div 
        className="drawer-overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div 
        className="comparison-drawer"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div style={{ padding: '24px 32px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '20px', fontWeight: '700', color: '#0F172A', margin: 0 }}>Comparing Records</h2>
            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              {record.title || record.subType || record.name || `${record.specialty} Consultation`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          
          <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
            <div style={{ flex: 1, padding: '16px', background: '#F8FBFF', borderRadius: '12px', border: '1px solid #E0F2FE' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#0EA5E9', textTransform: 'uppercase', marginBottom: '8px' }}>Current</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#0F172A' }}>{record.date}</div>
            </div>
            <div style={{ flex: 1, padding: '16px', background: '#F8FBFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: '8px' }}>Previous</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#334155' }}>{prevRecord.date}</div>
            </div>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '16px' }}>
              Changes & Differences
            </h3>
            
            {record.type === 'lab' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {record.results?.map((res, i) => {
                  // Fake prev delta
                  const diff = Math.random() > 0.5 ? 1 : -1;
                  const isImproved = res.status === 'Normal';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F8FBFF', borderRadius: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155', width: '120px' }}>{res.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#0F172A' }}>
                        {res.value} <span style={{fontSize:'12px', color:'#64748B', fontWeight:'400'}}>{res.unit}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isImproved ? <TrendingDown size={16} color="#10B981" /> : (diff > 0 ? <TrendingUp size={16} color="#EF4444" /> : <Minus size={16} color="#94A3B8" />)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748B' }}>
                        {res.value + (diff * 0.5).toFixed(1)} <span style={{fontSize:'12px', fontWeight:'400'}}>{res.unit}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {record.type !== 'lab' && (
              <div style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', padding: '16px', background: '#F8FBFF', borderRadius: '12px' }}>
                Comparing narrative text and clinical notes shows stable progression. No major new findings compared to the previous record.
              </div>
            )}
          </div>

          {/* AI Panel Placeholder */}
          <div style={{
            position: 'relative', borderRadius: '16px', padding: '2px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #7DD3FC 100%)',
            boxShadow: '0 12px 32px rgba(14, 165, 233, 0.15)'
          }}>
            <div style={{ background: '#FFFFFF', borderRadius: '14px', padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0EA5E9', fontWeight: '600', marginBottom: '16px' }}>
                <Sparkles size={18} /> AI Comparison Analysis
              </div>
              <p style={{ fontSize: '14px', color: '#64748B', lineHeight: '1.6', margin: 0 }}>
                [ Deep AI analysis generating insights between these two records will appear here ]<br/><br/>
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#94A3B8' }}>Coming soon &middot; Powered by MedAI</span>
              </p>
              {/* Shimmer effect placeholder */}
              <div style={{ position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)', animation: 'shimmer 2.5s infinite' }} />
            </div>
          </div>
          <style>{`@keyframes shimmer { 100% { left: 100%; } }`}</style>
        </div>

        <div style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '16px' }}>
          <button style={{ flex: 1, padding: '14px', background: '#F8FBFF', border: '1px solid #0EA5E9', color: '#0EA5E9', borderRadius: '100px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
            Add AI Analysis
          </button>
          <button style={{ flex: 1, padding: '14px', background: '#0EA5E9', border: 'none', color: '#FFFFFF', borderRadius: '100px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(14,165,233,0.3)' }}>
            Share with Doctor
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComparisonDrawer;
