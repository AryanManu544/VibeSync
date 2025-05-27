import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const scrollRef = useRef();
  const fileInputRef = useRef();
  const emojiPickerRef = useRef();
  const imageUploadRef = useRef();

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
      if (imageUploadRef.current && !imageUploadRef.current.contains(event.target)) {
        setShowImageUpload(false);
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

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { 
        alert('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setSelectedImage(file);
      };
      reader.readAsDataURL(file);
    }
  };

  // Send image message
  const sendImageMessage = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('to', peer.id);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/upload_dm_image`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': localStorage.getItem('token')
          },
          body: formData
        }
      );

      const data = await response.json();
      if (response.ok) {
        const msg = {
          senderId: me.id,
          senderName: me.username,
          senderPic: me.profile_pic,
          content: '',
          image: data.imageUrl,
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, msg]);
        socket.emit('dm_send', { to: peer.id, message: msg });
        
        // Reset image upload state
        setSelectedImage(null);
        setImagePreview(null);
        setShowImageUpload(false);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
    }
  };

  // Send a DM
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
    setInput('');
    setMessages(prev => [...prev, msg]);
    socket.emit('dm_send', { to: peer.id, message: msg });

    try {
      await fetch(
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/store_dm_message`,
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

  // Add emoji to input
  const addEmoji = (emojiKey) => {
    const emoji = EMOJI_MAP[emojiKey];
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Edit a DM
  const handleEdit = async timestamp => {
    const old = messages.find(m => m.timestamp === timestamp);
    if (!old) return;
    const newContent = window.prompt('Edit your message:', old.content);
    if (!newContent || newContent === old.content) return;

    const processedContent = parseEmojis(newContent);
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/edit_dm_message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ peerId: peer.id, timestamp, newContent: processedContent })
      }
    );
    if (res.ok) {
      setMessages(prev =>
        prev.map(m =>
          m.timestamp === timestamp
            ? { ...m, content: processedContent, edited: true }
            : m
        )
      );
    } else {
      alert('Could not edit message');
    }
  };

  // Delete a DM
  const handleDelete = async timestamp => {
    if (!window.confirm('Delete this message?')) return;
    const res = await fetch(
      `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/delete_dm_message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ peerId: peer.id, timestamp })
      }
    );
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.timestamp !== timestamp));
    } else {
      alert('Could not delete message');
    }
  };

  if (!peer) return null;

  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  let lastDateStr = null;

  return (
    <div className={stylesChat.chatArea} style={{ position: 'relative' }}>
      <div className={stylesChat.topBar}>
        <img
          src={peer.profile_pic || defaultAvatar}
          alt={peer.name}
          className={stylesChat.peerAvatar}
        />
        <h2 className={stylesChat.peerName}>{peer.name}</h2>
      </div>

      <div className={stylesChat.messages}>
        {sorted.map((m, i) => {
          const msgDate = new Date(m.timestamp);
          const dateString = msgDate.toDateString();
          const showHeader = dateString !== lastDateStr;
          if (showHeader) lastDateStr = dateString;

          const mine = m.senderId === me.id;
          const fullTimestamp = msgDate.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          return (
            <React.Fragment key={m.timestamp + i}>
              <div className={mine ? stylesChat.msgMine : stylesChat.msgPeer}>
                <div className={stylesChat.msgHeader}>
                  <img
                    src={m.senderPic || defaultAvatar}
                    alt={m.senderName}
                    className={stylesChat.msgAvatar}
                  />
                  <span className={stylesChat.msgName}>{m.senderName}</span>
                  <span className={stylesChat.msgTime}>{fullTimestamp}</span>
                  {mine && shiftPressed && (
                    <span className={stylesChat.actionIcons}>
                      <EditIcon
                        className={stylesChat.editIcon}
                        onClick={() => handleEdit(m.timestamp)}
                      />
                      <DeleteIcon
                        className={stylesChat.deleteIcon}
                        onClick={() => handleDelete(m.timestamp)}
                      />
                    </span>
                  )}
                </div>
                <div className={stylesChat.msgText}>
                  {m.image ? (
                    <img 
                      src={m.image} 
                      alt="Shared image" 
                      style={{ 
                        maxWidth: '300px', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => window.open(m.image, '_blank')}
                    />
                  ) : (
                    <>
                      {m.content}
                      {m.edited && <em className={stylesChat.editedTag}>(edited)</em>}
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          left: '20px',
          background: '#2f3136',
          border: '1px solid #40444b',
          borderRadius: '8px',
          padding: '16px',
          minWidth: '300px',
          zIndex: 1000
        }} ref={imageUploadRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '16px' }}>Upload Image</h3>
            <CloseIcon 
              style={{ color: '#b9bbbe', cursor: 'pointer' }}
              onClick={() => {
                setShowImageUpload(false);
                setSelectedImage(null);
                setImagePreview(null);
              }}
            />
          </div>
          
          {imagePreview ? (
            <div>
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{ 
                  maxWidth: '250px', 
                  maxHeight: '200px', 
                  borderRadius: '4px',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={sendImageMessage}
                  style={{
                    background: '#5865f2',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  style={{
                    background: '#4f545c',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                ref={fileInputRef}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: '#4f545c',
                  color: '#fff',
                  border: '2px dashed #72767d',
                  padding: '20px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                Click to select an image
              </button>
            </div>
          )}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          bottom: '70px',
          right: '60px',
          background: 'linear-gradient(to bottom,rgb(78, 18, 107),rgb(136, 48, 208))',
          border: '1px solid #40444b',
          borderRadius: '8px',
          padding: '12px',
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }} ref={emojiPickerRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Emojis</h3>
            <CloseIcon 
              style={{ color: '#b9bbbe', cursor: 'pointer', fontSize: '18px' }}
              onClick={() => setShowEmojiPicker(false)}
            />
          </div>
          
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#b9bbbe', fontSize: '12px', margin: '0 0 8px 0' }}>{category}</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(8, 1fr)', 
                gap: '4px' 
              }}>
                {emojis.map(emojiKey => (
                  <div
                    key={emojiKey}
                    onClick={() => addEmoji(emojiKey)}
                    style={{
                      fontSize: '20px',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      textAlign: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#40444b'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title={`:${emojiKey}:`}
                  >
                    {EMOJI_MAP[emojiKey]}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <div style={{ marginTop: '12px', padding: '8px', background: '#40444b', borderRadius: '4px' }}>
            <p style={{ color: '#b9bbbe', fontSize: '11px', margin: 0 }}>
              💡 Tip: You can also type emoji codes like :happy: or :fire: directly in your message!
            </p>
          </div>
        </div>
      )}

      <div className={stylesChat.inputBar}>
        <AddCircleIcon 
          className={stylesChat.addIcon} 
          onClick={() => setShowImageUpload(!showImageUpload)}
          style={{ cursor: 'pointer' }}
        />
        <input
          type="text"
          placeholder={`Message ${peer.name}`}
          className={stylesChat.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={sendMessage}
        />
        <EmojiEmotionsIcon 
          style={{ 
            color: '#b9bbbe', 
            cursor: 'pointer', 
            marginLeft: '8px',
            fontSize: '24px'
          }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />
      </div>
    </div>
  );
}