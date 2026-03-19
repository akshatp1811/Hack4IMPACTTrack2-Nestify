import React from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from '../components/Navbar';
import HeroScene from '../components/HeroScene';
import TimelineScene from '../components/TimelineScene';
import TrackingScene from '../components/TrackingScene';
import MedicationScene from '../components/MedicationScene';
import AIInsightsScene from '../components/AIInsightsScene';
import EmergencyScene from '../components/EmergencyScene';
import RiskScoreScene from '../components/RiskScoreScene';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

// Register ScrollTrigger globally just in case it wasn't
gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  return (
    <div className="app-container">
      <Navbar />
      <main>
        <HeroScene />
        <TimelineScene />
        <TrackingScene />
        <MedicationScene />
        <AIInsightsScene />
        <EmergencyScene />
        <RiskScoreScene />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
