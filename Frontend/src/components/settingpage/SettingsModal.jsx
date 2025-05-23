import React, { useState, useEffect } from 'react';
import jwtDecode from 'jwt-decode';
import './SettingsModal.css';

export default function SettingsModal({ show, onClose, showAlert }) {
  const token = localStorage.getItem('token') || '';
  let decoded = {};
  try { decoded = jwtDecode(token); } catch {}
  const { username: initialName, tag, profile_pic: initialPic, email: initialEmail, id } = decoded;

  // Tab state
  const [tab, setTab] = useState('picture');

  // Picture
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(initialPic);

  // Name
  const [name, setName] = useState(initialName);

  // Email
  const [email, setEmail] = useState(initialEmail || '');

  // Password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show) {
      setTab('picture');
      setPicPreview(initialPic);
      setPicFile(null);
      setName(initialName);
      setEmail(initialEmail || '');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
      setLoading(false);
    }
  }, [show, initialName, initialPic, initialEmail]);

  const readFile = file => {
    const reader = new FileReader();
    reader.onload = () => setPicPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePicChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    setPicFile(file);
    readFile(file);
  };

  const callApi = async (path, body, isForm = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_URL}${path}`, {
        method: 'PUT',
        headers: {
          'x-auth-token': token,
          ...(isForm ? {} : { 'Content-Type': 'application/json' })
        },
        body: isForm ? body : JSON.stringify(body)
      });
      const json = await res.json();
      if (res.ok) {
        showAlert('Updated successfully', 'success');
        onClose();
      } else {
        showAlert(json.message || 'Update failed', 'danger');
      }
    } catch {
      showAlert('Server error', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const submitPicture = () => {
    if (!picFile) return showAlert('Choose a picture', 'danger');
    const form = new FormData();
    form.append('profile_pic', picFile);
    callApi('/user/update_picture', form, true);
  };

  const submitName = () => {
    if (!name.trim()) return showAlert('Name cannot be empty', 'danger');
    callApi('/user/update_name', { name });
  };

  const submitEmail = () => {
    if (!email.trim()) return showAlert('Email cannot be empty', 'danger');
    callApi('/user/update_email', { email });
  };

  const submitPassword = () => {
    if (!currentPwd || !newPwd) return showAlert('Fill both fields', 'danger');
    if (newPwd !== confirmPwd) return showAlert('Passwords do not match', 'danger');
    callApi('/user/update_password', { currentPwd, newPwd });
  };

  if (!show) return null;
  return (
    <div className="sm-backdrop" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>
        <header className="sm-header">
          <h2>Settings</h2>
          <button className="sm-close" onClick={onClose}>×</button>
        </header>
        <nav className="sm-tabs">
          {['picture','name','email','password'].map(t => (
            <button
              key={t}
              className={tab===t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <section className="sm-content">
          {tab==='picture' && (
            <>
              <div className="sm-pic-preview">
                <img src={picPreview} alt="" />
              </div>
              <input type="file" accept="image/*" onChange={handlePicChange} />
              <button onClick={submitPicture} disabled={loading}>
                {loading ? 'Saving…' : 'Save Picture'}
              </button>
            </>
          )}
          {tab==='name' && (
            <>
              <label>New Name</label>
              <input
                type="text"
                value={name}
                onChange={e=>setName(e.target.value)}
              />
              <button onClick={submitName} disabled={loading}>
                {loading ? 'Saving…' : 'Save Name'}
              </button>
            </>
          )}
          {tab==='email' && (
            <>
              <label>New Email</label>
              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
              />
              <button onClick={submitEmail} disabled={loading}>
                {loading ? 'Saving…' : 'Save Email'}
              </button>
            </>
          )}
          {tab==='password' && (
            <>
              <label>Current Password</label>
              <input
                type="password"
                value={currentPwd}
                onChange={e=>setCurrentPwd(e.target.value)}
              />
              <label>New Password</label>
              <input
                type="password"
                value={newPwd}
                onChange={e=>setNewPwd(e.target.value)}
              />
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPwd}
                onChange={e=>setConfirmPwd(e.target.value)}
              />
              <button onClick={submitPassword} disabled={loading}>
                {loading ? 'Saving…' : 'Save Password'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
