// src/components/dashboard/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import jwt from 'jwt-decode';

import dashboardcss from './dashboard.module.css';
import Navbar from '../navbar/Navbar';
import Navbar_2 from '../navbar_2/Navbar_2';
import Top_nav from '../top_nav/Top_nav';
import Main from '../main/Main';
import Right_nav from '../right_nav/Right_nav';

import {
  change_username,
  change_tag,
  option_profile_pic,
  option_user_id
} from '../../Redux/user_creds_slice';

import {
  server_existence,
  fetchServerInfo
} from '../../Redux/current_page';

import {
  setIncomingReqs,
  setOutgoingReqs,
  setFriends,
  setBlocked,
  setServers
} from '../../Redux/user_relations_slice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { server_id } = useParams();
  const url = process.env.REACT_APP_URL;

  // decode JWT token once
  const token = localStorage.getItem('token') || '{}';
  let decoded = {};
  try {
    decoded = jwt(token);
  } catch (err) {
    console.error('Invalid token:', err);
  }
  console.log('Decoded JWT:', decoded);
  const { username, tag, profile_pic, id } = decoded;

  // Redux state
  const option_state = useSelector(s => s.selected_option.updated_options);
  const incoming_reqs = useSelector(s => s.user_relations.incoming_reqs);
  const outgoing_reqs = useSelector(s => s.user_relations.outgoing_reqs);
  const friends = useSelector(s => s.user_relations.friends);
  const servers = useSelector(s => s.user_relations.servers);
  const serverExists = useSelector(s => s.current_page.server_exists);

  // Local state
  const [gridLayout, setGridLayout] = useState('70px 250px auto auto 370px');
  const [loading, setLoading] = useState(true);

  // 1️⃣ Load user relations & server list
  useEffect(() => {
    async function loadRelations() {
      try {
        const res = await fetch(`${url}/user_relations`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        });
        const data = await res.json();

        dispatch(setIncomingReqs(data.incoming_requests || []));
        dispatch(setOutgoingReqs(data.outgoing_requests || []));
        dispatch(setFriends(data.friends || []));
        dispatch(setBlocked(data.blocked || []));
        dispatch(setServers(data.servers || []));
      } catch (err) {
        console.error('Error loading relations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRelations();
  }, [dispatch, url, option_state, token]);

  // 2️⃣ Set user credentials in Redux
  useEffect(() => {
    if (username) dispatch(change_username(username));
    if (tag) dispatch(change_tag(tag));
    if (profile_pic) dispatch(option_profile_pic(profile_pic));
    if (id) dispatch(option_user_id(id));
  }, [dispatch, username, tag, profile_pic, id]);

  // 3️⃣ Handle server existence + load server members
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
      dispatch(fetchServerInfo(server_id));
    }
  }, [dispatch, server_id, servers]);

  if (loading) {
    return (
      <div className={dashboardcss.main}>
        Loading user data…
      </div>
    );
  }

  const pending = incoming_reqs.length + outgoing_reqs.length > 0;
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