import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EmergencyScene = () => {
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

    // Parallax BG (very slow)
    gsap.to('.emer-bg-layer', {
      y: -40,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=250vh',
        scrub: 1.5,
      }
    });

    // Red orb fades in
    tl.to('.emergency-red-orb', {
      opacity: 1,
      duration: 0.4,
    }, 0);

    // Red tint wash
    tl.to('.emergency-bg-tint', {
      opacity: 1,
      duration: 0.5,
    }, 0);

    // SOS button scales in
    tl.to('.sos-button', {
      scale: 1,
      opacity: 1,
      duration: 0.5,
      ease: 'back.out(2)',
    }, 0.3);

    // Emergency tiles radiate outward
    const tiles = gsap.utils.toArray('.emergency-tile');
    tiles.forEach((t, i) => {
      tl.to(t, {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.5)',
      }, 0.6 + i * 0.1);
    });

    // Ambulance bar slides up
    tl.to('.ambulance-bar', {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out',
    }, 1.3);

    // Progress bar fill
    tl.to('.progress-fill-inner', {
      width: '100%',
      duration: 0.5,
      ease: 'power1.out',
    }, 1.5);

  }, { scope: container });

  return (
    <section className="scene" id="emergency" ref={container}>
      <div className="scene-inner">
        {/* Background layers */}
        <div className="parallax-bg emer-bg-layer">
          <div className="emergency-bg-tint"></div>
          <div className="emergency-red-orb"></div>
        </div>

        <div className="emergency-container parallax-fg emer-fg-layer">
          <div className="emergency-header">
            <div className="section-label" style={{color: 'var(--color-emergency)'}}>Feature 05</div>
            <h2 className="scene-title">Emergency Mode</h2>
            <p className="scene-subtitle" style={{margin: '0 auto'}}>One tap sends your critical health data, location, and emergency contacts — instantly.</p>
          </div>

          <button className="sos-button">SOS</button>

          <div className="emergency-tiles">
            <div className="emergency-tile glass-card">
              <div className="tile-icon">📋</div>
              <div className="tile-label">Emergency Profile</div>
              <div className="tile-sub">Blood type, allergies, conditions</div>
            </div>
            <div className="emergency-tile glass-card">
              <div className="tile-icon">📞</div>
              <div className="tile-label">Emergency Contacts</div>
              <div className="tile-sub">Auto-notify family & doctor</div>
            </div>
            <div className="emergency-tile glass-card">
              <div className="tile-icon">📍</div>
              <div className="tile-label">Live Location</div>
              <div className="tile-sub">Share real-time GPS coordinates</div>
            </div>
            <div className="emergency-tile glass-card">
              <div className="tile-icon">📊</div>
              <div className="tile-label">Critical Summary</div>
              <div className="tile-sub">Auto-generated medical brief</div>
            </div>
            <div className="emergency-tile glass-card">
              <div className="tile-icon">🏥</div>
              <div className="tile-label">Nearby Hospitals</div>
              <div className="tile-sub">Ranked by distance & specialty</div>
            </div>
            <div className="emergency-tile glass-card">
              <div className="tile-icon">🚑</div>
              <div className="tile-label">Ambulance Call</div>
              <div className="tile-sub">Direct dial with report</div>
            </div>
          </div>

          <div className="ambulance-bar">
            🚑 Sending Report Summary...
            <div className="progress-fill">
              <div className="progress-fill-inner"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmergencyScene;
