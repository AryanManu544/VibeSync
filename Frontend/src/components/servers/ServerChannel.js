import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ServerChannel.css';

const ServerChannel = ({ onChannelSelect }) => {
  const [server, setServer] = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const { serverId } = useParams();
  const { user } = useAuth();

  // Fetch server details, channels, and members
  useEffect(() => {
    const fetchServerData = async () => {
      if (!serverId) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch server details
        const serverData = await apiService.get(`/servers/${serverId}`);
        setServer(serverData);

        // Fetch server channels
        const channelsData = await apiService.get(`/servers/${serverId}/channels`);
        setChannels(channelsData);

        // Fetch server members
        const membersData = await apiService.get(`/servers/${serverId}/members`);
        setMembers(membersData);

        // Select first channel by default
        if (channelsData.length > 0 && !selectedChannel) {
          setSelectedChannel(channelsData[0]);
          onChannelSelect(channelsData[0]);
        }
      } catch (err) {
        console.error("Failed to fetch server data:", err);
        setError("Failed to load server data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
  }, [serverId, onChannelSelect]);

  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    onChannelSelect(channel);
  };

  const openAddChannelModal = () => {
    setIsAddChannelModalOpen(true);
  };

  const closeAddChannelModal = () => {
    setIsAddChannelModalOpen(false);
  };

  // Check if user is server owner
  const isServerOwner = server && user && server.ownerId === user.id;

  // Group members by online status
  const groupMembersByStatus = () => {
    const online = members.filter(member => member.isOnline);
    const offline = members.filter(member => !member.isOnline);
    return { online, offline };
  };

  const { online, offline } = groupMembersByStatus();

  // Add Channel Modal
  const AddChannelModal = () => {
    const [channelName, setChannelName] = useState('');
    const [channelType, setChannelType] = useState('text');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!channelName.trim()) return;

      setIsSubmitting(true);
      
      try {
        const newChannel = await apiService.post(`/servers/${serverId}/channels`, {
          name: channelName.trim(),
          type: channelType
        });
        
        setChannels(prev => [...prev, newChannel]);
        closeAddChannelModal();
        
        // Select the new channel
        setSelectedChannel(newChannel);
        onChannelSelect(newChannel);
      } catch (err) {
        console.error("Failed to create channel:", err);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create Channel</h2>
            <button onClick={closeAddChannelModal} className="close-button">×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Channel Type</label>
              <div className="channel-type-selector">
                <label className={channelType === 'text' ? 'selected' : ''}>
                  <input
                    type="radio"
                    value="text"
                    checked={channelType === 'text'}
                    onChange={() => setChannelType('text')}
                  />
                  <i className="fas fa-hashtag"></i> Text Channel
                </label>
                <label className={channelType === 'voice' ? 'selected' : ''}>
                  <input
                    type="radio"
                    value="voice"
                    checked={channelType === 'voice'}
                    onChange={() => setChannelType('voice')}
                  />
                  <i className="fas fa-volume-up"></i> Voice Channel
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Channel Name</label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="new-channel"
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={closeAddChannelModal}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Channel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-server">Loading server data...</div>;
  }

  if (error) {
    return <div className="error-server">{error}</div>;
  }

  if (!server) {
    return <div className="no-server">Server not found</div>;
  }

  return (
    <div className="server-channel">
      {/* Server Header */}
      <div className="server-header">
        <h2>{server.name}</h2>
        {isServerOwner && (
          <button className="server-settings-button">
            <i className="fas fa-cog"></i>
          </button>
        )}
      </div>

      {/* Channels Section */}
      <div className="channels-section">
        <div className="section-header">
          <span>TEXT CHANNELS</span>
          {isServerOwner && (
            <button 
              className="add-channel-button"
              onClick={openAddChannelModal}
            >
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>
        
        <div className="channel-list">
          {channels
            .filter(channel => channel.type === 'text')
            .map(channel => (
              <div
                key={channel._id}
                className={`channel-item ${selectedChannel?._id === channel._id ? 'active' : ''}`}
                onClick={() => handleChannelSelect(channel)}
              >
                <i className="fas fa-hashtag"></i>
                <span>{channel.name}</span>
              </div>
            ))}
        </div>

        <div className="section-header">
          <span>VOICE CHANNELS</span>
        </div>
        
        <div className="channel-list">
          {channels
            .filter(channel => channel.type === 'voice')
            .map(channel => (
              <div
                key={channel._id}
                className="channel-item voice-channel"
                onClick={() => handleChannelSelect(channel)}
              >
                <i className="fas fa-volume-up"></i>
                <span>{channel.name}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Members Section */}
      <div className="members-section">
        <div className="section-header">
          <span>MEMBERS - {members.length}</span>
        </div>
        
        <div className="member-list">
          <div className="member-group">
            <div className="member-group-header">ONLINE - {online.length}</div>
            {online.map(member => (
              <div key={member._id} className="member-item">
                <div className="member-avatar">
                  <img 
                    src={member.avatarUrl || '/default-avatar.png'} 
                    alt={member.username} 
                  />
                  <span className="status-indicator online"></span>
                </div>
                <span className="member-name">{member.username}</span>
                {server.ownerId === member._id && (
                  <span className="member-crown">
                    <i className="fas fa-crown"></i>
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="member-group">
            <div className="member-group-header">OFFLINE - {offline.length}</div>
            {offline.map(member => (
              <div key={member._id} className="member-item offline">
                <div className="member-avatar">
                  <img 
                    src={member.avatarUrl || '/default-avatar.png'} 
                    alt={member.username} 
                  />
                  <span className="status-indicator offline"></span>
                </div>
                <span className="member-name">{member.username}</span>
                {server.ownerId === member._id && (
                  <span className="member-crown">
                    <i className="fas fa-crown"></i>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Channel Modal */}
      {isAddChannelModalOpen && <AddChannelModal />}
    </div>
  );
};

export default ServerChannel;