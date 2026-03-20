import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RecordsPage from './pages/RecordsPage';
import TrackingPage from './pages/TrackingPage';
import TrackingDetailPage from './pages/TrackingDetailPage';
import MedicationsPage from './pages/MedicationsPage';
import CaregiverViewPage from './pages/CaregiverViewPage';
import MedicationDetailPage from './pages/MedicationDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/records" element={<RecordsPage />} />
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:vitalType" element={<TrackingDetailPage />} />
      <Route path="/medication" element={<MedicationsPage />} />
      <Route path="/medication/caregiver" element={<CaregiverViewPage />} />
      <Route path="/medication/:id" element={<MedicationDetailPage />} />
    </Routes>
  );
}

export default App;
