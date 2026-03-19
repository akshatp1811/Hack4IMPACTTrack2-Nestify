import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Utility for counting numbers
function animateCounter(el, target, duration = 1, decimals = 0) {
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val);
    }
  });
}

const TrackingScene = () => {
  const container = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=280vh',
        pin: true,
        scrub: 1.5,
        anticipatePin: 1,
      }
    });

    // Parallax BG
    gsap.to('.tracking-bg-layer', {
      y: -60,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=280vh',
        scrub: 1.5,
      }
    });

    // Grid fade in (midground)
    tl.from('.graph-grid', {
      opacity: 0,
      duration: 0.3,
    }, 0);

    // Graph line draws
    tl.to('.graph-line', {
      strokeDashoffset: 0,
      duration: 1.2,
      ease: 'none',
    }, 0.2);

    // Area fill
    tl.from('.graph-area', {
      opacity: 0,
      duration: 0.3,
    }, 0.6);

    // Dots appear
    const dots = gsap.utils.toArray('.graph-dot');
    dots.forEach((dot, i) => {
      tl.to(dot, {
        opacity: 1,
        duration: 0.1,
        ease: 'power1.out',
      }, 0.3 + (i + 1) * 0.1);
    });

    // Stat cards rise from below
    const statCards = gsap.utils.toArray('.stat-card');
    statCards.forEach((card, i) => {
      tl.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        onStart() {
          // Count up numbers
          const spans = card.querySelectorAll('[data-count]');
          spans.forEach(span => {
            const target = parseFloat(span.dataset.count);
            const decimals = parseInt(span.dataset.decimals || '0');
            animateCounter(span, target, 1.2, decimals);
          });
        }
      }, 1.3 + i * 0.15);
    });

  }, { scope: container });

  return (
    <section className="scene" id="tracking" ref={container}>
      <div className="scene-inner">
        {/* BG */}
        <div className="parallax-bg tracking-bg-layer">
          <div className="timeline-blob" style={{top: '30%', right: '20%'}}></div>
        </div>

        <div className="tracking-container parallax-fg tracking-fg-layer">
          <div className="tracking-header">
            <div className="section-label">Feature 02</div>
            <h2 className="scene-title">Track Every Vital Sign</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>Blood pressure, glucose, heart rate, SpO2 — all beautifully visualized in real time.</p>
          </div>

          {/* Graph */}
          <div className="tracking-graph-wrap parallax-mid tracking-mid-layer">
            <svg viewBox="0 0 900 260">
              {/* Grid lines */}
              <g className="graph-grid">
                <line x1="0" y1="0" x2="900" y2="0" />
                <line x1="0" y1="65" x2="900" y2="65" />
                <line x1="0" y1="130" x2="900" y2="130" />
                <line x1="0" y1="195" x2="900" y2="195" />
                <line x1="0" y1="260" x2="900" y2="260" />
              </g>
              {/* Labels */}
              <text className="graph-label" x="0" y="275">Mon</text>
              <text className="graph-label" x="128" y="275">Tue</text>
              <text className="graph-label" x="257" y="275">Wed</text>
              <text className="graph-label" x="385" y="275">Thu</text>
              <text className="graph-label" x="514" y="275">Fri</text>
              <text className="graph-label" x="642" y="275">Sat</text>
              <text className="graph-label" x="771" y="275">Sun</text>
              {/* Area fill */}
              <polygon className="graph-area" points="0,260 0,180 128,140 257,160 385,100 514,120 642,80 771,110 900,70 900,260" />
              {/* Line */}
              <polyline className="graph-line" points="0,180 128,140 257,160 385,100 514,120 642,80 771,110 900,70" strokeDasharray="1400" strokeDashoffset="1400" />
              {/* Dots */}
              <circle className="graph-dot" cx="0" cy="180" r="5" opacity="0" />
              <circle className="graph-dot" cx="128" cy="140" r="5" opacity="0" />
              <circle className="graph-dot" cx="257" cy="160" r="5" opacity="0" />
              <circle className="graph-dot" cx="385" cy="100" r="5" opacity="0" />
              <circle className="graph-dot" cx="514" cy="120" r="5" opacity="0" />
              <circle className="graph-dot" cx="642" cy="80" r="5" opacity="0" />
              <circle className="graph-dot" cx="771" cy="110" r="5" opacity="0" />
              <circle className="graph-dot" cx="900" cy="70" r="5" opacity="0" />
            </svg>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards-grid">
            <div className="stat-card glass-card">
              <div className="stat-icon">🫀</div>
              <div className="stat-label">Blood Pressure</div>
              <div className="stat-value"><span data-count="118">0</span>/<span data-count="76">0</span></div>
              <div className="stat-unit">mmHg</div>
              <div className="stat-status">✓ Normal</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">🩸</div>
              <div className="stat-label">SpO2</div>
              <div className="stat-value"><span data-count="98">0</span><span className="stat-unit">%</span></div>
              <div className="stat-status">✓ Optimal</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">🌙</div>
              <div className="stat-label">Sleep</div>
              <div className="stat-value"><span data-count="7.2" data-decimals="1">0</span><span className="stat-unit">h</span></div>
              <div className="stat-status">✓ Good</div>
            </div>
            <div className="stat-card glass-card">
              <div className="stat-icon">💓</div>
              <div className="stat-label">Heart Rate</div>
              <div className="stat-value"><span data-count="72">0</span><span className="stat-unit"> bpm</span></div>
              <div className="stat-status">✓ Resting</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackingScene;
