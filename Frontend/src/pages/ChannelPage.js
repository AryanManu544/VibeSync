// src/components/ChannelPage.js
import React, { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import ServerSidebar  from '../components/servers/ServerSidebar';
import ServerChannel  from '../components/servers/ServerChannel';
import MessageList    from '../components/chat/MessageList';
import MessageInput   from '../components/chat/MessageInput';
import { useAuth }    from '../context/AuthContext';

export default function ChannelPage({ showAlert }) {
  const navigate = useNavigate();
  const { serverId, channelId } = useParams();
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If only /channel/:serverId is visited, auto-select first channel
  // (you could fetch the list here and navigate to the first one)
  useEffect(() => {
    if (serverId && !channelId) {
      // Optionally fetch first channel from your API, then:
      // navigate(`/channel/${serverId}/${firstChannelId}`, { replace: true });
    }
  }, [serverId, channelId, navigate]);

  // Change URL when the user selects a channel
  const handleSelectChannel = (ch) => {
    navigate(`/channel/${serverId}/${ch._id || ch.id}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar of servers */}
      <aside className="flex-shrink-0 w-20">
        <ServerSidebar /* no props, reads serverId from useParams */ />
      </aside>

      {/* Channel list for this server */}
      <aside className="flex-shrink-0 w-64 border-l border-gray-700">
        <ServerChannel
          serverId={serverId}
          selectedChannelId={channelId}
          onSelectChannel={handleSelectChannel}
        />
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col bg-[#36393f]">
        {channelId ? (
          <>
            <MessageList   channelId={channelId} />
            <MessageInput  channelId={channelId} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a channel to start chatting
          </div>
        )}
      </main>
    </div>
  );
}