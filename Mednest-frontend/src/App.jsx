import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RecordsPage from './pages/RecordsPage';
import TrackingPage from './pages/TrackingPage';
import TrackingDetailPage from './pages/TrackingDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/records" element={<RecordsPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:vitalType" element={<TrackingDetailPage />} />
    </Routes>
  );
}

export default App;
