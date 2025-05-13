import React, { useState, useEffect } from 'react';
import ServerList    from '../servers/ServerList';
import ServerChannel from '../servers/ServerChannel';
import MessageList   from './MessageList';
import MessageInput  from './MessageInput';
import '../../styles/ChatDashboard.css'; 

export default function ChatDashboard() {
  // track which server & channel is selected
  const [selectedServer, setSelectedServer]   = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);

  // when server changes, reset channel
  useEffect(() => {
    if (selectedServer) {
      setSelectedChannel(null);
      // optionally auto-select the first channel…
    }
  }, [selectedServer]);

  return (
    <div className="chat-dashboard">
      <aside className="servers-col">
        <ServerList 
          selected={selectedServer}
          onSelect={setSelectedServer}
        />
      </aside>
      <aside className="channels-col">
        {selectedServer
          ? <ServerChannel
              serverId={selectedServer}
              selectedChannel={selectedChannel}
              onSelectChannel={setSelectedChannel}
            />
          : <p className="placeholder">Select a server</p>}
      </aside>
      <main className="chat-col">
        {selectedChannel
          ? <>
              <MessageList channelId={selectedChannel} />
              <MessageInput channelId={selectedChannel} />
            </>
          : <p className="placeholder">Select a channel</p>}
      </main>
    </div>
  );
}
