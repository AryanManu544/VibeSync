import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import DoneIcon from '@mui/icons-material/Done';
import CloseIcon from '@mui/icons-material/Close';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { isEqual } from 'lodash';

import main_dashboardcss from './main_dashboard.module.css';
import { clearActiveDM, setActiveDM } from '../../../Redux/active_dm_slice';
import { update_options } from '../../../Redux/options_slice';
import DMChat from '../../dmpage/dmpage';
import socket from '../../Socket/Socket';

import online_duckie from '../../../images/online.svg';
import friends_duckie from '../../../images/friends_2.svg';
import pending_duckie from '../../../images/pending.svg';
import blocked_duckie from '../../../images/blocked.svg';
import addfriend_duckie from '../../../images/friends_2.svg';

const IMAGES_MAP = {
  1: online_duckie,
  2: friends_duckie,
  3: pending_duckie,
  4: blocked_duckie,
  5: addfriend_duckie,
};

function Main_dashboard() {
  const dispatch = useDispatch();

  const option_check = useSelector(state => state.selected_option.value);
  const option_text = useSelector(state => state.selected_option.text);
  const activeDM = useSelector(state => state.active_dm);
  const { username, profile_pic, id } = useSelector(state => state.user_info);
  const user_relations = useSelector(state => state.user_relations);

  const isMounted = useRef(true);
  const [button_state, setbutton_state] = useState(true);
  const [option_data, setoption_data] = useState([]);
  const [input, setinput] = useState('');
  const [alert, setalert] = useState({ style: 'none', message: 'none' });
  const [image, setimage] = useState(IMAGES_MAP[1]);

  // Memoize relations data to prevent unnecessary changes
  const { incoming_reqs, outgoing_reqs, blocked } = useMemo(() => ({
    incoming_reqs: Array.isArray(user_relations?.incoming_reqs) ? user_relations.incoming_reqs : [],
    outgoing_reqs: Array.isArray(user_relations?.outgoing_reqs) ? user_relations.outgoing_reqs : [],
    blocked: Array.isArray(user_relations?.blocked) ? user_relations.blocked : []
  }), [user_relations]);

  const url = process.env.REACT_APP_URL;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Data loading effect - fixed infinite loop
  useEffect(() => {
    if (!isMounted.current) return;

    const loadData = async () => {
      try {
        let newData = [];
        
        switch (option_check) {
          case 1: // Online friends
          case 2: // All friends
            const res = await fetch(`${url}/get_friends`, {
              headers: {
                'x-auth-token': localStorage.getItem('token'),
              },
            });
            const data = await res.json();
            newData = option_check === 1 
              ? (data.friends || []).filter(friend => friend.isOnline)
              : (data.friends || []);
            break;
            
          case 3: // Pending requests
            newData = [
              ...incoming_reqs.map(req => ({ ...req, status: 'incoming' })),
              ...outgoing_reqs.map(req => ({ ...req, status: 'outgoing' }))
            ];
            break;
            
          case 4: // Blocked users
            newData = [...blocked];
            break;
            
          case 5: // Add friend
            newData = [];
            break;
        }

        // Only update if data actually changed
        setoption_data(prev => {
          if (isEqual(prev, newData)) {
            return prev;
          }
          return newData;
        });

      } catch (err) {
        console.error('Error loading data:', err);
      }
    };

    loadData();
  }, [option_check, url]); // Removed other dependencies

  useEffect(() => {
    dispatch(clearActiveDM());
  }, [option_check, dispatch]);

  useEffect(() => {
    setimage(IMAGES_MAP[option_check] || online_duckie);
  }, [option_check]);

  useEffect(() => {
    setbutton_state(input.length < 1);
  }, [input]);

  const button_clicked = useCallback(async (message, friend_data) => {
    try {
      const res = await fetch(`${url}/process_req`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ friend_data, message }),
      });

      const data = await res.json();

      if (data.status === 200 || data.status === 404) {
        dispatch(update_options());
        if (data.status === 200) {
          socket.emit('req_accepted', id, friend_data.id, username, profile_pic);
        }
      }
    } catch (error) {
      console.error('Error processing request:', error);
    }
  }, [url, dispatch, id, username, profile_pic]);

  const buttons = useMemo(() => 
    (message, Icon, friend_data) => (
      <div className={main_dashboardcss.item_3_comps_wrap} onClick={() => button_clicked(message, friend_data)}>
        <div className={main_dashboardcss.item_3_comps}>
          <OverlayTrigger placement="top" overlay={<Tooltip>{message}</Tooltip>}>
            <Icon />
          </OverlayTrigger>
        </div>
      </div>
    ),
  [button_clicked]);

  const add_friend = useCallback(async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${url}/add_friend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ friend: input }),
      });

      const data = await res.json();

      if ([404, 201, 202, 203].includes(data.status)) {
        setalert({ style: 'flex', message: data.message });
      }

      if ([201, 203].includes(data.status)) {
        dispatch(update_options());
        if (data.status === 203) {
          socket.emit('send_req', data.receiver_id, id, profile_pic, username);
        }
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      setalert({ style: 'flex', message: 'An error occurred while adding friend' });
    }
  }, [url, input, dispatch, id, profile_pic, username]);

  const handle_input = useCallback((e) => {
    setinput(e.target.value);
    setalert(prev => ({ ...prev, style: 'none' }));
  }, []);

  const handleOpenDM = useCallback(async (friend) => {
    try {
      const res = await fetch(`${url}/create_dm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ participantIds: [friend.id] }),
      });

      const data = await res.json();
      if (data.status === 200 || data.status === 201) {
        dispatch(setActiveDM(friend));
      }
    } catch (err) {
      console.error('Error creating/opening DM:', err);
    }
  }, [url, dispatch]);

  const renderAddFriend = useMemo(() => (
    <div className={main_dashboardcss.add_friend_wrap}>
      <div className={main_dashboardcss.add_friend}>
        <div id={main_dashboardcss.add_friend_1} className={main_dashboardcss.add_friend_comps}>ADD FRIEND</div>
        <div id={main_dashboardcss.add_friend_2} className={main_dashboardcss.add_friend_comps}>
          You can add a friend with their Discord Tag. It's cAsE-sEnSitIvE!
        </div>
        <div id={main_dashboardcss.add_friend_3} className={main_dashboardcss.add_friend_comps}>
          <input onChange={handle_input} value={input} type="text" placeholder='Enter a Username#0000' />
          <button onClick={add_friend} disabled={button_state} id={main_dashboardcss.add_friend_3_button}>
            Send Friend Request
          </button>
        </div>
        <div id={main_dashboardcss.friend_req_response} style={{ display: alert.style }}>
          {alert.message}
        </div>
      </div>
      <div className={main_dashboardcss.add_friend_image}>
        <div className={main_dashboardcss.offline_image}>
          <img className={main_dashboardcss.duckie} src={image} alt="" />
          {option_text}
        </div>
      </div>
    </div>
  ), [handle_input, input, add_friend, button_state, alert.style, alert.message, image, option_text]);

  const renderDefaultView = useMemo(() => (
    <div className={main_dashboardcss.main} style={{ display: 'flex' }}>
      <div className={main_dashboardcss.offline_image}>
        <img className={main_dashboardcss.duckie} src={image} alt="" />
        {option_text}
      </div>
    </div>
  ), [image, option_text]);

  const renderFriendItem = useCallback((elem) => (
    <div key={`${elem.id}-${elem.username}`} className={main_dashboardcss.friends_section_wrap}>
      <div id={main_dashboardcss.online_users_wrap}>
        <div className={main_dashboardcss.online_users}>
          <div className={main_dashboardcss.online_comps} id={main_dashboardcss.item_1_wrap}>
            <div id={main_dashboardcss.item_1}>
              <img src={elem.profile_pic} alt="" />
            </div>
          </div>
          <div className={main_dashboardcss.item_2_main}>
            <div className={main_dashboardcss.online_comps} id={main_dashboardcss.item_2}>
              <div className={main_dashboardcss.item_2_comps}>{elem.username}</div>
              <div className={main_dashboardcss.item_2_comps} id={main_dashboardcss.item_2_2}>
                {(() => {
                  switch(option_check) {
                    case 1: return 'Online';
                    case 2: return 'Friend';
                    case 3: return elem.status === 'incoming' ? 'Incoming Request' : 'Outgoing Request';
                    case 4: return 'Blocked';
                    default: return '';
                  }
                })()}
              </div>
            </div>
            <div className={main_dashboardcss.online_comps} id={main_dashboardcss.item_2_3}>
              <div className={main_dashboardcss.item_2_comps} id={main_dashboardcss.item_2_3_1}>
                <ChatBubbleIcon onClick={() => handleOpenDM(elem)} />
              </div>
            </div>
          </div>
          <div className={main_dashboardcss.online_comps} id={main_dashboardcss.item_3_wrap}>
            {option_check === 3 && elem.status === 'incoming' && (
              <>
                {buttons('Accept Request', DoneIcon, elem)}
                {buttons('Decline Request', CloseIcon, elem)}
              </>
            )}
            {option_check === 3 && elem.status === 'outgoing' && (
              <>{buttons('Cancel Request', PersonRemoveIcon, elem)}</>
            )}
            {option_check === 4 && buttons('Unblock', PersonRemoveIcon, elem)}
          </div>
        </div>
      </div>
    </div>
  ), [handleOpenDM, buttons, option_check]);

  if (option_check === 5) return renderAddFriend;
  if (activeDM) {
    return <DMChat user_info={{ username, profile_pic, id }} activeDM={activeDM} />;
  }

  return (
    <div>
      {option_data.length === 0 ? renderDefaultView : option_data.map(renderFriendItem)}
    </div>
  );
}

export default React.memo(Main_dashboard);