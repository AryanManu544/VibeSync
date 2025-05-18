/* CreateDMModal.jsx */
import React, { useState, useEffect } from 'react';
import { Modal, Button, ListGroup, Spinner, Image } from 'react-bootstrap';
import profile_pic_default from '../../images/vibesync_logo_2.png';

export default function CreateDMModal({ show, handleClose, onCreateDM }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch friends from backend when modal opens
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
        console.error('get_friends error', err);
        setError('Could not load friends');
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [show]);

  const toggleSelection = id => {
    setSelectedIds(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  };

  const handleSubmit = async () => {
    if (!selectedIds.length) return;
    try {
      await onCreateDM(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Create DM failed', err);
    }
  };

  return (
  <div className='modal-container'>
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>New Direct Message</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="d-flex justify-content-center">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <div className="text-danger text-center">{error}</div>
        ) : (
          <ListGroup>
            {friends.map(f => (
              <ListGroup.Item
                key={f.id}
                action
                active={selectedIds.includes(f.id)}
                onClick={() => toggleSelection(f.id)}
                className="d-flex align-items-center"
              >
                <Image
                  src={f.profile_pic || '/default_avatar.png'}
                  roundedCircle
                  width={32}
                  height={32}
                  className="me-2"
                />
                <div>
                  <div className="fw-bold">{f.name || f.username}</div>
                  <div className="text-muted small">#{f.tag}</div>
                </div>
              </ListGroup.Item>
            ))}
            {friends.length === 0 && (
              <div className="text-muted text-center py-2">
                You have no friends to message.
              </div>
            )}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!selectedIds.length}
          onClick={handleSubmit}
        >
          Create DM
        </Button>
      </Modal.Footer>
    </Modal>
  </div>
  );
}