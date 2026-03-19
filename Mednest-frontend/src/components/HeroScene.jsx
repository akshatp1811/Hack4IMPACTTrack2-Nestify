import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const HeroScene = () => {
  const container = useRef(null);
  const navigate = useNavigate();

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=200vh',
        pin: true,
        scrub: 1.5,
        anticipatePin: 1,
      }
    });

    // Parallax: BG layer (0.2x — slow)
    gsap.to('.hero-bg-layer', {
      y: -100,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=200vh',
        scrub: 1.5,
      }
    });

    // Parallax: Mid layer (0.5x)
    gsap.to('.hero-mid-layer', {
      y: -250,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=200vh',
        scrub: 1.5,
      }
    });

    // Parallax: FG layer (1.3x — fast)
    gsap.to('.hero-fg-layer', {
      y: -400,
      scrollTrigger: {
        trigger: container.current,
        start: 'top top',
        end: '+=200vh',
        scrub: 1.5,
      }
    });

    // Hero headline slides up + fades
    tl.to('.hero-content', {
      y: -120,
      opacity: 0,
      duration: 1,
      ease: 'power2.in',
    }, 0.3);

    // Float cards drift up at staggered rates + rotate flat
    tl.to('.health-score-card', {
      y: -200,
      x: 20,
      rotation: 0,
      opacity: 0,
      scale: 0.96,
      duration: 1,
    }, 0.2);

    tl.to('.heart-rate-card', {
      y: -280,
      x: -15,
      opacity: 0,
      scale: 0.97,
      duration: 1,
    }, 0.15);

    tl.to('.medication-card', {
      y: -240,
      x: 25,
      opacity: 0,
      scale: 0.95,
      duration: 1,
    }, 0.25);

    tl.to('.sleep-score-card', {
      y: -320,
      x: -20,
      opacity: 0,
      scale: 0.98,
      duration: 1,
    }, 0.1);

    // Background gradient shift
    tl.to(container.current, {
      background: 'linear-gradient(180deg, #E0F2FE 0%, #F0F9FF 100%)',
      duration: 1,
    }, 0);

  }, { scope: container });

  return (
    <section className="scene" id="hero" ref={container}>
      <div className="scene-inner">
        {/* BG Layer */}
        <div className="parallax-bg hero-float-cards hero-bg-layer">
          <div className="hero-orb"></div>
        </div>

        {/* Midground Layer */}
        <div className="parallax-mid hero-float-cards hero-mid-layer">
          <div className="float-card glass-card health-score health-score-card">
            <div className="card-label">Health Score</div>
            <div className="card-value primary">87</div>
          </div>
        </div>

        {/* Foreground Layer */}
        <div className="parallax-fg hero-float-cards hero-fg-layer" style={{position: 'absolute', inset: 0, zIndex: 2}}>
          <div className="float-card glass-card heart-rate heart-rate-card">
            <div className="card-label">Heart Rate</div>
            <div className="card-value">72 <span style={{fontSize: '13px', color: 'var(--color-muted)'}}>bpm</span></div>
            <div className="sparkline">
              <span style={{height: '8px'}}></span>
              <span style={{height: '14px'}}></span>
              <span style={{height: '10px'}}></span>
              <span style={{height: '18px'}}></span>
              <span style={{height: '12px'}}></span>
              <span style={{height: '16px'}}></span>
              <span style={{height: '9px'}}></span>
              <span style={{height: '20px'}}></span>
            </div>
          </div>
          <div className="float-card glass-card medication medication-card">
            <div className="card-label">Next Medication</div>
            <div className="card-value" style={{fontSize: '16px'}}>Metformin 500mg</div>
            <div style={{fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px'}}>⏰ In 2 hours</div>
          </div>
          <div className="float-card glass-card sleep-score sleep-score-card">
            <div className="card-label">Sleep Score</div>
            <div className="card-value primary">7.4<span style={{fontSize: '13px', color: 'var(--color-muted)'}}>h</span></div>
          </div>
        </div>

        {/* Content */}
        <div className="hero-content">
          <h1 className="hero-headline">
            Your Health.<br />All in One <span className="highlight">Nest.</span>
          </h1>
          <p className="hero-sub">
            One app to track, manage, and understand your complete health journey.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/records')}>Get Started</button>
            <button className="btn-ghost">Learn More</button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroScene;
