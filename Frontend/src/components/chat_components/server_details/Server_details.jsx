import React, { useState, useEffect } from 'react';
import servercss from '../server_details/server_details.module.css';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Add as AddIcon,
  VolumeUp as VolumeUpIcon,
  Tag as TagIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { change_page_id, change_page_name } from '../../../Redux/current_page';
import Modal from 'react-bootstrap/Modal';
import Radio from '@mui/material/Radio';
import { useParams } from 'react-router-dom';
import VoiceVideoModal from '../../VoiceVideoModal'; 

/**
 * @param {Object} props
 * @param {function} props.new_req_received 
 * @param {Object} props.elem 
 */
export default function ServerDetails({ new_req_received = () => {}, elem }) {
  const dispatch = useDispatch();
  const { server_id } = useParams();
  const url = process.env.REACT_APP_URL;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChannels, setShowChannels] = useState(true);
  const [selectedChannelType, setSelectedChannelType] = useState('text');
  const [newChannelName, setNewChannelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Voice/Video Modal States
  const [showVoiceVideoModal, setShowVoiceVideoModal] = useState(false);
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);

  const [channels, setChannels] = useState(elem.channels || []);

  useEffect(() => {
    setChannels(elem.channels || []);
  }, [elem.channels]);

  const toggleChannels = () => setShowChannels(v => !v);

  const openModal = () => setShowCreateModal(true);
  const closeModal = () => {
    setShowCreateModal(false);
    setNewChannelName('');
    setSelectedChannelType('text');
    setIsCreating(false);
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch(`${url}/add_new_channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          channel_name: newChannelName,
          category_id: elem._id,
          channel_type: selectedChannelType,
          server_id
        })
      });
      const data = await res.json();
      if (data.status === 200) {
        new_req_received();
        closeModal();
      }
    } catch (err) {
      console.error('Create channel error:', err);
      setIsCreating(false);
    }
  };

  const deleteChannel = async (channelId) => {
    const confirmDelete = window.confirm('Delete this channel?');
    if (!confirmDelete) return;
    try {
      const res = await fetch(`${url}/delete_channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ server_id, channel_id: channelId })
      });
      const data = await res.json();
      if (data.status === 200) {
        setChannels(prev => prev.filter(c => c._id !== channelId));
        new_req_received();
      }
    } catch (err) {
      console.error('Delete channel error:', err);
    }
  };

  const selectChannel = (type, name, id) => {
    if (type === 'text') {
      // Handle text channel selection
      dispatch(change_page_name(name));
      dispatch(change_page_id(id));
    } else if (type === 'voice') {
      // Handle voice channel selection - open voice/video modal
      setActiveVoiceChannel({
        id: id,
        name: name,
        categoryName: elem.category_name
      });
      setShowVoiceVideoModal(true);
    }
  };

  const closeVoiceVideoModal = () => {
    setShowVoiceVideoModal(false);
    setActiveVoiceChannel(null);
  };

  return (
    <div className={servercss.serverPanel}>
      <div className={servercss.categories}>
        <div className={servercss.categories_left} onClick={toggleChannels}>
          {showChannels ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          {elem.category_name}
        </div>
        <div className={servercss.categories_left}>
          <AddIcon onClick={openModal} fontSize="small" />
        </div>
      </div>

      {showChannels && channels.map(channel => (
        <div key={channel._id} className={servercss.channels_wrap}>
          <div className={servercss.channels}>
            <div 
              className={servercss.channel_left} 
              onClick={() => selectChannel(channel.channel_type, channel.channel_name, channel._id)}
            >
              {channel.channel_type === 'text' ? <TagIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
              <div className={servercss.channel_name}>{channel.channel_name}</div>
            </div>
            <div className={servercss.channel_delete}>
              <DeleteForeverIcon 
                onClick={(e) => {
                  e.stopPropagation(); // Prevent channel selection when deleting
                  deleteChannel(channel._id);
                }} 
                fontSize="small" 
                style={{ cursor: 'pointer', color: '#e74c3c' }} 
              />
            </div>
          </div>
        </div>
      ))}

      {/* Create Channel Modal */}
      <Modal show={showCreateModal} centered onHide={closeModal} id={servercss.modal_main_wrap}>
        <div className={servercss.modal_main}>
          <h3>Create Channel in "{elem.category_name}"</h3>
          <div className={servercss.channel_type_section}>
            <label data-type="Text">
              <Radio 
                checked={selectedChannelType === 'text'} 
                value="text" 
                onChange={() => setSelectedChannelType('text')}
                sx={{
                  display: 'none'
                }}
              />
            </label>
            <label data-type="Voice">
              <Radio 
                checked={selectedChannelType === 'voice'} 
                value="voice" 
                onChange={() => setSelectedChannelType('voice')}
                sx={{
                  display: 'none'
                }}
              />
            </label>
          </div>
          <div className={servercss.input_div}>
            <input
              type="text"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              placeholder="new-channel"
              disabled={isCreating}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isCreating && newChannelName.trim()) {
                  createChannel();
                }
              }}
            />
          </div>
          <div className={servercss.modal_buttons}>
            <button onClick={closeModal} disabled={isCreating}>
              Cancel
            </button>
            <button onClick={createChannel} disabled={isCreating || !newChannelName.trim()}>
              {isCreating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Voice/Video Modal */}
      {activeVoiceChannel && (
        <VoiceVideoModal
          isOpen={showVoiceVideoModal}
          onClose={closeVoiceVideoModal}
          channelId={activeVoiceChannel.id}
          channelName={activeVoiceChannel.name}
          initialVideoEnabled={false} 
        />
      )}
    </div>
  );
}