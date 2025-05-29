import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle'; // Kept as is from old code (imported but not used in JSX)
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image'; // Added for image upload functionality
import socket from '../Socket/Socket';
import defaultAvatar from '../../images/vibesync_logo_2.png';
import stylesChat from './dmchat.module.css'; // Using the provided CSS module

const EMOJI_MAP = {
  'happy': '😊', 'sad': '😢', 'laugh': '😂', 'cry': '😭', 'angry': '😠', 'love': '😍', 'wink': '😉', 'cool': '😎', 'surprised': '😮', 'confused': '😕', 'tired': '😴', 'sick': '🤒', 'dizzy': '😵', 'money': '🤑', 'nerd': '🤓', 'party': '🥳', 'sob': '😭', 'rage': '🤬', 'skull': '💀', 'ghost': '👻', 'alien': '👽', 'robot': '🤖', 'thumbsup': '👍', 'thumbsdown': '👎', 'clap': '👏', 'wave': '👋', 'peace': '✌️', 'ok': '👌', 'fire': '🔥', 'star': '⭐', 'heart': '❤️', 'broken_heart': '💔', 'sparkles': '✨', 'tada': '🎉', 'rocket': '🚀', 'bomb': '💣', 'zzz': '💤'
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
  
  const scrollRef = useRef();
  const emojiPickerRef = useRef();

  // --- Start: Added for Image Upload ---
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  // --- End: Added for Image Upload ---

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

  // Close emoji picker when clicking outside (as in old code)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Join room, load history, listen for new DMs (as in old code)
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

  // Auto-scroll (as in old code)
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Convert emoji shortcodes to emojis (as in old code)
  const parseEmojis = (text) => {
    return text.replace(/:(\w+):/g, (match, emojiName) => {
      return EMOJI_MAP[emojiName] || match;
    });
  };

  // --- Start: Added for Image Upload ---
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET); // Ensure this env var is set
        const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/image/upload`, { // Ensure this env var is set
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(data.error?.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        alert(`Failed to upload image: ${error.message}`);
        return null;
    } finally {
        setUploading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (e.g., PNG, JPG, GIF).');
        event.target.value = ''; 
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size must be less than 5MB.');
        event.target.value = '';
        return;
    }

    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
        sendImageMessage(imageUrl);
    }
    event.target.value = ''; // Reset file input
  };

  const sendImageMessage = async (imageUrl) => {
    const msg = {
        senderId: me.id,
        senderName: me.username,
        senderPic: me.profile_pic,
        content: '', // Images have no separate text content
        image: imageUrl,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]); 
    socket.emit('dm_send', { to: peer.id, message: msg });

    try {
        await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/store_dm_image`, { 
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
        });
    } catch (err) {
        console.error('Error storing DM image:', err);
    }
  };

  const handleImageButtonClick = () => {
    if (uploading) return; // Prevent opening file dialog if already uploading
    fileInputRef.current?.click();
  };
  // --- End: Added for Image Upload ---

  const sendMessage = async e => { // Original sendMessage for text
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

  // Add emoji to input (as in old code)
  const addEmoji = (emojiKey) => {
    const emoji = EMOJI_MAP[emojiKey];
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Edit a DM (as in old code)
  const handleEdit = async timestamp => {
    const old = messages.find(m => m.timestamp === timestamp);
    if (!old) return;
    // Cannot edit image messages this way, only text content.
    if (old.image) {
        alert("Image messages cannot be edited directly. Please delete and re-upload if needed.");
        return;
    }
    const newContent = window.prompt('Edit your message:', old.content);
    if (newContent === null || newContent === old.content) return; // Allow empty string if user wants to clear content

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

  // Delete a DM (as in old code)
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

  if (!peer) return null; // Original condition

  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  // let lastDateStr = null; // This was in your old code but not used for rendering a date header

  return (
    // Original main div with its inline style and class name
    <div className={stylesChat.chatArea} style={{ position: 'relative' }}> 
      {/* Original topBar structure and class names */}
      <div className={stylesChat.topBar}>
        <img
          src={peer.profile_pic || defaultAvatar}
          alt={peer.name /* Original used peer.name, not peer.username */}
          className={stylesChat.peerAvatar}
        />
        <h2 className={stylesChat.peerName}>{peer.name}</h2>
      </div>

      {/* Original messages area structure and class names */}
      <div className={stylesChat.messages}>
        {sorted.map((m, i) => {
          const msgDate = new Date(m.timestamp);
          const mine = m.senderId === me.id;
          const fullTimestamp = msgDate.toLocaleString(undefined, { // Original timestamp format
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });

          return (
            // Original React.Fragment and key
            <React.Fragment key={m.timestamp + '' + i}> 
              {/* Original message div structure and class names */}
              <div className={mine ? stylesChat.msgMine : stylesChat.msgPeer}>
                <div className={stylesChat.msgHeader}>
                  <img
                    src={m.senderPic || defaultAvatar}
                    alt={m.senderName}
                    className={stylesChat.msgAvatar}
                  />
                  <span className={stylesChat.msgName}>{m.senderName}</span>
                  <span className={stylesChat.msgTime}>{fullTimestamp}</span>
                  {/* Original edit/delete icons logic */}
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
                {/* Original message text/image rendering logic and class names */}
                <div className={stylesChat.msgText}>
                  {m.image ? ( // This part handles image display, as in old code
                    <img 
                      src={m.image} 
                      alt="Shared image" 
                      style={{ // Using exact inline styles from old code for images
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
        <div ref={scrollRef} /> {/* Original scrollRef placement */}
      </div>

      {/* Original Emoji Picker structure and inline styles */}
      {showEmojiPicker && (
        <div style={{
          position: 'absolute',
          bottom: '70px', 
          right: '20px',  
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

      {/* Original inputBar structure and class names, with additions for image upload */}
      <div className={stylesChat.inputBar}>
        {/* Hidden File Input - logically grouped with the button that triggers it */}
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }} 
        />
        
        {/* --- Start: Image Icon and Loader (MOVED TO THE LEFT) --- */}
        {uploading ? (
            <span style={{ 
                color: '#b9bbbe', 
                marginRight: '8px', // Space between loader and text input
                display: 'flex', 
                alignItems: 'center' 
            }}>⏳</span>
        ) : (
            <ImageIcon 
              style={{ 
                color: '#b9bbbe', 
                cursor: 'pointer', 
                marginRight: '8px', // Space between icon and text input
                fontSize: '24px'
              }}
              onClick={handleImageButtonClick}
            />
        )}
        {/* --- End: Image Icon and Loader --- */}
        
        {/* Original text input */}
        <input
          type="text" 
          placeholder={`Message ${peer.name}`}
          className={stylesChat.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={sendMessage}
          disabled={uploading} 
        />
        
        {/* Original Emoji Icon and its inline styles */}
        <EmojiEmotionsIcon 
          style={{ 
            color: '#b9bbbe', 
            cursor: 'pointer', 
            marginLeft: '8px', // Added marginLeft for spacing from text input
            fontSize: '24px'
          }}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        />
      </div>
    </div>
  );
}