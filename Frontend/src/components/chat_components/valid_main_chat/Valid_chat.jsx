import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import valid_chat_css from '../valid_main_chat/valid_chat_css.module.css';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TagIcon from '@mui/icons-material/Tag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import socket from '../../Socket/Socket';
import logo from '../../../images/discord_logo_3.png';
import { useParams } from 'react-router-dom';

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

  useEffect(() => {
    socket.emit('join_chat', channel_id);
  }, [channel_id]);

  function send_message(e) {
    if (e.code === 'Enter') {
      let message_to_send = chat_message;
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

    try {
      const res = await fetch(`${url}/edit_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, timestamp, new_message: newContent })
      });

      const data = await res.json();
      if (res.ok && data.status === 200) {
        setall_messages(prev =>
          prev.map(m =>
            m.timestamp === timestamp
              ? { ...m, content: newContent, edited: true }
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
    <div className={valid_chat_css.mainchat}>
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
                      {elem.content} {elem.edited && <em style={{ fontSize: '0.75rem' }}>(edited)</em>}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <div id={valid_chat_css.chat_part}></div>
      </div>

      <div id={valid_chat_css.bottom}>
        <div id={valid_chat_css.message_input}>
          <AddCircleIcon htmlColor='#B9BBBE' />
          <input
            type="text"
            onKeyDown={e => send_message(e)}
            value={chat_message}
            onChange={e => setchat_message(e.target.value)}
            placeholder={`Message #${channel_name}`}
          />
        </div>
      </div>
    </div>
  );
}

export default Valid_chat;