import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const MedicationScene = () => {
  const container = useRef(null);
  const [adherencePct, setAdherencePct] = useState(0);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=300vh',
        pin: true,
        scrub: 1.5,
        anticipatePin: 1,
      }
    });

    // Parallax BG
    gsap.to('.med-bg-layer', {
      y: -80,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=300vh',
        scrub: 1.5,
      }
    });

    // Main card: 3D perspective settle, slides up
    tl.from('.med-checklist-card', {
      y: 80,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
    }, 0);

    tl.to('.med-checklist-card', {
      rotateX: 0,
      duration: 0.8,
      ease: 'power2.out',
    }, 0.3);

    // Checklist items appear one by one with checkmarks
    const medItems = gsap.utils.toArray('.med-checklist-item');
    const checks = gsap.utils.toArray('.med-check');

    medItems.forEach((item, i) => {
      tl.to(item, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        ease: 'power2.out',
      }, 0.5 + i * 0.2);

      tl.to(checks[i], {
        className: 'med-check checked',
        duration: 0.1,
      }, 0.7 + i * 0.2);
    });

    // Adherence ring fills
    // 94% of 364.4 = 342.5 → offset = 364.4 - 342.5 = 21.9
    const ring = document.querySelector('.adherence-ring-fill');
    
    tl.to(ring, {
      strokeDashoffset: 21.9,
      duration: 1,
      ease: 'power2.out',
      onUpdate() {
        const currentOffset = parseFloat(gsap.getProperty(ring, 'strokeDashoffset'));
        const pct = Math.round(((364.4 - currentOffset) / 364.4) * 100);
        setAdherencePct(pct);
      }
    }, 0.8);

    // Risk alert pulses in
    tl.to('.risk-alert', {
      opacity: 1,
      duration: 0.3,
      ease: 'power2.out',
    }, 1.6);

    // Caregiver card slides in from right
    tl.to('.caregiver-card', {
      opacity: 1,
      x: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, 1.8);

  }, { scope: container });

  return (
    <section className="scene" id="medication" ref={container}>
      <div className="scene-inner">
        <div className="parallax-bg med-bg-layer">
          <div className="timeline-blob" style={{top: '10%', left: '25%'}}></div>
          <div className="timeline-blob" style={{bottom: '20%', right: '15%'}}></div>
        </div>

        <div className="medication-container parallax-fg med-fg-layer">
          <div className="medication-header">
            <div className="section-label">Feature 03</div>
            <h2 className="scene-title">Smart Medication Management</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>Never miss a dose. Track adherence, set reminders, and share access with caregivers.</p>
          </div>

          <div className="medication-layout">
            {/* Left: Checklist */}
            <div className="med-checklist-card glass-card-strong" style={{transform: 'perspective(800px) rotateX(4deg)'}}>
              <div className="med-checklist-title">Today's Medications</div>
              <div className="med-checklist-item">
                <div className="med-check">✓</div>
                <div className="med-item-info">
                  <div className="med-name">Metformin 500mg</div>
                  <div className="med-dose">8:00 AM — Before breakfast</div>
                </div>
              </div>
              <div className="med-checklist-item">
                <div className="med-check">✓</div>
                <div className="med-item-info">
                  <div className="med-name">Lisinopril 10mg</div>
                  <div className="med-dose">8:00 AM — With water</div>
                </div>
              </div>
              <div className="med-checklist-item">
                <div className="med-check">✓</div>
                <div className="med-item-info">
                  <div className="med-name">Atorvastatin 20mg</div>
                  <div className="med-dose">9:00 PM — After dinner</div>
                </div>
              </div>
              <div className="med-checklist-item">
                <div className="med-check">✓</div>
                <div className="med-item-info">
                  <div className="med-name">Vitamin D3 60K</div>
                  <div className="med-dose">Weekly — Sunday</div>
                </div>
              </div>
              <div className="risk-alert">
                <span className="pulse-dot"></span>
                Interaction Alert: Metformin + Alcohol
              </div>
            </div>

            {/* Right: Ring + Reminder + Caregiver */}
            <div className="med-right-col">
              <div className="adherence-card glass-card">
                <div className="adherence-ring-wrap">
                  <svg viewBox="0 0 140 140">
                    <circle className="adherence-ring-bg" cx="70" cy="70" r="58" />
                    <circle className="adherence-ring-fill" cx="70" cy="70" r="58" strokeDasharray="364.4" strokeDashoffset="364.4" />
                  </svg>
                  <div className="adherence-value">{adherencePct}%</div>
                </div>
                <div className="adherence-label">Monthly Adherence</div>
              </div>

              <div className="reminder-card glass-card">
                <div className="reminder-icon">⏰</div>
                <div className="reminder-info">
                  <div className="reminder-title">Smart Reminders</div>
                  <div className="reminder-sub">Next: Atorvastatin in 3h 12m</div>
                </div>
              </div>

              <div className="caregiver-card glass-card">
                <div className="caregiver-header">
                  <div className="caregiver-avatar">👨‍⚕️</div>
                  <div className="caregiver-label">Caregiver Mode</div>
                </div>
                <div className="caregiver-status">Dr. Sharma can view your adherence, missed doses, and risk alerts in real time.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicationScene;
