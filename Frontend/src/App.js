import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/Home';
import LoginPage from './components/auth/Login';
import RegisterPage from './components/auth/Register';
import './styles/Navbar.css';

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
      <Navbar />

      {alert.msg && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.msg}
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="alert"
            aria-label="Close"
            onClick={() => setAlert({ msg: '', type: '' })}
          ></button>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage showAlert={showAlert} />} />
        <Route path="/login" element={<LoginPage showAlert={showAlert} />} />
        <Route path="/register" element={<RegisterPage showAlert={showAlert} />} />
      </Routes>
    </Router>
  );
};

export default App;
