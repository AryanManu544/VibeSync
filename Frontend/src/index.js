import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // if you have this
import { BrowserRouter } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://localhost:4000'); // your Socket.IO server

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SocketProvider socket={socket}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  </React.StrictMode>
);
