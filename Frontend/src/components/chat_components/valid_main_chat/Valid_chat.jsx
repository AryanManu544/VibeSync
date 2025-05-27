import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import valid_chat_css from '../valid_main_chat/valid_chat_css.module.css';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import TagIcon from '@mui/icons-material/Tag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import socket from '../../Socket/Socket';
import logo from '../../../images/discord_logo_3.png';
import { useParams } from 'react-router-dom';

// Emoji data - same as DMChat
const EMOJI_MAP = {
  // Faces
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
  // Gestures
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
  'Smileys': ['happy', 'sad', 'laugh', 'cry', 'angry', 'love', 'wink', 'cool', 'surprised', 'confused', 'tired', 'sick', 'dizzy', 'money', 'nerd', 'party', 'sob', 'rage'],
  'Objects': ['skull', 'ghost', 'alien', 'robot', 'fire', 'star', 'heart', 'broken_heart', 'sparkles', 'tada', 'rocket', 'bomb', 'zzz'],
  'Gestures': ['thumbsup', 'thumbsdown', 'clap', 'wave', 'peace', 'ok']
};

function Valid_chat() {
  const url = process.env.REACT_APP_URL;
  const { server_id } = useParams();

  const channel_id = useSelector(state => state.current_page.page_id);
  const channel_name = useSelector(state => state.current_page.page_name);
  const username = useSelector(state => state.user_info.username);
  const tag = useSelector(state => state.user_info.tag);
  const profile_pic = useSelector(state => state.user_info.profile_pic);
  const id = useSelector(state => state.user_info.id);

  const [chat_message, setchat_message] = useState('');
  const [all_messages, setall_messages] = useState(null);
  const [latest_message, setlatest_message] = useState(null);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const fileInputRef = useRef();
  const emojiPickerRef = useRef();
  const imageUploadRef = useRef();

  // Track Shift key
  useEffect(() => {
    const handleDown = e => e.key === 'Shift' && setShiftPressed(true);
    const handleUp = e => e.key === 'Shift' && setShiftPressed(false);
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  // Close pickers when clicking outside
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

  useEffect(() => {
    socket.emit('join_chat', channel_id);
  }, [channel_id]);

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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    formData.append('server_id', server_id);
    formData.append('channel_id', channel_id);

    try {
      const response = await fetch(`${url}/upload_channel_image`, {
        method: 'POST',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        const timestamp = Date.now();
        const message = {
          content: '',
          image: data.imageUrl,
          sender_id: id,
          sender_name: username,
          sender_pic: profile_pic,
          timestamp: timestamp
        };

        if (all_messages != null) {
          setall_messages([...all_messages, message]);
        } else {
          setall_messages([message]);
        }

        socket.emit('send_image_message', channel_id, data.imageUrl, timestamp, username, tag, profile_pic);
        
        // Store image message
        await store_image_message(data.imageUrl, timestamp);
        
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

  function send_message(e) {
    if (e.code === 'Enter') {
      let message_to_send = parseEmojis(chat_message);
      let timestamp = Date.now();
      setchat_message('');
      const message = {
        content: message_to_send,
        sender_id: id,
        sender_name: username,
        sender_pic: profile_pic,
        timestamp: timestamp
      };
      if (all_messages != null) {
        setall_messages([...all_messages, message]);
      } else {
        setall_messages([message]);
      }
      socket.emit('send_message', channel_id, message_to_send, timestamp, username, tag, profile_pic);
      store_message(message_to_send, timestamp);
    }
  }

  const store_message = async (chat_message, timestamp) => {
    const res = await fetch(`${url}/store_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({
        message: chat_message, server_id, channel_id, channel_name,
        timestamp, username, tag, id, profile_pic
      }),
    });
    const data = await res.json();
    if (data.status == 200) {
      console.log('message stored');
    }
  };

  const store_image_message = async (imageUrl, timestamp) => {
    const res = await fetch(`${url}/store_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({
        message: '', 
        image: imageUrl,
        server_id, 
        channel_id, 
        channel_name,
        timestamp, 
        username, 
        tag, 
        id, 
        profile_pic
      }),
    });
    const data = await res.json();
    if (data.status == 200) {
      console.log('image message stored');
    }
  };

  // Add emoji to input
  const addEmoji = (emojiKey) => {
    const emoji = EMOJI_MAP[emojiKey];
    setchat_message(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (channel_id != '') {
      setall_messages(null);
      get_messages();
    }
  }, [channel_id]);

  const get_messages = async () => {
    const res = await fetch(`${url}/get_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({ channel_id, server_id }),
    });
    const data = await res.json();
    if (data.chats.length != 0) {
      setall_messages(data.chats);
    }
  };

  useEffect(() => {
    if (latest_message != null) {
      let { message, timestamp, sender_name, sender_tag, sender_pic } = latest_message.message_data;
      setall_messages(prev => [...(prev || []), {
        content: message,
        sender_id: sender_pic,
        sender_name: sender_name,
        sender_pic: sender_pic,
        timestamp: timestamp
      }]);
    }
  }, [latest_message]);

  socket.on('recieve_message', message_data => {
    setlatest_message(message_data);
  });

  const handleEdit = async (timestamp) => {
    const target = all_messages.find(m => m.timestamp === timestamp);
    if (!target) return;

    const newContent = window.prompt('Edit your message:', target.content);
    if (!newContent || newContent === target.content) return;

    const processedContent = parseEmojis(newContent);

    try {
      const res = await fetch(`${url}/edit_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, timestamp, newContent: processedContent })
      });

      const data = await res.json();
      if (res.ok && data.status === 200) {
        setall_messages(prev =>
          prev.map(m =>
            m.timestamp === timestamp
              ? { ...m, content: processedContent, edited: true }
              : m
          )
        );
      } else {
        console.error('Edit failed:', data.message);
        alert(data.message || 'Failed to edit message');
      }
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message');
    }
  };

  const handleDelete = async (timestamp) => {
    if (!window.confirm('Delete this message?')) return;

    try {
      const res = await fetch(`${url}/delete_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, timestamp })
      });

      const data = await res.json();
      if (res.ok && data.status === 200) {
        setall_messages(prev => prev.filter(m => m.timestamp !== timestamp));
      } else {
        console.error('Delete failed:', data.message);
        alert(data.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message');
    }
  };

  return (
    <div className={valid_chat_css.mainchat} style={{ position: 'relative' }}>
      <div id={valid_chat_css.top}>
        <div id={valid_chat_css.welcome_part}>
          <div id={valid_chat_css.tag}>
            <TagIcon fontSize='large' />
          </div>
          <div className={valid_chat_css.welcome_comps} id={valid_chat_css.welcome_comp_1}>
            Welcome to #{channel_name}
          </div>
          <div className={valid_chat_css.welcome_comps} id={valid_chat_css.welcome_comp_2}>
            This is the start of the #{channel_name} channel
          </div>

          {all_messages != null &&
            all_messages.map((elem, index) => {
              const timestamp_init = parseInt(elem.timestamp, 10);
              const date = new Date(timestamp_init);
              const timestamp = date.toDateString() + ", " + date.getHours() + ":" + date.getMinutes();
              const isMine = elem.sender_id === id;
              return (
                <div id={valid_chat_css.message_box} key={index}>
                  <div className={valid_chat_css.message_box_comps} id={valid_chat_css.message_left}>
                    <div className={valid_chat_css.user_image_wrap}>
                      <img id={valid_chat_css.user_image} src={elem.sender_pic} alt="" />
                    </div>
                  </div>
                  <div className={valid_chat_css.message_box_comps} id={valid_chat_css.message_right}>
                    <div className={valid_chat_css.message_right_comps} id={valid_chat_css.message_right_top}>
                      <div id={valid_chat_css.message_username}>{elem.sender_name}</div>
                      <div id={valid_chat_css.message_timestamp}>{timestamp}</div>
                      {isMine && shiftPressed && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                          <EditIcon fontSize='small' style={{ cursor: 'pointer' }} onClick={() => handleEdit(elem.timestamp)} />
                          <DeleteIcon fontSize='small' style={{ cursor: 'pointer' }} onClick={() => handleDelete(elem.timestamp)} />
                        </div>
                      )}
                    </div>
                    <div id={valid_chat_css.message_right_bottom}>
                      {elem.image ? (
                        <img 
                          src={elem.image} 
                          alt="Shared image" 
                          style={{ 
                            maxWidth: '400px', 
                            maxHeight: '300px', 
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(elem.image, '_blank')}
                        />
                      ) : (
                        <>
                          {elem.content} {elem.edited && <em style={{ fontSize: '0.75rem' }}>(edited)</em>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <div id={valid_chat_css.chat_part}></div>
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

      <div id={valid_chat_css.bottom}>
        <div id={valid_chat_css.message_input}>
          <AddCircleIcon 
            htmlColor='#B9BBBE' 
            onClick={() => setShowImageUpload(!showImageUpload)}
            style={{ cursor: 'pointer' }}
          />
          <input
            type="text"
            onKeyDown={e => send_message(e)}
            value={chat_message}
            onChange={e => setchat_message(e.target.value)}
            placeholder={`Message #${channel_name}`}
          />
          <EmojiEmotionsIcon 
            htmlColor='#B9BBBE'
            style={{ 
              cursor: 'pointer', 
              marginLeft: '8px',
              fontSize: '24px'
            }}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          />
        </div>
      </div>
    </div>
  );
}

export default Valid_chat;