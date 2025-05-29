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
// import logo from '../../../images/discord_logo_3.png'; // Unused
import { useParams } from 'react-router-dom';

const EMOJI_MAP = {
  'happy': '😊', 'sad': '😢', 'laugh': '😂', 'cry': '😭', 'angry': '😠', 'love': '😍', 'wink': '😉', 'cool': '😎', 'surprised': '😮', 'confused': '😕', 'tired': '😴', 'sick': '🤒', 'dizzy': '😵', 'money': '🤑', 'nerd': '🤓', 'party': '🥳', 'sob': '😭', 'rage': '🤬', 'skull': '💀', 'ghost': '👻', 'alien': '👽', 'robot': '🤖', 'thumbsup': '👍', 'thumbsdown': '👎', 'clap': '👏', 'wave': '👋', 'peace': '✌️', 'ok': '👌', 'fire': '🔥', 'star': '⭐', 'heart': '❤️', 'broken_heart': '💔', 'sparkles': '✨', 'tada': '🎉', 'rocket': '🚀', 'bomb': '💣', 'zzz': '💤'
};

const EMOJI_CATEGORIES = {
  'Faces': ['happy', 'sad', 'laugh', 'cry', 'angry', 'love', 'wink', 'cool', 'surprised', 'confused', 'tired', 'sick', 'dizzy', 'money', 'nerd', 'party', 'sob', 'rage','skull'],
  'Objects': ['ghost', 'alien', 'robot', 'fire', 'star', 'heart', 'broken_heart', 'sparkles', 'tada', 'rocket', 'bomb', 'zzz'],
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
  const [uploading, setUploading] = useState(false);

  const emojiPickerRef = useRef();
  const fileInputRef = useRef();
  const messagesContainerRef = useRef(null);

  // Log all_messages whenever it changes
  // useEffect(() => {
  //   console.log('[STATE_UPDATE] all_messages changed:', all_messages);
  // }, [all_messages]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (channel_id) { // Ensure channel_id is valid before emitting
        console.log('[Socket] Emitting join_chat for channel_id:', channel_id);
        socket.emit('join_chat', channel_id);
    }
  }, [channel_id]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [all_messages]);

  const parseEmojis = (text) => {
    return text.replace(/:(\w+):/g, (match, emojiName) => {
      return EMOJI_MAP[emojiName] || match;
    });
  };

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

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    const imageUrl = await handleImageUpload(file);
    if (imageUrl) {
      sendImageMessage(imageUrl);
    }
    event.target.value = '';
  };

  const sendImageMessage = (imageUrl) => {
    let timestamp = Date.now();
    const message = {
      content: '', image: imageUrl, sender_id: id, sender_name: username, sender_pic: profile_pic, timestamp: timestamp // Timestamp is a number
    };
    setall_messages(prev => (prev ? [...prev, message] : [message]));
    socket.emit('send_image_message', channel_id, imageUrl, timestamp, username, tag, profile_pic);
    store_image_message(imageUrl, timestamp);
  };

  function send_message(e) {
    if (e.code === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chat_message.trim()) return;
      let message_to_send = parseEmojis(chat_message);
      let timestamp = Date.now(); // Timestamp is a number
      setchat_message('');
      const message = {
        content: message_to_send, sender_id: id, sender_name: username, sender_pic: profile_pic, timestamp: timestamp
      };
      setall_messages(prev => (prev ? [...prev, message] : [message]));
      socket.emit('send_message', channel_id, message_to_send, timestamp, username, tag, profile_pic);
      store_message(message_to_send, timestamp);
    }
  }

  const store_message = async (chat_message_content, timestamp) => {
    const res = await fetch(`${url}/store_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
      body: JSON.stringify({
        message: chat_message_content, server_id, channel_id, channel_name,
        timestamp, username, tag, id, profile_pic
      }),
    });
    const data = await res.json();
    if (data.status === 200) console.log('Message stored on server');
    else console.error('Failed to store message on server:', data);
  };

  const store_image_message = async (imageUrl, timestamp) => {
    const res = await fetch(`${url}/store_image_message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
      body: JSON.stringify({
        image: imageUrl, server_id, channel_id, channel_name,
        timestamp, username, tag, id, profile_pic
      }),
    });
    const data = await res.json();
    if (data.status === 200) console.log('Image message stored on server');
    else console.error('Failed to store image message on server:', data);
  };

  const addEmoji = (emojiKey) => {
    const emoji = EMOJI_MAP[emojiKey];
    setchat_message(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (channel_id) {
      console.log('[EFFECT channel_id] Channel ID changed to:', channel_id, 'Fetching messages.');
      setall_messages(null); // Clear previous messages
      get_messages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel_id]);

  const get_messages = async () => {
    console.log('[get_messages] Fetching for channel_id:', channel_id, 'server_id:', server_id);
    if (!channel_id) {
        console.warn('[get_messages] channel_id is missing, aborting fetch.');
        setall_messages([]);
        return;
    }
    const res = await fetch(`${url}/get_messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': localStorage.getItem('token') },
      body: JSON.stringify({ channel_id, server_id }),
    });
    const data = await res.json();
    console.log('[get_messages] Response from server:', data);
    if (data.chats && data.chats.length !== 0) {
      const processedChats = data.chats.map(chat => ({
        ...chat,
        timestamp: Number(chat.timestamp) // Ensure timestamp is a number
      }));
      console.log('[get_messages] Processed chats:', processedChats);
      setall_messages(processedChats);
    } else {
      console.log('[get_messages] No chats found or empty array received.');
      setall_messages([]);
    }
  };
  
  useEffect(() => {
    if (latest_message != null) {
      console.log('[EFFECT latest_message] Received new message via socket:', latest_message);
      let { message, timestamp, sender_name, sender_pic, image } = latest_message.message_data;
      const received_sender_id = latest_message.message_data.sender_id || sender_pic; 
      const newMessage = {
        content: message || '',
        image: image || null,
        sender_id: received_sender_id, 
        sender_name: sender_name,
        sender_pic: sender_pic,
        timestamp: Number(timestamp) // Ensure timestamp is a number
      };
      console.log('[EFFECT latest_message] Parsed new message object:', newMessage);
      setall_messages(prev => {
          const updated = [...(prev || []), newMessage];
          console.log('[EFFECT latest_message] Updating all_messages. Prev:', prev, 'New:', updated);
          return updated;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest_message]);

  socket.on('recieve_message', message_data => {
    console.log('[Socket EVENT] recieve_message:', message_data);
    setlatest_message(message_data);
  });

  socket.on('recieve_image_message', message_data => {
    console.log('[Socket EVENT] recieve_image_message:', message_data);
    setlatest_message(message_data);
  });

  const handleEdit = async (timestampToEdit) => {
    console.log(`[handleEdit] Initiated for timestamp: ${timestampToEdit} (type: ${typeof timestampToEdit})`);
    const targetMessage = all_messages ? all_messages.find(m => m.timestamp === timestampToEdit) : null;
    
    if (!targetMessage) {
      console.error('[handleEdit] Target message not found in all_messages. Current all_messages:', all_messages);
      alert('Error: Could not find the message to edit.');
      return;
    }
    console.log('[handleEdit] Found target message:', targetMessage);

    if (targetMessage.image) {
        console.log('[handleEdit] Message is an image, cannot edit.');
        return;
    }

    const newContent = window.prompt('Edit your message:', targetMessage.content);
    if (newContent === null) {
        console.log('[handleEdit] Edit cancelled by user.');
        return;
    }
    if (newContent === targetMessage.content) {
        console.log('[handleEdit] Content is unchanged.');
        return;
    }

    const processedContent = parseEmojis(newContent);
    console.log('[handleEdit] Processed new content:', processedContent);

    try {
      console.log('[handleEdit] Sending API request to /edit_message');
      const res = await fetch(`${url}/edit_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, timestamp: timestampToEdit, newContent: processedContent })
      });

      const data = await res.json();
      console.log('[handleEdit] API Response Status:', res.status);
      console.log('[handleEdit] API Response OK:', res.ok);
      console.log('[handleEdit] API Response Data:', data);

      if (res.ok && data.status === 200) {
        console.log('[handleEdit] Server confirmed edit. Updating client state.');
        setall_messages(prevMessages => {
          console.log('[handleEdit] setall_messages: prevMessages count:', prevMessages ? prevMessages.length : 'null');
          if (!prevMessages) return []; 
          
          const updatedMessages = prevMessages.map(m => {
            if (m.timestamp === timestampToEdit) {
              console.log(`[handleEdit] Mapping: Found message with timestamp ${m.timestamp}. Updating content.`);
              return { ...m, content: processedContent, edited: true };
            }
            return m;
          });
          console.log('[handleEdit] setall_messages: updatedMessages count:', updatedMessages.length);
          // Verify the change
          const changedMsg = updatedMessages.find(m => m.timestamp === timestampToEdit);
          console.log('[handleEdit] setall_messages: Verifying updated message in new array:', changedMsg);
          return updatedMessages;
        });
      } else {
        console.error('[handleEdit] Server responded with an error or unexpected status:', data.message || `Status ${data.status}`);
        alert(data.message || 'Failed to edit message. Server error.');
      }
    } catch (error) {
      console.error('[handleEdit] Network or other error during fetch:', error);
      alert('Error editing message. Please check console.');
    }
  };

  const handleDelete = async (timestampToDelete) => {
    console.log(`[handleDelete] Initiated for timestamp: ${timestampToDelete} (type: ${typeof timestampToDelete})`);
    if (!window.confirm('Delete this message?')) {
        console.log('[handleDelete] Delete cancelled by user.');
        return;
    }

    try {
      console.log('[handleDelete] Sending API request to /delete_message');
      const res = await fetch(`${url}/delete_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, timestamp: timestampToDelete })
      });

      const data = await res.json();
      console.log('[handleDelete] API Response Status:', res.status);
      console.log('[handleDelete] API Response OK:', res.ok);
      console.log('[handleDelete] API Response Data:', data);

      if (res.ok && data.status === 200) {
        console.log('[handleDelete] Server confirmed delete. Updating client state.');
        setall_messages(prevMessages => {
          console.log('[handleDelete] setall_messages: prevMessages count:', prevMessages ? prevMessages.length : 'null');
          if (!prevMessages) return [];
          
          let foundAndFiltered = false;
          const newMessages = prevMessages.filter(m => {
            const isMatch = m.timestamp === timestampToDelete;
            if (isMatch) {
              console.log(`[handleDelete] Filtering: Message with timestamp ${m.timestamp} (type: ${typeof m.timestamp}) MATCHES ${timestampToDelete} (type: ${typeof timestampToDelete}). It WILL be removed.`);
              foundAndFiltered = true;
            }
            return !isMatch;
          });

          if (!foundAndFiltered && prevMessages.some(m => m.timestamp === timestampToDelete)) {
              console.error("[handleDelete] CRITICAL: Message was targeted for deletion but NOT found by filter's comparison. Check timestamps carefully.");
              const targetInPrev = prevMessages.find(m => m.timestamp === timestampToDelete);
               console.log("[handleDelete] Original target in prevMessages:", targetInPrev);

          } else if (!foundAndFiltered) {
              console.warn("[handleDelete] Message to delete was not found in prevMessages at all (perhaps already removed or never existed).");
          }

          console.log('[handleDelete] setall_messages: newMessages count:', newMessages.length);
          return newMessages;
        });
      } else {
        console.error('[handleDelete] Server responded with an error or unexpected status:', data.message || `Status ${data.status}`);
        alert(data.message || 'Failed to delete message. Server error.');
      }
    } catch (error) {
      console.error('[handleDelete] Network or other error during fetch:', error);
      alert('Error deleting message. Please check console.');
    }
  };

  return (
    <div className={valid_chat_css.mainchat} style={{ position: 'relative' }}>
      <div id={valid_chat_css.top} ref={messagesContainerRef}>
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
              const timestamp_init = parseInt(elem.timestamp, 10); // elem.timestamp should already be a number
              const date = new Date(timestamp_init);
              const displayTimestamp = date.toDateString() + ", " + date.getHours() + ":" + date.getMinutes();
              const isMine = elem.sender_id === id;
              return (
                <div id={valid_chat_css.message_box} key={`${elem.timestamp}-${index}`}> {/* Key using timestamp and index */}
                  <div className={valid_chat_css.message_box_comps} id={valid_chat_css.message_left}>
                    <div className={valid_chat_css.user_image_wrap}>
                      <img id={valid_chat_css.user_image} src={elem.sender_pic} alt="" />
                    </div>
                  </div>
                  <div className={valid_chat_css.message_box_comps} id={valid_chat_css.message_right}>
                    <div className={valid_chat_css.message_right_comps} id={valid_chat_css.message_right_top}>
                      <div id={valid_chat_css.message_username}>{elem.sender_name}</div>
                      <div id={valid_chat_css.message_timestamp}>{displayTimestamp}</div>
                      {isMine && shiftPressed && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                          {!elem.image && (
                            <EditIcon fontSize='small' style={{ cursor: 'pointer' }} onClick={() => handleEdit(elem.timestamp)} />
                          )}
                          <DeleteIcon fontSize='small' style={{ cursor: 'pointer' }} onClick={() => handleDelete(elem.timestamp)} />
                        </div>
                      )}
                    </div>
                    <div id={valid_chat_css.message_right_bottom}>
                      {elem.image ? (
                        <img 
                          src={elem.image} 
                          alt="Shared"
                          style={{ maxWidth: '400px', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer', objectFit: 'cover' }}
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
             {all_messages && all_messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#B9BBBE', marginTop: '2rem' }}>No messages yet. Be the first!</div>
            )}
            {all_messages === null && (
                 <div style={{ textAlign: 'center', color: '#B9BBBE', marginTop: '2rem' }}>Loading messages...</div>
            )}
        </div>
        {/* Removed redundant <div id={valid_chat_css.chat_part}></div> as #top now handles scrolling message area */}
      </div>

      {showEmojiPicker && (
        <div style={{
          position: 'absolute', bottom: '70px', right: '60px', background: 'linear-gradient(to bottom,rgb(78, 18, 107),rgb(136, 48, 208))',
          border: '1px solid #40444b', borderRadius: '8px', padding: '12px', width: '320px',
          maxHeight: '400px', overflowY: 'auto', zIndex: 1000
        }} ref={emojiPickerRef}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ color: '#fff', margin: 0, fontSize: '14px' }}>Emojis</h3>
            <CloseIcon style={{ color: '#b9bbbe', cursor: 'pointer', fontSize: '18px' }} onClick={() => setShowEmojiPicker(false)} />
          </div>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category} style={{ marginBottom: '16px' }}>
              <h4 style={{ color: '#b9bbbe', fontSize: '12px', margin: '0 0 8px 0' }}>{category}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                {emojis.map(emojiKey => (
                  <div
                    key={emojiKey} onClick={() => addEmoji(emojiKey)}
                    style={{ fontSize: '20px', cursor: 'pointer', padding: '4px', borderRadius: '4px', textAlign: 'center', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40444b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} />
          <AddCircleIcon 
            htmlColor='#B9BBBE'
            style={{ cursor: uploading ? 'not-allowed' : 'pointer', marginRight: '8px', fontSize: '24px', opacity: uploading ? 0.5 : 1 }}
            onClick={() => !uploading && fileInputRef.current?.click()}
          />
          <input
            type="text" onKeyDown={e => send_message(e)} value={chat_message}
            onChange={e => setchat_message(e.target.value)}
            placeholder={uploading ? 'Uploading image...' : (channel_name ? `Message #${channel_name}`: 'Select a channel')}
            disabled={uploading || !channel_id} // Disable if no channel selected
          />
          <EmojiEmotionsIcon 
            htmlColor='#B9BBBE'
            style={{ cursor: 'pointer', marginLeft: '8px', fontSize: '24px' }}
            onClick={() => !(!channel_id) && setShowEmojiPicker(!showEmojiPicker)} // Disable if no channel
          />
        </div>
      </div>
    </div>
  );
}

export default Valid_chat;