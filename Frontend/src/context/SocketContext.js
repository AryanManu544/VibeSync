import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only connect to socket if user is authenticated
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      const socketInstance = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setConnected(false);
      });

      // Store socket instance
      setSocket(socketInstance);

      // Clean up on unmount
      return () => {
        console.log('Disconnecting socket');
        socketInstance.disconnect();
      };
    }

    // If user logs out, disconnect the socket
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [user, isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context.socket;
};

export const useSocketConnected = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketConnected must be used within a SocketProvider');
  }
  return context.connected;
};