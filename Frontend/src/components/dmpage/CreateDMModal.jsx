import React, { useState, useEffect } from 'react';
import profile_pic_default from '../../images/vibesync_logo_2.png';
import styles from './CreateDMModal.module.css'; // Assuming you have a CSS module

export default function CreateDMModal({ show, handleClose, onCreateDM }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!show) return;
    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const base = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000';
        const res = await fetch(`${base}/get_friends`, {
          headers: { 'x-auth-token': token }
        });
        if (!res.ok) throw new Error('Failed to fetch friends');
        const data = await res.json();
        setFriends(data.friends || []);
      } catch (err) {
        console.error(err);
        setError('Could not load friends');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [show]);

  const toggleSelection = (id) => {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedIds.length) return;
    try {
      await onCreateDM(selectedIds);
      setSelectedIds([]);
      handleClose();
    } catch (err) {
      console.error('Create DM failed', err);
    }
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div
        className={styles.modal}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-dm-title"
      >
        <h2 id="create-dm-title">New Direct Message</h2>

        {loading ? (
          <div style={{ textAlign: 'center' }}>Loading...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
        ) : (
          <div className={styles.friendList}>
            {friends.length === 0 && (
              <div style={{ color: '#999', textAlign: 'center' }}>
                You have no friends to message.
              </div>
            )}
            {friends.map((f, idx) => {
              const friendId = f?.id || f?._id || idx;
              return (
                <div
                  key={friendId}
                  className={`${styles.friendItem} ${selectedIds.includes(friendId) ? styles.selected : ''}`}
                  onClick={() => toggleSelection(friendId)}
                >
                  <img
                    src={f?.profile_pic || profile_pic_default}
                    alt={`${f?.name || f?.username || 'User'} avatar`}
                    className={styles.friendAvatar}
                  />
                  <div className={styles.friendName}>
                    <div style={{ fontWeight: 'bold' }}>
                      {f?.name || f?.username || 'Unknown'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#bbb' }}>
                      #{f?.tag || '0000'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(friendId)}
                    readOnly
                    style={{ marginLeft: 10 }}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.modalActions}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.createButton}
            disabled={selectedIds.length === 0}
            onClick={handleSubmit}
          >
            Create DM
          </button>
        </div>
      </div>
    </div>
  );
}