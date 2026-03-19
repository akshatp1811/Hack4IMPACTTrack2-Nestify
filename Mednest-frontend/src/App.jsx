import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RecordsPage from './pages/RecordsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/records" element={<RecordsPage />} />
    </Routes>
  );
}

export default App;
