import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Alert     from './components/alert';
import Home      from './components/Home';
import Register  from './components/auth/Register';
import Login     from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Invite    from './components/Invite/Invite';
import { Analytics } from '@vercel/analytics/react';
import AboutPage from './components/Aboutpage';
import TechstackPage from './components/TechStackPage';

function App() {
  const [alert, setAlert] = useState({ msg: '', type: '' });

  const showAlert = (message, type = 'info') => {
    setAlert({ msg: message, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3000);
  };

  return (
    <Router>
      {/* render the Alert UI at top level */}
      <Alert alert={alert} />

      <Routes>
        <Route path="/" element={<Home showAlert={showAlert} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/techstack" element={<TechstackPage />} />
        <Route path="/register" element={<Register showAlert={showAlert} />} />
        <Route path="/login" element={<Login showAlert={showAlert} />} />
        <Route path="/channels/:server_id" element={<Dashboard />} />
        <Route path="/invite/:invite_link" element={<Invite />} />
      </Routes>
      <Analytics />
    </Router>

  );
}

export default App;