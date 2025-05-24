/* Navbar_2_dashboard.jsx */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import navbar_chat_css from './navbar2_dashboardcss.module.css';
import person_icon from '../../../images/friends.svg';
import offline_icon from '../../../images/offline_status.svg';
import profile_pic_default from '../../../images/vibesync_logo_2.png';
import CreateDMModal from '../../dmpage/CreateDMModal';
import { setActiveDM } from '../../../Redux/active_dm_slice';
import { ListGroup, Image } from 'react-bootstrap';

export default function Navbar_2_dashboard() {
  const dispatch = useDispatch();
  const profile_pic = useSelector(state => state.user_info.profile_pic);
  const [dmList, setDmList] = useState([]);
  const [showCreateDM, setShowCreateDM] = useState(false);
  const [selectedDM, setSelectedDM] = useState(null);

  const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';

  const testDM = { id: '1', name: 'Test User', profile_pic: profile_pic_default, tag: 'test' };

  useEffect(() => {
    const fetchDMs = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${base}/get_dms`, {
          headers: { 'x-auth-token': token }
        });
        const data = await res.json();

        const dmPromises = (data.dms || []).map(async dm => {
          try {
            const userRes = await fetch(`${base}/get_user_by_id`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'x-auth-token': token 
              },
              body: JSON.stringify({ id: dm.id })
            });
            const userData = await userRes.json();

            return {
              id: dm.id,
              name: userData.user?.username || userData.user?.name || dm.tag,
              profile_pic: userData.user?.profile_pic || dm.profile_pic || profile_pic_default,
              tag: userData.user?.tag || dm.tag || '0000'
            };
          } catch (err) {
            console.error(`Failed to fetch user ${dm.id}:`, err);
            return {
              id: dm.id,
              name: dm.tag,
              profile_pic: dm.profile_pic || profile_pic_default,
              tag: dm.tag || '0000'
            };
          }
        });

        const processedDMs = await Promise.all(dmPromises);

        setDmList([
          testDM,
          ...processedDMs
        ]);
      } catch (err) {
        console.error('Failed to fetch DMs:', err);
        setDmList([testDM]);
      }
    };
    fetchDMs();
  }, []);

  const renderTooltip = props => (
    <Tooltip id="button-tooltip" {...props}>
      Create DM
    </Tooltip>
  );

  const onPlusClick = () => setShowCreateDM(true);

  const handleCreateDM = async selectedIds => {
    if (!selectedIds.length) return;
    const peerId = selectedIds[0];
    const token = localStorage.getItem('token');

    const createRes = await fetch(`${base}/create_dm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ participantIds: [peerId] })
    });
    if (!createRes.ok) return console.error('create_dm failed');

    const userRes = await fetch(`${base}/get_user_by_id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ id: peerId })
    });
    if (!userRes.ok) return console.error('get_user_by_id failed');

    const { user } = await userRes.json();
    if (!user) return console.error('bad user data');

    const formattedUser = {
      id: user.id,
      name: user.name || user.username || 'Unknown',
      profile_pic: user.profile_pic || profile_pic_default,
      tag: user.tag || '0000'
    };

    dispatch(setActiveDM(formattedUser));
    setDmList(prev => {
      const combined = [testDM, ...prev, formattedUser];
      return combined.filter((u, idx) => combined.findIndex(x => x.id === u.id) === idx);
    });
    setShowCreateDM(false);
  };

  const handleUserClick = user => {
    dispatch(setActiveDM({
      id: user.id,
      name: user.name,
      profile_pic: user.profile_pic || profile_pic_default,
      tag: user.tag
    }));
  };

  return (
    <>
      <div className={navbar_chat_css.sidebar_container}>
        <div className={navbar_chat_css.search_wrap}>
          <div className={navbar_chat_css.search}>Find or start a conversation</div>
        </div>

        <div className={navbar_chat_css.friends_wrap}>
          <div className={navbar_chat_css.friends}>
            <img className={navbar_chat_css.friends_icon} src={person_icon} alt="Friends" />
            Friends
          </div>
        </div>

        <div className={navbar_chat_css.heading}>
          <div className={navbar_chat_css.heading_components}>{'DIRECT MESSAGES'}</div>
          <div className={navbar_chat_css.heading_components}>
            <OverlayTrigger placement="top" overlay={renderTooltip}>
              <AddIcon fontSize="small" onClick={onPlusClick} style={{ cursor: 'pointer' }} />
            </OverlayTrigger>
          </div>
        </div>

        <ListGroup variant="flush" className={navbar_chat_css.dm_list}>
          {dmList.map(user => (
            <ListGroup.Item
              key={user.id}
              action
              className={`${navbar_chat_css.dm_item} d-flex align-items-center w-100`}
              onClick={() => handleUserClick(user)}
            >
              <Image
                src={user.profile_pic}
                roundedCircle
                width={32}
                height={32}
                className={`me-2 ${navbar_chat_css.dm_image}`}
                onError={(e) => {
                  e.target.src = profile_pic_default;
                }}
              />
              <div className={`${navbar_chat_css.dm_text_container}`}>
                <span className={`${navbar_chat_css.dm_name}`}>
                  {user.name || `User ${user.tag}`}
                </span>
                <span className={`${navbar_chat_css.dm_tag}`}>
                  #{user.tag}
                </span>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      <CreateDMModal
        show={showCreateDM}
        handleClose={() => setShowCreateDM(false)}
        onCreateDM={handleCreateDM}
      />
    </>
  );
}