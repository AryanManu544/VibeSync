// src/App.js
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage     from './components/Home';
import LoginPage    from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import ChannelPage  from './pages/ChannelPage';
import DashboardPage from './pages/Dashboard';
import './styles/Alert.css';

const App = () => {
  const [alert, setAlert] = useState({ msg: '', type: '' });

  const showAlert = (message, type = 'info') => {
    setAlert({ msg: message, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3000);
  };

  return (
    <>
      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}

      <Routes>
        <Route path="/"         element={<HomePage    showAlert={showAlert} />} />
        <Route path="/login"    element={<LoginPage   showAlert={showAlert} />} />
        <Route path="/register" element={<RegisterPage showAlert={showAlert} />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        {/* Updated channel route: serverId required, channelId optional */}
        <Route
          path="/channel/:serverId/:channelId?"
          element={<ChannelPage showAlert={showAlert} />}
        />

        {/* Redirect any unknown paths back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;