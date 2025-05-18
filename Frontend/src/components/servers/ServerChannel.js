// src/components/servers/ServerChannel.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ServerChannel.css';

export default function ServerChannel() {
  const { serverId, channelId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [server, setServer]     = useState(null);
  const [channels, setChannels] = useState([]);
  const [members, setMembers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  // redirect if not logged in
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // fetch server + channels + members
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const srv = await apiService.get(`/servers/${serverId}`);
        const chs = await apiService.get(`/servers/${serverId}/channels`);
        const mms = await apiService.get(`/servers/${serverId}/members`);
        setServer(srv);
        setChannels(chs);
        setMembers(mms);
        setError(null);
      } catch (e) {
        console.error(e);
        setError(e);
      } finally {
        setLoading(false);
      }
    }
    if (serverId) load();
  }, [serverId]);

  // if load error or no server
  if (!loading && (error || !server)) {
    return <Navigate to="/channel" replace />;
  }
  if (loading || !server) {
    return <div className="loading-server">Loading…</div>;
  }

  // Only text channels here
  const textChannels = channels.filter(c => c.type === 'text');
  const isOwner     = server.ownerId === user.id;

  const openAddModal = () => setAddModalOpen(true);
  const closeAddModal = () => setAddModalOpen(false);

  const handleClickChannel = (ch) => {
    navigate(`/channel/${serverId}/${ch._id}`);
  };

  return (
    <div className="server-channel">
      <div className="server-header">
        <h2>{server.name}</h2>
        {isOwner && (
          <button onClick={openAddModal} className="server-settings-button">
            <i className="fas fa-cog"></i>
          </button>
        )}
      </div>

      <div className="channels-section">
        <div className="section-header">
          <span>TEXT CHANNELS</span>
          {isOwner && (
            <button onClick={openAddModal} className="add-channel-button">
              <i className="fas fa-plus"></i>
            </button>
          )}
        </div>

        <div className="channel-list">
          {textChannels.map(ch => (
            <div
              key={ch._id}
              className={`channel-item ${channelId === ch._id ? 'active' : ''}`}
              onClick={() => handleClickChannel(ch)}
            >
              <i className="fas fa-hashtag" />
              <span>{ch.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* members omitted for brevity… */}

      {isAddModalOpen && (
        <AddChannelModal
          serverId={serverId}
          onClose={closeAddModal}
          onCreated={(newCh) => {
            setChannels(c => [...c, newCh]);
            closeAddModal();
            navigate(`/channel/${serverId}/${newCh._id}`);
          }}
        />
      )}
    </div>
  );
}

// extracted AddChannelModal
function AddChannelModal({ serverId, onClose, onCreated }) {
  const [name, setName]     = useState('');
  const [type, setType]     = useState('text');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    try {
      const ch = await apiService.post(`/servers/${serverId}/channels`, { name, type });
      onCreated(ch);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={onClose} className="close-button">×</button>
        <h2>Create Channel</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <label><input type="radio" value="text" checked={type==='text'}
                          onChange={()=>setType('text')} /> Text</label>
            <label><input type="radio" value="voice" checked={type==='voice'}
                          onChange={()=>setType('voice')} /> Voice</label>
          </div>
          <div className="form-group">
            <label>Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} required/>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
            <button type="submit" disabled={submitting} className="submit-button">
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}