import React from 'react';
import { useNavigate } from 'react-router-dom';
import ServerSidebar from '../components/servers/ServerSidebar'; 
import ServerChannel from '../components/servers/ServerChannel';
import MessageList   from '../components/chat/MessageList';
import MessageInput  from '../components/chat/MessageInput';

export default function ChannelPage() {
  const navigate = useNavigate();

  // If you want to redirect from "/" (login success) to "/channel":
  React.useEffect(() => {
    // e.g. check if user is logged in; if not: navigate('/login')
  }, []);

  const exampleServerId  = '602b2a...'; // or pull from context / state
  const exampleChannelId = '602b2a...'; // same

  return (
    <div className="flex h-screen">
      {/* 1. The Sidebar always shows on /channel */}
      <aside className="w-64">
        <ServerSidebar serverId={exampleServerId} />
      </aside>

      {/* 2. Next column: the channel list */}
      <aside className="w-80 border-l border-gray-700">
        <ServerChannel
          serverId={exampleServerId}
          selectedChannel={exampleChannelId}
          onSelectChannel={(chId) => {
            // update state / URL so MessageList re-renders
          }}
        />
      </aside>

      {/* 3. Main chat area */}
      <main className="flex-1 flex flex-col">
        <MessageList   channelId={exampleChannelId} />
        <MessageInput  channelId={exampleChannelId} />
      </main>
    </div>
  );
}