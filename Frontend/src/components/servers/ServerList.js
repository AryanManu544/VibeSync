import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../../services/apiService';
import './ServerList.css';

const ServerList = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddServerModalOpen, setIsAddServerModalOpen] = useState(false);
  const navigate = useNavigate();
  const { serverId } = useParams();

  // Fetch user's servers
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await apiService.get('/servers');
        setServers(response);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch servers:", err);
        setError("Failed to load servers");
        setLoading(false);
      }
    };

    fetchServers();
  }, []);

  const handleServerClick = (id) => {
    navigate(`/server/${id}`);
  };

  const openAddServerModal = () => {
    setIsAddServerModalOpen(true);
  };

  const closeAddServerModal = () => {
    setIsAddServerModalOpen(false);
  };

  // Modal for adding a new server
  const AddServerModal = () => {
    const [serverName, setServerName] = useState('');
    const [serverIcon, setServerIcon] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!serverName.trim()) return;

      setIsSubmitting(true);
      
      try {
        // Create form data if there's an icon to upload
        const formData = new FormData();
        formData.append('name', serverName);
        if (serverIcon) {
          formData.append('icon', serverIcon);
        }

        const newServer = await apiService.post('/servers', formData);
        setServers(prev => [...prev, newServer]);
        closeAddServerModal();
        
        // Navigate to the new server
        navigate(`/server/${newServer._id}`);
      } catch (err) {
        console.error("Failed to create server:", err);
        // Display error message to user
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleFileChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        setServerIcon(e.target.files[0]);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Create a Server</h2>
            <button onClick={closeAddServerModal} className="close-button">×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Server Name</label>
              <input
                type="text"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
                placeholder="Enter server name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Server Icon (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={closeAddServerModal}
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Server'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="server-list">
      {/* Discord Home Button */}
      <div 
        className={`server-icon home-icon ${!serverId ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <img src="/discord-icon.ico" alt="Home" />
      </div>
      
      {/* Server Separator */}
      <div className="server-separator"></div>
      
      {/* Server List */}
      {loading ? (
        <div className="loading-servers">Loading...</div>
      ) : error ? (
        <div className="error-servers">{error}</div>
      ) : (
        servers.map((server) => (
          <div 
            key={server._id}
            className={`server-icon ${server._id === serverId ? 'active' : ''}`}
            onClick={() => handleServerClick(server._id)}
          >
            {server.icon ? (
              <img src={server.icon} alt={server.name} />
            ) : (
              <div className="server-initials">
                {server.name.substring(0, 2).toUpperCase()}
              </div>
            )}
            <div className="server-tooltip">{server.name}</div>
          </div>
        ))
      )}
      
      {/* Add Server Button */}
      <div 
        className="server-icon add-server"
        onClick={openAddServerModal}
      >
        <i className="fas fa-plus"></i>
        <div className="server-tooltip">Add a Server</div>
      </div>
      
      {/* Add Server Modal */}
      {isAddServerModalOpen && <AddServerModal />}
    </div>
  );
};

export default ServerList;