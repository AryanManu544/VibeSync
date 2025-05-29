import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import socket from '../Socket/Socket';
import defaultAvatar from '../../images/vibesync_logo_2.png';
import stylesChat from './dmchat.module.css';

const EMOJI_MAP = {
  'happy': '😊',
  'sad': '😢',
  'laugh': '😂',
  'cry': '😭',
  'angry': '😠',
  'love': '😍',
  'wink': '😉',
  'cool': '😎',
  'surprised': '😮',
  'confused': '😕',
  'tired': '😴',
  'sick': '🤒',
  'dizzy': '😵',
  'money': '🤑',
  'nerd': '🤓',
  'party': '🥳',
  'sob': '😭',
  'rage': '🤬',
  'skull': '💀',
  'ghost': '👻',
  'alien': '👽',
  'robot': '🤖',
  'thumbsup': '👍',
  'thumbsdown': '👎',
  'clap': '👏',
  'wave': '👋',
  'peace': '✌️',
  'ok': '👌',
  'fire': '🔥',
  'star': '⭐',
  'heart': '❤️',
  'broken_heart': '💔',
  'sparkles': '✨',
  'tada': '🎉',
  'rocket': '🚀',
  'bomb': '💣',
  'zzz': '💤'
};

const EMOJI_CATEGORIES = {
  'Faces': ['happy', 'sad', 'laugh', 'cry', 'angry', 'love', 'wink', 'cool', 'surprised', 'confused', 'tired', 'sick', 'dizzy', 'money', 'nerd', 'party', 'sob', 'rage','skull'],
  'Objects': ['ghost', 'alien', 'robot', 'fire', 'star', 'heart', 'broken_heart', 'sparkles', 'tada', 'rocket', 'bomb', 'zzz'],
  'Gestures': ['thumbsup', 'thumbsdown', 'clap', 'wave', 'peace', 'ok']
};

export default function DMChat() {
  const peer = useSelector(s => s.active_dm);
  const me = useSelector(s => s.user_info);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [shiftPressed, setShiftPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const scrollRef = useRef();
  const emojiPickerRef = useRef();
  const fileInputRef = useRef();

  useEffect(() => {
    const down = e => e.key === 'Shift' && setShiftPressed(true);
    const up = e => e.key === 'Shift' && setShiftPressed(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Join room, load history, listen for new DMs
  useEffect(() => {
    if (!peer) return;
    const room = { me: me.id, peer: peer.id };
    socket.emit('join_dm', room);

    fetch(
      `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/get_dm_history`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ user2: peer.id })
      }
    )
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.history)) setMessages(data.history);
      });

    const handler = msg => setMessages(prev => [...prev, msg]);
    socket.on('dm_receive', handler);

    return () => {
      socket.emit('leave_dm', room);
      socket.off('dm_receive', handler);
      setMessages([]);
    };
  }, [peer, me.id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Convert emoji shortcodes to emojis
  const parseEmojis = (text) => {
    return text.replace(/:(\w+):/g, (match, emojiName) => {
      return EMOJI_MAP[emojiName] || match;
    });
  };

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET);
      
      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      sendImageMessage(imageUrl);
    }

    // Reset file input
    event.target.value = '';
  };

  // Send image message
  const sendImageMessage = async (imageUrl) => {
    const msg = {
      senderId: me.id,
      senderName: me.username,
      senderPic: me.profile_pic,
      content: '',
      image: imageUrl,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, msg]);
    socket.emit('dm_send', { to: peer.id, message: msg });

    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/store_dm_image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({
            to: peer.id,
            senderName: msg.senderName,
            senderPic: msg.senderPic,
            image: msg.image,
            timestamp: msg.timestamp
          })
        }
      );
    } catch (err) {
      console.error('Error storing DM image:', err);
    }
  };

  const sendMessage = async e => {
    if (e.key !== 'Enter' || !input.trim()) return;
    
    const processedContent = parseEmojis(input.trim());
    const msg = {
      senderId: me.id,
      senderName: me.username,
      senderPic: me.profile_pic,
      content: processedContent,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, msg]);
    setInput('');
    socket.emit('dm_send', { to: peer.id, message: msg });

    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/store_dm`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({
            to: peer.id,
            senderName: msg.senderName,
            senderPic: msg.senderPic,
            content: msg.content,
            timestamp: msg.timestamp
          })
        }
      );
    } catch (err) {
      console.error('Error storing DM:', err);
    }
  };

  const addEmoji = (emojiKey) => {
    setInput(prev => prev + EMOJI_MAP[emojiKey]);
    setShowEmojiPicker(false);
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (!peer) {
    return (
      <div className={stylesChat.chatArea}>
        <h3>Select a user to start chatting</h3>
      </div>
    );
  }

  return (
    <div className={stylesChat.chatArea}>
      {/* Top Bar */}
      <div className={stylesChat.topBar}>
        <img 
          src={peer.profile_pic || defaultAvatar} 
          alt={peer.username}
          className={stylesChat.peerAvatar}
        />
        <div className={stylesChat.peerName}>{peer.username}</div>
      </div>

      {/* Messages */}
      <div className={stylesChat.messages}>
        {messages.map((msg, index) => {
          const isMyMessage = msg.senderId === me.id;
          return (
            <div 
              key={index} 
              className={isMyMessage ? stylesChat.msgMine : stylesChat.msgPeer}
            >
              <div className={stylesChat.msgHeader}>
                <img 
                  src={msg.senderPic || defaultAvatar} 
                  alt={msg.senderName}
                  className={stylesChat.msgAvatar}
                />
                <span className={stylesChat.msgName}>{msg.senderName}</span>
                <span className={stylesChat.msgTime}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <div className={stylesChat.actionIcons}>
                  <EditIcon className={stylesChat.editIcon} />
                  <DeleteIcon className={stylesChat.deleteIcon} />
                </div>
              </div>
              
              <div className={stylesChat.msgText}>
                {msg.image ? (
                  <img 
                    src={msg.image} 
                    alt="Shared image" 
                    style={{ maxWidth: '100%', borderRadius: '4px', cursor: 'pointer' }}
                    onClick={() => window.open(msg.image, '_blank')}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Bar */}
      <div className={stylesChat.inputBar}>
        {uploading ? (
          <span className={stylesChat.addIcon}>⏳</span>
        ) : (
          <AddCircleIcon 
            className={stylesChat.addIcon}
            onClick={handleImageButtonClick}
            style={{ cursor: 'pointer' }}
          />
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={sendMessage}
          placeholder="Type a message..."
          className={stylesChat.input}
          disabled={uploading}
        />

        <EmojiEmotionsIcon 
          style={{ marginLeft: '8px', cursor: 'pointer', color: '#bbb' }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div 
            ref={emojiPickerRef}
            style={{
              position: 'absolute',
              bottom: '60px',
              right: '20px',
              background: '#36393f',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '12px',
              maxWidth: '300px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 1000
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ color: '#fff', margin: 0 }}>Pick an Emoji</h4>
              <CloseIcon 
                style={{ cursor: 'pointer', color: '#bbb' }}
                onClick={() => setShowEmojiPicker(false)}
              />
            </div>
            
            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
              <div key={category} style={{ marginBottom: '12px' }}>
                <h5 style={{ color: '#ccc', margin: '8px 0 4px 0', fontSize: '0.9rem' }}>{category}</h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  {emojis.map(emojiKey => (
                    <button
                      key={emojiKey}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        borderRadius: '4px'
                      }}
                      onClick={() => addEmoji(emojiKey)}
                      title={emojiKey}
                      onMouseEnter={e => e.target.style.background = '#444'}
                      onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      {EMOJI_MAP[emojiKey]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}