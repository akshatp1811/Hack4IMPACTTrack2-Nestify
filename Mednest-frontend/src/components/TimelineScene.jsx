import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TimelineScene = () => {
  const container = useRef(null);

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
    gsap.to('.timeline-bg-layer', {
      y: -80,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=300vh',
        scrub: 1.5,
      }
    });

    // Timeline spine draws down
    tl.to('.spine-line', {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'none',
    }, 0);

    // Nodes pulse in
    const nodes = gsap.utils.toArray('.timeline-node');
    nodes.forEach((n, i) => {
      tl.to(n, {
        scale: 1,
        duration: 0.2,
        ease: 'back.out(3)',
      }, 0.3 + i * 0.35);
    });

    // Cards slide in from alternating sides
    const cards = gsap.utils.toArray('.timeline-card');
    cards.forEach((c, i) => {
      tl.to(c, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        ease: 'power2.out',
      }, 0.4 + i * 0.35);
    });

    // Transition out: fade
    tl.to('.timeline-fg-layer', {
      opacity: 0,
      y: -60,
      duration: 0.5,
    }, 2.5);

  }, { scope: container });

  return (
    <section className="scene" id="timeline" ref={container}>
      <div className="scene-inner">
        {/* BG */}
        <div className="parallax-bg timeline-bg-layer">
          <div className="timeline-blob" style={{top: '20%', left: '15%'}}></div>
          <div className="timeline-blob" style={{bottom: '10%', right: '10%'}}></div>
        </div>

        {/* Content */}
        <div className="timeline-container parallax-fg timeline-fg-layer">
          <div className="timeline-header">
            <div className="section-label">Report Storage</div>
            <h2 className="scene-title">Timeline-Based Report Storage</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>Securely store and access your complete medical history — organized chronologically in one safe nest.</p>
          </div>

          {/* Timeline Spine SVG */}
          <div className="timeline-spine">
            <svg viewBox="0 0 3 600" preserveAspectRatio="none">
              <line x1="1.5" y1="0" x2="1.5" y2="600" className="spine-line" strokeDasharray="600" strokeDashoffset="600" />
            </svg>
          </div>

          {/* Nodes */}
          <div className="timeline-node" style={{top: '18%'}}></div>
          <div className="timeline-node" style={{top: '34%'}}></div>
          <div className="timeline-node" style={{top: '50%'}}></div>
          <div className="timeline-node" style={{top: '66%'}}></div>
          <div className="timeline-node" style={{top: '82%'}}></div>

          {/* Cards */}
          <div className="timeline-card glass-card left">
            <div className="card-icon">🏥</div>
            <div className="card-date">Stored Securely</div>
            <div className="card-title">Visit Records</div>
            <div className="card-desc">Complete digital logs of every doctor appointment and clinic visit.</div>
            <span className="card-tag">Records</span>
          </div>
          <div className="timeline-card glass-card right">
            <div className="card-icon">🩻</div>
            <div className="card-date">High-Res Viewer</div>
            <div className="card-title">Scans & Scan Reports</div>
            <div className="card-desc">Store X-Rays, MRIs, and CT Scans with attached radiologist notes.</div>
            <span className="card-tag">Imaging</span>
          </div>
          <div className="timeline-card glass-card left">
            <div className="card-icon">🧪</div>
            <div className="card-date">Instant Access</div>
            <div className="card-title">Lab Reports</div>
            <div className="card-desc">Track blood panels, pathology results, and diagnostic tests over time.</div>
            <span className="card-tag">Diagnostics</span>
          </div>
          <div className="timeline-card glass-card right">
            <div className="card-icon">💊</div>
            <div className="card-date">Prescription Log</div>
            <div className="card-title">Medication History</div>
            <div className="card-desc">A complete timeline of all active and past prescriptions with dosage info.</div>
            <span className="card-tag">Pharmacy</span>
          </div>
          <div className="timeline-card glass-card left">
            <div className="card-icon">👨‍⚕️</div>
            <div className="card-date">Care Team Notes</div>
            <div className="card-title">Consultation History</div>
            <div className="card-desc">Detailed specialist notes, recommendations, and referral letters.</div>
            <span className="card-tag">Consultation</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TimelineScene;
