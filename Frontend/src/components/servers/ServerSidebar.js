// src/components/servers/ServerSidebar.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import ServerHeader from './Serverheader';
import { useAuth } from '../../context/AuthContext';

export default function ServerSidebar() {
  const navigate = useNavigate();
  const { serverId } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    const fetchServer = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/servers/${serverId}`, {
          headers: { 'auth-token': localStorage.getItem('token') },
        });
        setServer(res.data);
        setError(null);
      } catch (err) {
        console.error('Error loading server data:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (serverId) {
      fetchServer();
    }
  }, [serverId]);

  // Handle error state
  if (!loading && (error || !server)) {
    return <Navigate to="/channel" replace />;
  }

  if (loading || !server) {
    return <div className="p-4 text-center text-gray-500">Loading server…</div>;
  }

  const textChannels = server.channels?.filter(c => c.type === 'text') || [];

  // Find user role
  const member = server.members.find(m => m._id === user.id || m === user.id);
  const role = member?.role;

  return (
    <div className="flex flex-col h-full bg-[#2f3136] text-white w-full">
      <ServerHeader server={server} role={role} />

      <div className="px-4 pt-2">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-gray-400 uppercase">Text Channels</h4>
        </div>
        <ul className="mt-1 space-y-1">
          {textChannels.map(ch => (
            <li
              key={ch._id}
              className="cursor-pointer px-2 py-1 rounded hover:bg-gray-700"
              onClick={() => navigate(`/channel/${serverId}/${ch._id}`)}
            >
              # {ch.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}