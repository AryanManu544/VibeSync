import React from 'react';
import ServerSidebar from '../components/servers/ServerSidebar';
import '../styles/DashboardPage.css';

export default function ChannelDashboard() {
  // TODO: replace these with real selected IDs / state
  const exampleServerId  = '602b2a...';

  return (
    <div className="channel-dashboard">
      {/* Far-left: your ServerSidebar */}
      <aside className="servers-col">
        <ServerSidebar serverId={exampleServerId} />
      </aside>

      {/* Middle: Friends panel */}
      <aside className="friends-col">
        {/* Tabs */}
        <div className="tabs">
          <button className="tab active">Friends</button>
          <button className="tab">Online</button>
          <button className="tab">All</button>
          <button className="tab add-friend">Add Friend</button>
        </div>

        {/* Search */}
        <div className="search">
          <i className="fas fa-search" />
          <input type="text" placeholder="Search" />
        </div>

        {/* Friend list */}
        <div className="friend-list">
          {/* Example entries */}
          <div className="friend-item">
            <img src="/avatars/alice.png" alt="Alice" className="avatar" />
            <div className="info">
              <div className="name">Alice</div>
              <div className="status">Playing Chess</div>
            </div>
          </div>
          <div className="friend-item">
            <img src="/avatars/bob.png" alt="Bob" className="avatar" />
            <div className="info">
              <div className="name">Bob</div>
              <div className="status">Online</div>
            </div>
          </div>
          {/* … */}
        </div>
      </aside>

      {/* Right: placeholder until you select a channel */}
      <main className="chat-placeholder">
        Select a server &amp; channel to start chatting
      </main>
    </div>
  );
}