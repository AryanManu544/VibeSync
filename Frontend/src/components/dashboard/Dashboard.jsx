import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import jwt from 'jwt-decode';

import dashboardcss from '../dashboard/dashboard.module.css';
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
import { server_existence } from '../../Redux/current_page';
import {
  setIncomingReqs,
  setOutgoingReqs,
  setFriends,
  setBlocked
} from '../../Redux/user_relations_slice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { server_id } = useParams();
  const option_state = useSelector(s => s.selected_option.updated_options);
  const server_exists = useSelector(s => s.current_page.server_exists);
  const url = process.env.REACT_APP_URL;

  // Decode user token once
  const token = localStorage.getItem('token') || '{}';
  const { username, tag, profile_pic, id } = jwt(token);

  // Pull persisted Redux state
  const incoming_reqs = useSelector(s => s.user_relations.incoming_reqs);
  const outgoing_reqs = useSelector(s => s.user_relations.outgoing_reqs);
  const friends       = useSelector(s => s.user_relations.friends);

  // Local state
  const [servers, setServers]     = useState([]);
  const [grid_layout, setGridLayout] = useState('70px 250px auto auto 370px');
  const [new_req, setNewReq]      = useState(1);
  const [loading, setLoading]     = useState(true);

  const new_req_received = delta => setNewReq(n => n + delta);

  // 1) Fetch user relations & servers
  useEffect(() => {
    async function fetchRelations() {
      try {
        const res  = await fetch(`${url}/user_relations`, {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token')
          }
        });
        const data = await res.json();
        console.log('Dashboard - API response:', data);

        // **Correct names** from API:
        const {
          incoming_requests  = [],
          outgoing_requests  = [],
          friends: apiFriends = [],
          blocked: apiBlocked = [],
          servers: apiServers  = []
        } = data;

        // Dispatch into Redux under your slice's field names:
        dispatch(setIncomingReqs(incoming_requests));
        dispatch(setOutgoingReqs(outgoing_requests));
        dispatch(setFriends(apiFriends));
        dispatch(setBlocked(apiBlocked));

        setServers(apiServers);
      } catch (err) {
        console.error('Error loading relations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRelations();
  }, [url, new_req, option_state, dispatch]);

  // 2) Dispatch user credentials once
  useEffect(() => {
    dispatch(change_username(username));
    dispatch(change_tag(tag));
    dispatch(option_profile_pic(profile_pic));
    dispatch(option_user_id(id));
  }, [dispatch, username, tag, profile_pic, id]);

  // 3) Adjust layout & server existence
  useEffect(() => {
    if (server_id === '@me' || !server_id) {
      setGridLayout('70px 250px auto auto 370px');
    } else {
      const existsInList = servers.some(s => s.server_id === server_id);
      dispatch(server_existence(existsInList));
      setGridLayout(
        existsInList
          ? '70px 250px auto auto 300px'
          : '70px 250px auto'
      );
    }
  }, [server_id, servers, dispatch]);

  if (loading) {
    return <div className={dashboardcss.main}>Loading user data...</div>;
  }

  // Compute statuses to pass down
  const pending_status     = incoming_reqs.length + outgoing_reqs.length > 0;
  const all_friends_status = friends.length > 0;

  return (
    <div className={dashboardcss.main} style={{ gridTemplateColumns: grid_layout }}>
      <div className={dashboardcss.components} id={dashboardcss.component_1}>
        <Navbar
          user_cred={{ username, user_servers: servers }}
          new_req_recieved={new_req_received}
        />
      </div>
      <div className={dashboardcss.components} id={dashboardcss.component_2}>
        <Navbar_2 />
      </div>
      {server_exists === false && server_id !== '@me' ? (
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
              button_status={{ pending: pending_status, all_friends: all_friends_status }}
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
