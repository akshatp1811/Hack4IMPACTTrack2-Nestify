import React from 'react';

const FinalCTA = () => {
  return (
    <section id="final-cta">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>
      <div className="ambient-orb orb-3"></div>

      <h2 className="cta-headline">Start Your Health Journey Today.</h2>
      <p className="cta-sub">Join thousands managing their complete health with MedNest.</p>
      <div className="cta-buttons">
        <button className="btn-primary">Download App</button>
        <button className="btn-ghost">Learn More</button>
      </div>

      <div className="features-summary-card glass-card-strong">
        <div className="feature-mini">
          <div className="mini-icon">📋</div>
          <div className="mini-label">Records</div>
        </div>
        <div className="feature-mini">
          <div className="mini-icon">📊</div>
          <div className="mini-label">Tracking</div>
        </div>
        <div className="feature-mini">
          <div className="mini-icon">💊</div>
          <div className="mini-label">Medication</div>
        </div>
        <div className="feature-mini">
          <div className="mini-icon">🤖</div>
          <div className="mini-label">AI Insights</div>
        </div>
        <div className="feature-mini">
          <div className="mini-icon">🚨</div>
          <div className="mini-label">Emergency</div>
        </div>
        <div className="feature-mini">
          <div className="mini-icon">🛡️</div>
          <div className="mini-label">Insurance</div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
