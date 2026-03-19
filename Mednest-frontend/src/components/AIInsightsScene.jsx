import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const AIInsightsScene = () => {
  const container = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=250vh',
        pin: true,
        scrub: 1.5,
        anticipatePin: 1,
      }
    });

    // Parallax BG
    gsap.to('.ai-bg-layer', {
      y: -60,
      x: 30,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=250vh',
        scrub: 1.5,
      }
    });

    // Chat window scales in
    tl.from('.chat-window', {
      scale: 0.94,
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, 0);

    // User message appears
    tl.to('.chat-user', {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    }, 0.3);

    // Typing indicator
    tl.to('.chat-typing', {
      opacity: 1,
      duration: 0.2,
    }, 0.6);

    // Typing hides, AI response appears
    tl.to('.chat-typing', {
      opacity: 0,
      display: 'none',
      duration: 0.1,
    }, 1.0);

    tl.to('.chat-ai', {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, 1.0);

    // Doctor summary slides up
    tl.to('.doctor-summary-card', {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, 1.4);

  }, { scope: container });

  return (
    <section className="scene" id="ai-insights" ref={container}>
      <div className="scene-inner">
        <div className="parallax-bg ai-bg-layer">
          <div className="timeline-blob" style={{top: '40%', left: '50%', transform: 'translateX(-50%)'}}></div>
        </div>

        <div className="ai-container parallax-fg ai-fg-layer">
          <div className="ai-header">
            <div className="section-label">Feature 04</div>
            <h2 className="scene-title">AI-Powered Health Insights</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>Get personalized analysis and exportable summaries for every doctor visit.</p>
          </div>

          <div className="chat-window glass-card-strong">
            <div className="chat-bubble user chat-user">
              How is my blood pressure trending this month?
            </div>
            <div className="chat-typing">
              <span></span><span></span><span></span>
            </div>
            <div className="chat-bubble ai chat-ai">
              Your blood pressure trend has improved 12% this month. Your average systolic dropped from 132 to 118 mmHg. Keep up the current medication and exercise routine — you're on track! 🎯
            </div>
          </div>

          <div className="doctor-summary-card glass-card">
            <div className="summary-badge">📋 Exportable Report</div>
            <div className="summary-title">Summary for Doctor</div>
            <div className="summary-row">
              <span className="summary-label">Period</span>
              <span className="summary-val">Feb 15 – Mar 15, 2026</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Avg. BP</span>
              <span className="summary-val">118/76 mmHg</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Adherence</span>
              <span className="summary-val">94%</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Alerts</span>
              <span className="summary-val">1 (Drug Interaction)</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">AI Recommendation</span>
              <span className="summary-val">Continue current plan</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIInsightsScene;
