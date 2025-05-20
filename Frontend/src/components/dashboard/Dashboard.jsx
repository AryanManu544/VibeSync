// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useParams }                  from 'react-router-dom';
import { useDispatch, useSelector }   from 'react-redux';
import jwt                            from 'jwt-decode';

import dashboardcss                   from './dashboard.module.css';
import Navbar                         from '../navbar/Navbar';
import Navbar_2                       from '../navbar_2/Navbar_2';
import Top_nav                        from '../top_nav/Top_nav';
import Main                           from '../main/Main';
import Right_nav                      from '../right_nav/Right_nav';

import {
  change_username,
  change_tag,
  option_profile_pic,
  option_user_id
} from '../../Redux/user_creds_slice';

import { 
  server_existence,
  server_members 
} from '../../Redux/current_page';

import {
  setIncomingReqs,
  setOutgoingReqs,
  setFriends,
  setBlocked
} from '../../Redux/user_relations_slice';

export default function Dashboard() {
  const dispatch     = useDispatch();
  const { server_id }= useParams();
  const url          = process.env.REACT_APP_URL;

  // decode once
  const token        = localStorage.getItem('token') || '{}';
  const { username, tag, profile_pic, id } = jwt(token);

  // Redux state
  const option_state = useSelector(s => s.selected_option.updated_options);
  const incoming_reqs= useSelector(s => s.user_relations.incoming_reqs);
  const outgoing_reqs= useSelector(s => s.user_relations.outgoing_reqs);
  const friends      = useSelector(s => s.user_relations.friends);
  const servers      = useSelector(s => s.user_relations.servers);
  const serverExists = useSelector(s => s.current_page.server_exists);

  // Local state
  const [gridLayout, setGridLayout] = useState('70px 250px auto auto 370px');
  const [loading, setLoading]       = useState(true);

  // 1️⃣ Load user relations & server list
  useEffect(() => {
    async function loadRelations() {
      try {
        const res  = await fetch(`${url}/user_relations`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        const data = await res.json();

        dispatch(setIncomingReqs(data.incoming_requests  || []));
        dispatch(setOutgoingReqs(data.outgoing_requests  || []));
        dispatch(setFriends     (data.friends            || []));
        dispatch(setBlocked     (data.blocked            || []));
        // assume API also returns `servers`
        dispatch({ type: 'user_relations/setServers', payload: data.servers || [] });
      } catch (err) {
        console.error('Error loading relations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRelations();
  }, [dispatch, url, option_state, token]);

  // 2️⃣ Persist user creds into Redux
  useEffect(() => {
    dispatch(change_username   (username));
    dispatch(change_tag        (tag));
    dispatch(option_profile_pic(profile_pic));
    dispatch(option_user_id    (id));
  }, [dispatch, username, tag, profile_pic, id]);

  // 3️⃣ When server_id or servers change: set existence + fetch members
  useEffect(() => {
    if (!server_id || server_id === '@me') {
      dispatch(server_existence(null));
      setGridLayout('70px 250px auto auto 370px');
      return;
    }

    const exists = servers.some(s => s.server_id === server_id);
    dispatch(server_existence(exists));

    setGridLayout(
      exists
        ? '70px 250px auto auto 300px'
        : '70px 250px auto'
    );

    if (exists) {
      // fetch full server info (including members)
      (async () => {
        try {
          const res  = await fetch(`${url}/server_info`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-auth-token': token
            },
            body: JSON.stringify({ server_id })
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data.users)) {
            dispatch(server_members(data.users));
          } else {
            console.error('Failed to fetch server members:', data.message);
          }
        } catch (err) {
          console.error('Error fetching server_info:', err);
        }
      })();
    }
  }, [dispatch, server_id, servers, url, token]);

  if (loading) {
    return (
      <div className={dashboardcss.main}>
        Loading user data…
      </div>
    );
  }

  const pending  = incoming_reqs.length + outgoing_reqs.length > 0;
  const hasFriends = friends.length > 0;

  return (
    <div
      className={dashboardcss.main}
      style={{ gridTemplateColumns: gridLayout }}
    >
      <div className={dashboardcss.components} id={dashboardcss.component_1}>
        <Navbar
          user_cred={{ username, user_servers: servers }}
          new_req_recieved={() => {}}
        />
      </div>

      <div className={dashboardcss.components} id={dashboardcss.component_2}>
        <Navbar_2 />
      </div>

      {serverExists === false && server_id !== '@me' ? (
        <div
          className={dashboardcss.components}
          id={dashboardcss.component_4}
          style={{ gridArea: '1 / 3 / 6 / 6' }}
        >
          <Main user_relations={{ incoming_reqs, outgoing_reqs, friends }} />
        </div>
      ) : (
        <>
          <div className={dashboardcss.components} id={dashboardcss.component_3}>
            <Top_nav
              button_status={{ pending, all_friends: hasFriends }}
            />
          </div>

          <div className={dashboardcss.components} id={dashboardcss.component_4}>
            <Main user_relations={{ incoming_reqs, outgoing_reqs, friends }} />
          </div>

          <div className={dashboardcss.components} id={dashboardcss.component_5}>
            <Right_nav />
          </div>
        </>
      )}
    </div>
  );
}
