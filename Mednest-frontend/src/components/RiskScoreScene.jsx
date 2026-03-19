import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const RiskScoreScene = () => {
  const container = useRef(null);
  const gaugeRef = useRef(null);
  const [score, setScore] = useState(0);

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
    gsap.to('.risk-bg-layer', {
      y: -60,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=250vh',
        scrub: 1.5,
      }
    });

    // Gauge ring strokes in (82/100 → 280° out of ~340° visible)
    // 82% of 754 = 618 → offset = 754 - 618 = 136
    tl.to(gaugeRef.current, {
      strokeDashoffset: 136,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate() {
        const currentOffset = parseFloat(gsap.getProperty(gaugeRef.current, 'strokeDashoffset'));
        const pct = ((754 - currentOffset) / 754) * 100;
        const currentScore = Math.round(pct * 0.82);
        setScore(currentScore);

        // Color shift: red → amber → green
        if (currentScore < 30) {
          gaugeRef.current.style.stroke = '#EF4444';
        } else if (currentScore < 60) {
          gaugeRef.current.style.stroke = '#F59E0B';
        } else {
          gaugeRef.current.style.stroke = '#10B981';
        }
      }
    }, 0.2);

    // AI Summary card slides from left
    tl.to('#ai-summary-card', {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 0.8);

    // Insurance card slides from right
    tl.to('#insurance-card', {
      opacity: 1,
      x: 0,
      duration: 0.6,
      ease: 'power2.out',
    }, 1.0);

  }, { scope: container });

  return (
    <section className="scene" id="risk-score" ref={container}>
      <div className="scene-inner">
        <div className="parallax-bg risk-bg-layer">
          <div className="timeline-blob" style={{top: '30%', left: '40%'}}></div>
        </div>

        <div className="risk-container parallax-fg risk-fg-layer">
          <div className="risk-header">
            <div className="section-label">Feature 06</div>
            <h2 className="scene-title">Health Risk Score & Insurance</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>AI-calculated risk score with insurance-ready reports — shareable in one tap.</p>
          </div>

          <div className="risk-layout">
            {/* Left Card */}
            <div className="risk-side-card glass-card from-left" id="ai-summary-card">
              <div className="side-card-badge">🤖 AI Generated</div>
              <div className="side-card-title">Health Summary</div>
              <div className="side-card-row">
                <span className="row-label">Overall Risk</span>
                <span className="row-val" style={{color: '#059669'}}>Low</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Cardiovascular</span>
                <span className="row-val">12%</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Metabolic</span>
                <span className="row-val">18%</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Lifestyle</span>
                <span className="row-val" style={{color: '#059669'}}>Excellent</span>
              </div>
            </div>

            {/* Center Gauge */}
            <div className="risk-gauge-wrap">
              <svg viewBox="0 0 280 280">
                <circle className="gauge-bg" cx="140" cy="140" r="120" />
                <circle 
                  className="gauge-fill" 
                  cx="140" cy="140" r="120" 
                  ref={gaugeRef}
                  strokeDasharray="754" 
                  strokeDashoffset="754" 
                />
              </svg>
              <div className="risk-score-display">
                <div className="risk-score-num">{score}</div>
                <div className="risk-score-label">Health Score</div>
              </div>
            </div>

            {/* Right Card */}
            <div className="risk-side-card glass-card from-right" id="insurance-card">
              <div className="side-card-badge">📄 Insurance Ready</div>
              <div className="side-card-title">Coverage Report</div>
              <div className="side-card-row">
                <span className="row-label">Policy Status</span>
                <span className="row-val" style={{color: '#059669'}}>Active</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Claims Filed</span>
                <span className="row-val">2</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Wellness Discount</span>
                <span className="row-val" style={{color: 'var(--color-primary)'}}>15% Eligible</span>
              </div>
              <div className="side-card-row">
                <span className="row-label">Next Renewal</span>
                <span className="row-val">Jun 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RiskScoreScene;
