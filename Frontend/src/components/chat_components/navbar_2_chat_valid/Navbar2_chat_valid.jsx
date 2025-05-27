import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Modal from 'react-bootstrap/Modal';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/material/Skeleton';

import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import LogoutIcon from '@mui/icons-material/Logout';

import ServerDetails from '../server_details/Server_details';
import ManageRolesPopup from '../../ManageRolesPopup';

import {
  change_page_id,
  change_page_name,
  server_members
} from '../../../Redux/current_page';
import { update_options } from '../../../Redux/options_slice';

import styles from './valid_navbar.module.css';

export default function Navbar2ChatValid() {
  const { server_id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const username = useSelector((s) => s.user_info.username);
  const userId = useSelector((s) => s.user_info.id);
  const serverRole = useSelector((s) => s.current_page.role);

  const API = process.env.REACT_APP_URL;
  const FRONTEND = process.env.REACT_APP_CLIENT_URL;

  const [showOptions, setShowOptions] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [showManageRoles, setShowManageRoles] = useState(false);

  const [serverDetails, setServerDetails] = useState(null);

  useEffect(() => {
    if (!server_id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/server_info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token'),
          },
          body: JSON.stringify({ server_id }),
        });
        const data = await res.json();
        if (cancelled) return;
        const info = Array.isArray(data) ? data[0] : data;
        setServerDetails(info || {});
        const firstChan = info?.categories?.[0]?.channels?.[0];
        if (firstChan) {
          dispatch(change_page_name(firstChan.channel_name));
          dispatch(change_page_id(firstChan._id));
        }
        dispatch(server_members(info?.users || []));
      } catch (err) {
        console.error('Error loading server info', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [server_id, API, dispatch]);

  const createInviteLink = useCallback(async () => {
  if (!serverDetails?.server_name) return;
  
  try {
    console.log('Creating invite link for server:', server_id);
    
    const response = await fetch(`${API}/create_invite_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token'),
      },
      body: JSON.stringify({
        inviter_name: username,
        inviter_id: userId,
        server_name: serverDetails.server_name,
        server_id: server_id,
        server_pic: serverDetails.server_pic || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Invite response:', data);

    if (data.status === 200) {
      setInviteLink(`${FRONTEND}/invite/${data.invite_code}`);
      setShowInviteModal(true);
    } else {
      console.error('Failed to create invite:', data.message);
      alert(data.message || 'Failed to create invite link');
    }
  } catch (err) {
    console.error('Error creating invite link:', err);
    alert('Failed to create invite link. Please try again.');
  }
}, [API, FRONTEND, serverDetails, server_id, userId, username]);

  const leaveOrDelete = useCallback(
    async (endpoint) => {
      try {
        const res = await fetch(`${API}/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': localStorage.getItem('token'),
          },
          body: JSON.stringify({ server_id }),
        });
        const data = await res.json();
        if (data.status === 200) {
          dispatch(update_options());
          navigate('/channels/@me');
        }
      } catch (err) {
        console.error(`Error in ${endpoint}`, err);
      }
    },
    [API, dispatch, navigate, server_id]
  );

  const createCategory = useCallback(async () => {
    if (!newCategoryName) return;
    setIsCreatingCategory(true);
    try {
      const res = await fetch(`${API}/add_new_category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token'),
        },
        body: JSON.stringify({ category_name: newCategoryName, server_id }),
      });
      const data = await res.json();
      if (data.status === 200) {
        setNewCategoryName('');
        setShowCreateModal(false);
      }
    } catch (err) {
      console.error('Error creating category', err);
    } finally {
      setIsCreatingCategory(false);
    }
  }, [API, newCategoryName, server_id]);

  if (!serverDetails) {
    return <Skeleton variant="rectangular" height={200} />;
  }

  const { server_name, categories = [], roles = [] } = serverDetails;

  return (
    <>
      {/* OPTIONS DROPDOWN */}
      <div
        className={styles.options_wrap}
        style={{ display: showOptions ? 'block' : 'none' }}
      >
       <div
  className={styles.options}
  onClick={() => {
    setShowManageRoles(true);
    setShowOptions(false);
  }}
>
  <div className={styles.options_comps}>Manage Roles</div>
  <div className={styles.options_comps}>
    <CreateNewFolderIcon fontSize="small" />
  </div>
</div>

        <div className={styles.options} onClick={createInviteLink}>
          <div className={styles.options_comps}>Invite People</div>
          <div className={styles.options_comps}>
            <PersonAddIcon fontSize="small" />
          </div>
        </div>

        <div className={styles.options} onClick={() => setShowCreateModal(true)}>
          <div className={styles.options_comps}>Create Category</div>
          <div className={styles.options_comps}>
            <CreateNewFolderIcon fontSize="small" />
          </div>
        </div>

        {serverRole === 'author' ? (
          <div
            className={styles.options}
            style={{ color: '#e7625f' }}
            onClick={() => leaveOrDelete('delete_server')}
          >
            <div className={styles.options_comps}>Delete Server</div>
            <div className={styles.options_comps}>
              <DeleteForeverIcon fontSize="small" />
            </div>
          </div>
        ) : (
          <div
            className={styles.options}
            style={{ color: '#e7625f' }}
            onClick={() => leaveOrDelete('leave_server')}
          >
            <div className={styles.options_comps}>Leave Server</div>
            <div className={styles.options_comps}>
              <LogoutIcon fontSize="small" />
            </div>
          </div>
        )}
      </div>

      {/* SERVER NAME BAR */}
      <div
        className={`${styles.server_name} ${styles.nav_2_parts}`}
        onClick={() => setShowOptions((v) => !v)}
      >
        {server_name}
        {showOptions ? <CloseIcon fontSize="small" /> : <KeyboardArrowDownIcon />}
      </div>

      {/* CATEGORIES */}
      <div className={`${styles.category_info} ${styles.nav_2_parts}`}>
        {categories.map((cat) => (
          <ServerDetails key={cat._id} elem={cat} />
        ))}
      </div>

      {/* CREATE CATEGORY MODAL */}
      <Modal show={showCreateModal} centered onHide={() => setShowCreateModal(false)}>
        <div className={styles.modal_main}>
          <div className={styles.modal_header}>Create Category</div>
          <div className={styles.modal_body}>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
            />
          </div>
          <div className={styles.modal_footer}>
            <button onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button onClick={createCategory} disabled={isCreatingCategory}>
              {isCreatingCategory ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* INVITE MODAL */}
      <Modal show={showInviteModal} centered onHide={() => setShowInviteModal(false)}>
        <div className={styles.modal_main}>
          <div className={styles.modal_header}>Invite Link</div>
          <div className={styles.modal_body}>
            <Typography>
              <a href={inviteLink} target="_blank" rel="noopener noreferrer">
                {inviteLink}
              </a>
            </Typography>
          </div>
          <div className={styles.modal_footer}>
            <button onClick={() => setShowInviteModal(false)}>Close</button>
          </div>
        </div>
      </Modal>

      {/* MANAGE ROLES POPUP */}
      {showManageRoles && (
        <ManageRolesPopup
          serverId={server_id}
          roles={roles}
          onClose={() => setShowManageRoles(false)}
          onCreateRole={async (newRole) => {
            // TODO: implement API call to create role here
            console.log('Creating role:', newRole);
            setShowManageRoles(false);
          }}
        />
      )}
    </>
  );
}
