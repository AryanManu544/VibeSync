import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ServerHeader from './Serverheader';

export default function ServerSidebar({ serverId }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [server, setServer]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch current profile
        const profRes = await axios.get('/api/profile');
        setProfile(profRes.data);

        // 2) Fetch server by ID
        const srvRes = await axios.get(`/api/servers/${serverId}`);
        setServer(srvRes.data);
      } catch (err) {
        console.error('Error loading sidebar data', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [serverId]);

  // Redirect on error or missing server
  useEffect(() => {
    if (!loading && (error || !server)) {
      navigate('/'); // back to home
    }
  }, [loading, error, server, navigate]);

  if (loading || !profile || !server) {
    return <div className="p-4 text-center text-gray-500">Loading...</div>;
  }

  // Partition channels if needed
  const textChannels  = server.channels.filter(c => c.type === 'TEXT');
  const audioChannels = server.channels.filter(c => c.type === 'AUDIO');
  const videoChannels = server.channels.filter(c => c.type === 'VIDEO');

  // Find the current user's role
  const memberRecord = server.members.find(m => m.profileId === profile.id);
  const role = memberRecord?.role;

  return (
    <div className="flex flex-col h-full text-primary w-full dark:bg-[#2b2d31] bg-[#f2f3f5]">
      <ServerHeader server={server} role={role} />

      {/* Example: render text channels */}
      <div className="px-4 pt-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase">Text Channels</h4>
        <ul className="mt-1 space-y-1">
          {textChannels.map(ch => (
            <li 
              key={ch.id} 
              className="cursor-pointer px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              # {ch.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Repeat for audio/video if you like */}
    </div>
  );
}