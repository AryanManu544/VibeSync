import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import LoginPage from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import ChatDashboard from "./components/chat/ChatDashboard";
import './styles/Alert.css';

const App = () => {
  const [alert, setAlert] = useState({ msg: '', type: '' });

  const showAlert = (message, type = 'info') => {
    setAlert({ msg: message, type });
    // Dismiss after 3 seconds
    setTimeout(() => {
      setAlert({ msg: '', type: '' });
    }, 3000);
  };

  return (
    <Router>

      {alert.msg && (
        <div className={`alert alert-${alert.type}`}>
          {alert.msg}
        </div>
      )}


      <Routes>
        <Route path="/" element={<HomePage showAlert={showAlert} />} />
        <Route path="/login" element={<LoginPage showAlert={showAlert} />} />
        <Route path="/register" element={<RegisterPage showAlert={showAlert} />} />
        <Route path="/channel" element={<ChatDashboard showAlert={showAlert} />} />
      </Routes>
    </Router>
  );
};

export default App;