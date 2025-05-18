import React, { useState } from 'react';
import Dashboard from './components/dashboard/Dashboard'
import Register from './components/auth/Register'
import Login from './components/auth/Login'
import Home from './components/Home'
import {
	BrowserRouter as Router,
	Route,
	Routes,
  } from "react-router-dom";
import Invite from './components/Invite/Invite'
import './styles/Alert.css'

function App() {
  const [alert, setAlert] = useState({ msg: '', type: '' });

  const showAlert = (message, type = 'info') => {
    setAlert({ msg: message, type });
    setTimeout(() => setAlert({ msg: '', type: '' }), 3000);
  };

  return (
    <div>
        <Router>
          <Routes>

                  <Route path="/" element={<Home showAlert={showAlert}/>}></Route>
                  <Route path="/register" element={<Register showAlert={showAlert}/>} />
                  <Route path="/login" element={<Login showAlert={showAlert}/>} />
                  <Route exact path="/channels/:server_id" element={<Dashboard/>}></Route>
                  <Route exact path="/invite/:invite_link" element={<Invite/>}></Route>
          </Routes>
        </Router>
          
        
        
      
    </div>
  );
}

export default App;
