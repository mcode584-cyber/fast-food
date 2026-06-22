import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import FoodMenu from './Qrcode';
import Dashboard from './admin';
function App() {
  return (
    <Router>
      <Routes>

        <Route path="/" element={<FoodMenu />} />


        <Route path="/admin" element={<Dashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;