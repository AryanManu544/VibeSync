// src/components/dmpage/DMChat.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import socket from '../Socket/Socket';
import defaultAvatar from '../../images/vibesync_logo_2.png'; 
import stylesChat from './dmchat.module.css';

export default function DMChat() {
  const peer = useSelector(s => s.active_dm);
  const me   = useSelector(s => s.user_info);

  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [shiftPressed, setShiftPressed] = useState(false);
  const scrollRef     = useRef();

  // Track Shift key globally
  useEffect(() => {
    const down = e => { if (e.key === 'Shift') setShiftPressed(true); };
    const up   = e => { if (e.key === 'Shift') setShiftPressed(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup',   up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup',   up);
    };
  }, []);

  // Join room, load history, listen for new DMs
  useEffect(() => {
    if (!peer) return;
    socket.emit('join_dm', { me: me.id, peer: peer.id });

    fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/get_dm_history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({user2: peer.id })
    })
      .then(r => r.json())
      .then(data => Array.isArray(data.history) && setMessages(data.history));

    const handler = msg => setMessages(prev => [...prev, msg]);
    socket.on('dm_receive', handler);

    return () => {
      socket.emit('leave_dm', { me: me.id, peer: peer.id });
      socket.off('dm_receive', handler);
      setMessages([]);
    };
  }, [peer, me.id]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send & persist
  const sendMessage = async e => {
    if (e.key !== 'Enter' || !input.trim()) return;
    const msg = {
      senderId:   me.id,
      senderName: me.username,
      senderPic:  me.profile_pic,
      content:    input.trim(),
      timestamp:  Date.now()
    };
    setInput('');
    setMessages(prev => [...prev, msg]);
    socket.emit('dm_send', { to: peer.id, message: msg });

    try {
      await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/store_dm_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({
          to:         peer.id,
          senderName: msg.senderName,
          senderPic:  msg.senderPic,
          content:    msg.content,
          timestamp:  msg.timestamp
        })
      });
    } catch (err) {
      console.error('Error storing DM:', err);
    }
  };

  // Edit
  const handleEdit = async timestamp => {
    const old = messages.find(m => m.timestamp === timestamp);
    if (!old) return;
    const newContent = window.prompt('Edit your message:', old.content);
    if (!newContent || newContent === old.content) return;

    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/edit_dm_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({ peerId: peer.id, timestamp, newContent })
    });
    if (res.ok) {
      setMessages(prev =>
        prev.map(m =>
          m.timestamp === timestamp
            ? { ...m, content: newContent, edited: true }
            : m
        )
      );
    } else {
      alert('Could not edit message');
    }
  };

  // Delete
  const handleDelete = async timestamp => {
    if (!window.confirm('Delete this message?')) return;
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000'}/delete_dm_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({ peerId: peer.id, timestamp })
    });
    if (res.ok) {
      setMessages(prev => prev.filter(m => m.timestamp !== timestamp));
    } else {
      alert('Could not delete message');
    }
  };

  if (!peer) return null;

  return (
    <div className={stylesChat.chatArea}>
      <div className={stylesChat.topBar}>
        <img src={peer.profile_pic || defaultAvatar} alt={peer.name} className={stylesChat.peerAvatar} />
        <h2 className={stylesChat.peerName}>{peer.name}</h2>
      </div>

      <div className={stylesChat.messages}>
        {messages.map((m,i) => {
          const mine = m.senderId === me.id;
          const time = new Date(m.timestamp).toLocaleTimeString();
          return (
            <div key={i} className={mine ? stylesChat.msgMine : stylesChat.msgPeer}>
              <div className={stylesChat.msgHeader}>
                <img src={m.senderPic} alt={m.senderName} className={stylesChat.msgAvatar} />
                <span className={stylesChat.msgName}>{m.senderName}</span>
                <span className={stylesChat.msgTime}>{time}</span>
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
                {m.content} {m.edited && <em className={stylesChat.editedTag}>(edited)</em>}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef}/>
      </div>

      <div className={stylesChat.inputBar}>
        <AddCircleIcon className={stylesChat.addIcon}/>
        <input
          type="text"
          placeholder={`Message ${peer.name}`}
          className={stylesChat.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={sendMessage}
        />
      </div>
    </div>
  );
}