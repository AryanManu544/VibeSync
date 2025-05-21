import React, { useEffect, useState } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import jwtDecode                         from 'jwt-decode';
import CircularProgress                  from '@mui/material/CircularProgress';

import invitecss                         from './invite.module.css';
import logo                              from '../../images/vibesync_logo_2.png';
import invalidLinkImg                    from '../../images/invalid_invite.svg';

export default function Invite() {
  const { invite_link } = useParams();
  const navigate        = useNavigate();
  const apiBase         = process.env.REACT_APP_URL;

  let currentUser = {};
  try {
    currentUser = jwtDecode(localStorage.getItem('token') || '');
  } catch {
    currentUser = {};
  }
  const { id: myUserId } = currentUser;

  const [inviteDetails, setInviteDetails] = useState(null);
  const [loadingInfo, setLoadingInfo]     = useState(true);
  const [error, setError]                 = useState(null);
  const [accepting, setAccepting]         = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/invite_link_info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invite_link })
        });
        if (!res.ok) {
          if (res.status === 404) throw new Error('Invite not found');
          throw new Error('Failed to load invite');
        }
        const data = await res.json();
        setInviteDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingInfo(false);
      }
    })();
  }, [apiBase, invite_link]);

  const handleAccept = async () => {
    if (inviteDetails.inviter_id === myUserId) {
      return navigate('/channels/@me');
    }

    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/invite/accept_invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ invite_code: invite_link })
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.message || 'Failed to accept invite');
      }
      // success → go to the new server
      navigate(`/channels/${inviteDetails.server_id}`);
    } catch (err) {
      setError(err.message);
      setAccepting(false);
    }
  };

  // Loading spinner while fetching invite info
  if (loadingInfo) {
    return (
      <div className={invitecss.main}>
        <CircularProgress color="inherit" />
        <p className={invitecss.message}>Loading invite…</p>
      </div>
    );
  }

  // Show error if invite invalid
  if (error || !inviteDetails) {
    return (
      <div className={invitecss.main}>
        <img src={invalidLinkImg} alt="Invalid invite" className={invitecss.invalidImage} />
        <h2 className={invitecss.errorTitle}>Invite Invalid</h2>
        <p className={invitecss.errorText}>
          {error ||
            'This invite may be expired or you might not have permission to join.'}
        </p>
        <button
          className={invitecss.continueButton}
          onClick={() => navigate('/')}
        >
          Continue to VibeSync
        </button>
      </div>
    );
  }

  // Destructure invite details
  const { inviter_name, server_name, server_pic } = inviteDetails;

  return (
    <div className={invitecss.main}>
      <div className={invitecss.box}>
        <div className={invitecss.logoWrapper}>
          <img src={server_pic || logo} alt="Server" className={invitecss.logo} />
        </div>
        <h2 className={invitecss.title}>
          {inviter_name} invited you to join{' '}
          <strong>{server_name}</strong>
        </h2>

        <button
          className={invitecss.acceptButton}
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting
            ? <CircularProgress size={20} color="inherit" />
            : 'Accept Invite'}
        </button>
      </div>
    </div>
  );
}