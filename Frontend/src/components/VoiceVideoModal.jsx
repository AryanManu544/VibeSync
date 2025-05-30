import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

// Icons
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

const VoiceVideoModal = ({ 
  isOpen, 
  onClose, 
  channelId, 
  channelName, 
  initialVideoEnabled = false 
}) => {
  const username = useSelector((s) => s.user_info.username);
  const userId = useSelector((s) => s.user_info.id);
  const userAvatar = useSelector((s) => s.user_info.profile_pic);

  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideoEnabled);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [connectionAttemptMessage, setConnectionAttemptMessage] = useState('🔴 Connecting...');

  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});
  const userVideosRef = useRef({});

  const rtcConfiguration = useRef({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }).current;

  const createPeerConnection = useCallback(async (targetSocketId, remoteUserId, isInitiator) => {
    if (!socketRef.current) {
        console.error("createPeerConnection: Socket is not available.");
        return;
    }
    console.log(`Creating peer connection to ${targetSocketId} (for remote user ${remoteUserId}). Initiator: ${isInitiator}`);
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peersRef.current[targetSocketId] = peerConnection;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        try {
          peerConnection.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.error(`Error adding track kind ${track.kind} to peer ${targetSocketId}:`, e);
        }
      });
    } else {
        console.warn(`createPeerConnection: localStreamRef is null when creating connection to ${targetSocketId}. No local tracks added.`);
    }

    peerConnection.ontrack = (event) => {
      console.log(`ontrack event from ${targetSocketId}`, event.streams);
      const remoteStream = event.streams[0];
      if (userVideosRef.current[targetSocketId]) {
        userVideosRef.current[targetSocketId].srcObject = remoteStream;
      } else {
          console.warn(`Video element for socket ${targetSocketId} not found in userVideosRef.`);
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`Sending ICE candidate to ${targetSocketId}`);
        socketRef.current.emit('webrtc_ice_candidate', {
          targetSocketId: targetSocketId, candidate: event.candidate, userId
        });
      }
    };
    peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE Connection State for ${targetSocketId}: ${peerConnection.iceConnectionState}`);
        if (['failed', 'disconnected', 'closed'].includes(peerConnection.iceConnectionState)) {
            console.error(`ICE connection with ${targetSocketId} is ${peerConnection.iceConnectionState}.`);
            // Optional: Clean up this specific peer
            // if (peersRef.current[targetSocketId]) {
            //     peersRef.current[targetSocketId].close();
            //     delete peersRef.current[targetSocketId];
            //     setConnectedUsers(prev => prev.filter(u => u.socketId !== targetSocketId));
            // }
        }
    };

    if (isInitiator) {
      try {
        console.log(`Creating WebRTC offer for ${targetSocketId}`);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        if (socketRef.current) {
            socketRef.current.emit('webrtc_offer', {
              targetSocketId: targetSocketId, offer, userId
            });
        }
      } catch (error) {
        console.error('Error creating WebRTC offer:', error);
      }
    }
  }, [userId, rtcConfiguration]);

  const handleUserJoined = useCallback((data) => {
    const { userId: newUserId, userName, userAvatar, socketId, isVideo } = data;
    console.log('User joined voice:', data);
    setConnectedUsers(prev => {
        if (prev.find(u => u.socketId === socketId)) return prev;
        return [...prev, { userId: newUserId, userName, userAvatar, socketId, isVideo, isMuted: false, isScreenSharing: false }];
    });
    createPeerConnection(socketId, newUserId, true);
  }, [createPeerConnection]);

  const handleCurrentUsers = useCallback((users) => {
    console.log('Received current users in voice channel:', users);
    users.forEach(user => {
      setConnectedUsers(prev => {
          if (prev.find(u => u.socketId === user.socketId)) return prev;
          return [...prev, { ...user, isMuted: false, isScreenSharing: false }];
      });
      createPeerConnection(user.socketId, user.userId, false);
    });
  }, [createPeerConnection]);
  
  const handleUserLeft = useCallback((data) => {
    const { socketId } = data;
    console.log('User left voice:', data);
    setConnectedUsers(prev => prev.filter(user => user.socketId !== socketId));
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }
    if (userVideosRef.current[socketId]) {
      delete userVideosRef.current[socketId];
    }
  }, []);

  const handleUserVideoToggle = useCallback((data) => {
    const { socketId, isVideo } = data;
    setConnectedUsers(prev => prev.map(user => user.socketId === socketId ? { ...user, isVideo } : user ));
  }, []);

  const handleUserAudioToggle = useCallback((data) => {
    const { socketId, isMuted } = data;
    setConnectedUsers(prev => prev.map(user => user.socketId === socketId ? { ...user, isMuted } : user ));
  }, []);
  
  const handleWebRTCOffer = useCallback(async (data) => {
    const { offer, fromSocketId, fromUserId } = data;
    console.log(`Received WebRTC offer from ${fromSocketId} (User: ${fromUserId})`);
    if (!socketRef.current) return;
    if (!peersRef.current[fromSocketId]) {
        await createPeerConnection(fromSocketId, fromUserId, false);
    }
    const peerConnection = peersRef.current[fromSocketId];
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        if (socketRef.current) {
            socketRef.current.emit('webrtc_answer', { targetSocketId: fromSocketId, answer, userId });
        }
      } catch (error) { console.error('Error handling WebRTC offer:', error); }
    }
  }, [userId, createPeerConnection]);

  const handleWebRTCAnswer = useCallback(async (data) => {
    const { answer, fromSocketId } = data;
    console.log(`Received WebRTC answer from ${fromSocketId}`);
    const peerConnection = peersRef.current[fromSocketId];
    if (peerConnection) {
      try { await peerConnection.setRemoteDescription(new RTCSessionDescription(answer)); }
      catch (error) { console.error('Error handling WebRTC answer:', error); }
    }
  }, []);

  const handleICECandidate = useCallback(async (data) => {
    const { candidate, fromSocketId } = data;
    const peerConnection = peersRef.current[fromSocketId];
    if (peerConnection && candidate && peerConnection.signalingState !== "closed") { // Check signalingState
      try { await peerConnection.addIceCandidate(new RTCIceCandidate(candidate)); }
      catch (error) {
        if (!error.message.includes("closed") && !error.message.includes("State is 'closed'")) {
            console.warn('Error adding ICE candidate:', error.name, error.message, `From: ${fromSocketId}`);
        }
      }
    }
  }, []);

  const handleScreenShareStart = useCallback((data) => {
      const { socketId } = data;
      setConnectedUsers(prev => prev.map(user => user.socketId === socketId ? { ...user, isScreenSharing: true } : user ));
  }, []);
  const handleScreenShareStop = useCallback((data) => {
      const { socketId } = data;
      setConnectedUsers(prev => prev.map(user => user.socketId === socketId ? { ...user, isScreenSharing: false } : user ));
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setConnectionAttemptMessage('🔴 Connecting...');
      return;
    }
    if (!userId || !process.env.REACT_APP_URL) {
        setConnectionAttemptMessage(`🔴 Error: ${!userId ? 'User ID missing' : 'Server URL misconfigured'}`);
        setIsConnected(false); return;
    }
    setConnectionAttemptMessage('🟡 Attempting connection...');
    console.log(`useEffect[isOpen, userId]: Attempting to connect to socket server at ${process.env.REACT_APP_URL} for user ${userId}`);
    const newSocket = io(process.env.REACT_APP_URL, { reconnectionAttempts: 3, query: { userId } });
    socketRef.current = newSocket;
    const onConnect = () => {
      console.log('Socket connected successfully! ID:', newSocket.id);
      setIsConnected(true); setConnectionAttemptMessage('🟢 Connected'); newSocket.emit('get_userid', userId); 
    };
    const onConnectError = (err) => {
      console.error('Socket connection error:', err.message, err.data);
      setIsConnected(false); setConnectionAttemptMessage(`🔴 Connection Failed: ${err.message}`);
    };
    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false); setConnectionAttemptMessage('🔴 Disconnected');
    };
    newSocket.on('connect', onConnect); newSocket.on('connect_error', onConnectError); newSocket.on('disconnect', onDisconnect);
    newSocket.on('user_joined_voice', handleUserJoined); newSocket.on('current_voice_users', handleCurrentUsers);
    newSocket.on('user_left_voice', handleUserLeft); newSocket.on('user_video_toggle', handleUserVideoToggle);
    newSocket.on('user_audio_toggle', handleUserAudioToggle); newSocket.on('webrtc_offer', handleWebRTCOffer);
    newSocket.on('webrtc_answer', handleWebRTCAnswer); newSocket.on('webrtc_ice_candidate', handleICECandidate);
    newSocket.on('user_screen_share_start', handleScreenShareStart); newSocket.on('user_screen_share_stop', handleScreenShareStop);
    return () => {
      console.log("useEffect[isOpen, userId]: Cleaning up socket instance and listeners. Socket ID:", newSocket.id);
      newSocket.off('connect', onConnect); newSocket.off('connect_error', onConnectError); newSocket.off('disconnect', onDisconnect);
      newSocket.off('user_joined_voice', handleUserJoined); newSocket.off('current_voice_users', handleCurrentUsers);
      newSocket.off('user_left_voice', handleUserLeft); newSocket.off('user_video_toggle', handleUserVideoToggle);
      newSocket.off('user_audio_toggle', handleUserAudioToggle); newSocket.off('webrtc_offer', handleWebRTCOffer);
      newSocket.off('webrtc_answer', handleWebRTCAnswer); newSocket.off('webrtc_ice_candidate', handleICECandidate);
      newSocket.off('user_screen_share_start', handleScreenShareStart); newSocket.off('user_screen_share_stop', handleScreenShareStop);
      newSocket.disconnect();
      if (socketRef.current === newSocket) { socketRef.current = null; }
      setIsConnected(false); setConnectionAttemptMessage('🔴 Connecting...');
    };
  }, [ isOpen, userId, handleUserJoined, handleCurrentUsers, handleUserLeft, handleUserVideoToggle,
      handleUserAudioToggle, handleWebRTCOffer, handleWebRTCAnswer, handleICECandidate,
      handleScreenShareStart, handleScreenShareStop ]);

  const joinVoiceChannel = useCallback(async () => {
    if (!socketRef.current || !socketRef.current.connected) {
        console.warn("joinVoiceChannel called but socket not connected.");
        setConnectionAttemptMessage("🔴 Not connected. Cannot join."); return;
    }
    try {
      console.log("Requesting user media. Video enabled:", isVideoEnabled);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoEnabled });
      localStreamRef.current = stream;
      if (localVideoRef.current) { localVideoRef.current.srcObject = stream; }
      console.log("Emitting 'join_voice_channel'");
      socketRef.current.emit('join_voice_channel', {
        channelId, userId, userName: username, userAvatar, isVideo: isVideoEnabled
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access microphone/camera. Please check permissions.');
      setConnectionAttemptMessage(`🔴 Media Error: ${error.message}`);
    }
  }, [channelId, userId, username, userAvatar, isVideoEnabled]);

  const leaveVoiceChannel = useCallback(() => {
    console.log("leaveVoiceChannel called");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop()); localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop()); screenStreamRef.current = null;
    }
    Object.values(peersRef.current).forEach(peer => { if (peer) peer.close(); });
    peersRef.current = {};
    if (socketRef.current && socketRef.current.connected) {
      console.log("Emitting 'leave_voice_channel'");
      socketRef.current.emit('leave_voice_channel');
    }
    setConnectedUsers([]); setIsMuted(false); setIsScreenSharing(false);
  }, []);

  useEffect(() => {
    if (isConnected && isOpen) {
      console.log("useEffect[isConnected, isOpen]: Socket connected and modal open, calling joinVoiceChannel.");
      joinVoiceChannel();
    }
    return () => {
      if (!isConnected && isOpen && (localStreamRef.current || Object.keys(peersRef.current).length > 0)) {
          console.log("useEffect[isConnected, isOpen] cleanup: Connection lost while modal open. Cleaning local media/peers.");
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop()); localStreamRef.current = null;
            }
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop()); screenStreamRef.current = null;
            }
            Object.values(peersRef.current).forEach(peer => { if (peer) peer.close(); });
            peersRef.current = {}; setConnectedUsers([]);
      }
    };
  }, [isConnected, isOpen, joinVoiceChannel]);

  const toggleMute = useCallback(() => {
    console.log("Toggling mute. Current localStreamRef:", localStreamRef.current);
    if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      const currentlyEnabled = audioTrack.enabled;
      audioTrack.enabled = !currentlyEnabled;
      const newUIMutedState = !audioTrack.enabled; // If track is now disabled, UI says muted
      
      setIsMuted(newUIMutedState);
      
      if (socketRef.current && socketRef.current.connected) {
        console.log("Emitting toggle_audio, newUIMutedState (muted status):", newUIMutedState);
        socketRef.current.emit('toggle_audio', newUIMutedState); // Send true if muted, false if unmuted
      } else { console.warn("Cannot emit toggle_audio: socket not connected."); }
    } else { console.warn("Cannot toggle mute: no local stream or audio track."); }
  }, []);

  const toggleVideo = useCallback(async () => {
    console.log("Toggling video. isVideoEnabled (current UI state):", isVideoEnabled, "isScreenSharing:", isScreenSharing);
    if (isScreenSharing) { alert("Please stop screen sharing to use your camera."); return; }
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn("Cannot toggle video: socket not connected."); return;
    }

    const newUIVideoState = !isVideoEnabled; // The desired UI state after toggle

    try {
      let currentLocalStream = localStreamRef.current;
      if (newUIVideoState) { // === Turning video ON ===
        if (!currentLocalStream) {
          console.log("toggleVideo (ON): No local stream, creating new one with video.");
          currentLocalStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
          localStreamRef.current = currentLocalStream;
        }
        let videoTrack = currentLocalStream.getVideoTracks()[0];
        if (!videoTrack) {
          console.log("toggleVideo (ON): Stream exists, but no video track. Adding video track.");
          const videoStreamOnly = await navigator.mediaDevices.getUserMedia({ video: true });
          videoTrack = videoStreamOnly.getVideoTracks()[0];
          currentLocalStream.addTrack(videoTrack);
        }
        videoTrack.enabled = true;
        if (localVideoRef.current) { localVideoRef.current.srcObject = currentLocalStream; }
        Object.values(peersRef.current).forEach(peer => {
          if (peer) {
            const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) { sender.replaceTrack(videoTrack).catch(e => console.error("Error replacing video track for peer:", e)); }
            else { peer.addTrack(videoTrack, currentLocalStream); }
          }
        });
      } else { // === Turning video OFF ===
        if (currentLocalStream && currentLocalStream.getVideoTracks().length > 0) {
          const videoTrack = currentLocalStream.getVideoTracks()[0];
          videoTrack.enabled = false;
        }
        // UI will hide video via CSS based on isVideoEnabled state
      }
      setIsVideoEnabled(newUIVideoState);
      console.log("Emitting toggle_video, newUIVideoState (video on status):", newUIVideoState);
      socketRef.current.emit('toggle_video', newUIVideoState);
    } catch (error) {
      console.error('Error toggling video:', error);
      alert(`Error toggling video: ${error.message}`);
    }
  }, [isVideoEnabled, isScreenSharing]);

  const toggleScreenShare = useCallback(async () => {
    console.log("Toggling screen share. isScreenSharing (current UI state):", isScreenSharing);
    if (!socketRef.current || !socketRef.current.connected) {
      console.warn("Cannot toggle screen share: socket not connected."); return;
    }
    try {
      if (isScreenSharing) { // === Stop screen sharing ===
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false); // UI update
        socketRef.current.emit('stop_screen_share'); // Notify server

        if (localStreamRef.current && isVideoEnabled) { // isVideoEnabled is the state of camera *before* screen share
          const cameraVideoTrack = localStreamRef.current.getVideoTracks().find(t => t.kind === "video");
          if (cameraVideoTrack) {
            cameraVideoTrack.enabled = true;
            if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
            Object.values(peersRef.current).forEach(peer => {
              if (peer) {
                const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
                if (sender) { sender.replaceTrack(cameraVideoTrack).catch(e => console.error("Error replacing with camera track:", e));}
                else { peer.addTrack(cameraVideoTrack, localStreamRef.current); }
              }
            });
          } else { console.warn("Could not find camera video track to restore."); }
        }
      } else { // === Start screen sharing ===
        const newScreenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = newScreenStream;
        if (localStreamRef.current && isVideoEnabled) { // If camera was on, disable its track
          const cameraVideoTrack = localStreamRef.current.getVideoTracks()[0];
          if (cameraVideoTrack) cameraVideoTrack.enabled = false;
        }
        const screenVideoTrack = newScreenStream.getVideoTracks()[0];
        Object.values(peersRef.current).forEach(peer => {
          if (peer) {
            const sender = peer.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) { sender.replaceTrack(screenVideoTrack).catch(e => console.error("Error replacing with screen track:", e));}
            else { peer.addTrack(screenVideoTrack, newScreenStream); }
          }
        });
        screenVideoTrack.addEventListener('ended', () => {
          if (isScreenSharing) { toggleScreenShare(); } // Check internal state
        });
        setIsScreenSharing(true); // UI update
        socketRef.current.emit('start_screen_share'); // Notify server
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      if (screenStreamRef.current && !isScreenSharing) {
          screenStreamRef.current.getTracks().forEach(track => track.stop()); screenStreamRef.current = null;
      }
      setIsScreenSharing(false); alert(`Error toggling screen share: ${error.message}`);
    }
  }, [isScreenSharing, isVideoEnabled]);

  const handleClose = useCallback(() => {
    leaveVoiceChannel(); 
    onClose();
  }, [leaveVoiceChannel, onClose]);

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal">
        <div className="voice-modal-header">
          <div className="voice-modal-title">
            <div className="channel-info">
              <span className="channel-name">#{channelName}</span>
              <span className="connection-status">{connectionAttemptMessage}</span>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}><CloseIcon /></button>
        </div>

        <div className="video-grid">
          <div className="video-container local-video">
            {/* Camera Video - shown if video is enabled AND not screen sharing */}
            <video
              ref={localVideoRef}
              autoPlay muted playsInline
              className={`user-video ${(!isVideoEnabled || isScreenSharing) ? 'video-off' : ''}`}
            />
            {/* Screen Share Video - shown if screen sharing is active */}
            {isScreenSharing && screenStreamRef.current && (
                <video
                    srcObject={screenStreamRef.current}
                    autoPlay muted playsInline
                    className="user-video" // Occupies the same slot as local video
                    style={{ objectFit: 'contain' }} // 'contain' for screen share aspect ratio
                />
            )}
            <div className="video-overlay">
              <div className="user-info">
                <img src={userAvatar || '/default-avatar.png'} alt={username} className="user-avatar" />
                <span className="user-name">{username} (You)</span>
              </div>
              <div className="video-controls-overlay">
                {isMuted && <MicOffIcon className="muted-indicator" />}
                {isScreenSharing && <ScreenShareIcon className="screen-share-indicator" />}
              </div>
            </div>
          </div>

          {connectedUsers.map((user) => (
            <div key={user.socketId} className="video-container">
              <video
                ref={el => userVideosRef.current[user.socketId] = el}
                autoPlay playsInline
                className={`user-video ${(!user.isVideo && !user.isScreenSharing) ? 'video-off' : ''}`}
              />
              {(!user.isVideo && !user.isScreenSharing) && (
                <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', background:'#202225', zIndex: 1 }}>
                    <VideocamOffIcon style={{fontSize: '3rem', color: '#72767d'}}/>
                    <p style={{color: '#dcddde', marginTop: '0.5rem'}}>{user.userName}'s camera is off</p>
                </div>
              )}
              <div className="video-overlay">
                <div className="user-info">
                  <img src={user.userAvatar || '/default-avatar.png'} alt={user.userName} className="user-avatar" />
                  <span className="user-name">{user.userName}</span>
                </div>
                <div className="video-controls-overlay">
                  {user.isMuted && <MicOffIcon className="muted-indicator" />}
                  {user.isScreenSharing && <ScreenShareIcon className="screen-share-indicator" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="voice-controls">
          <div className="control-group">
            <button className={`control-btn ${isMuted ? 'muted' : ''}`} onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button
              className={`control-btn ${!isVideoEnabled ? 'video-off' : ''} ${isScreenSharing ? 'disabled-style' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              disabled={isScreenSharing}
            >
              {isVideoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </button>
            <button
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </button>
            <button
              className={`control-btn ${isSpeakerMuted ? 'muted' : ''}`}
              onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
              title={isSpeakerMuted ? 'Unmute speakers' : 'Mute speakers'}
            >
              {isSpeakerMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </button>
          </div>
          <div className="control-group">
            <button className="control-btn settings-btn" onClick={() => setShowSettings(!showSettings)} title="Settings">
              <SettingsIcon />
            </button>
            <button className="control-btn leave-btn" onClick={handleClose} title="Leave call">
              <CallEndIcon />
            </button>
          </div>
        </div>
        {showSettings && (
          <div className="settings-panel">
            <h3>Audio & Video Settings</h3>
            <div className="setting-item"><label>Microphone</label><select><option>Default - Built-in Microphone</option></select></div>
            <div className="setting-item"><label>Camera</label><select><option>Default - Built-in Camera</option></select></div>
            <div className="setting-item"><label>Speakers</label><select><option>Default - Built-in Speakers</option></select></div>
          </div>
        )}
      </div>
      <style jsx>{`
        /* YOUR ORIGINAL CSS - UNTOUCHED */
        .voice-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .voice-modal {
          background: linear-gradient(145deg, #2C2F36 0%, #36393F 100%);
          border-radius: 16px;
          width: 90vw;
          height: 90vh;
          max-width: 1200px;
          max-height: 800px;
          display: flex;
          flex-direction: column;
          color: white;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }

        .voice-modal-header {
          background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .channel-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .channel-name {
          font-size: 1.2rem;
          font-weight: 600;
        }

        .connection-status {
          font-size: 0.8rem;
          opacity: 0.9;
        }

        .close-btn {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 50%;
          transition: background-color 0.2s;
        }

        .close-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .video-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1rem;
          overflow-y: auto;
        }

        .video-container {
          position: relative;
          background: #1e2124;
          border-radius: 12px;
          overflow: hidden;
          aspect-ratio: 16/9;
          min-height: 200px;
        }

        .local-video {
          border: 2px solid #5865F2;
        }

        .user-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #1e2124;
        }

        .video-off {
          display: none;
        }

        .video-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .video-controls-overlay {
          display: flex;
          gap: 0.5rem;
        }

        .muted-indicator,
        .screen-share-indicator {
          color: #ed4245;
          font-size: 1.2rem;
        }

        .screen-share-indicator {
          color: #57f287;
        }

        .voice-controls {
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .control-group {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .control-btn {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.2rem;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .control-btn.muted,
        .control-btn.video-off {
          background: #ed4245;
        }

        .control-btn.muted:hover,
        .control-btn.video-off:hover {
          background: #c73e41;
        }

        .control-btn.active {
          background: #57f287;
          color: #1e2124;
        }

        .control-btn.active:hover {
          background: #4ce379;
        }
        
        .control-btn.disabled-style { /* Style for when button is logically disabled by screen share */
            opacity: 0.5;
            /* cursor: not-allowed; // HTML disabled attribute handles this */
        }
        .control-btn.disabled-style:hover { /* Prevent hover effect when styled as disabled */
            background: rgba(255, 255, 255, 0.1); 
            transform: none;
        }


        .leave-btn {
          background: #ed4245;
        }

        .leave-btn:hover {
          background: #c73e41;
        }

        .settings-panel {
          position: absolute;
          bottom: 80px;
          right: 1rem;
          background: #2C2F36;
          border-radius: 12px;
          padding: 1.5rem;
          min-width: 300px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .settings-panel h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .setting-item {
          margin-bottom: 1rem;
        }

        .setting-item label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          color: #b9bbbe;
        }

        .setting-item select {
          width: 100%;
          background: #1e2124;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.5rem;
          color: white;
          font-size: 0.9rem;
        }

        .setting-item select:focus {
          outline: none;
          border-color: #5865F2;
        }

        @media (max-width: 768px) {
          .voice-modal {
            width: 95vw;
            height: 95vh;
          }

          .video-grid {
            grid-template-columns: 1fr;
            gap: 0.5rem;
            padding: 0.5rem;
          }

          .video-container {
            min-height: 150px;
          }

          .voice-controls {
            padding: 1rem;
          }

          .control-group {
            gap: 0.5rem;
          }

          .control-btn {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .settings-panel {
            bottom: 70px;
            right: 0.5rem;
            min-width: 250px;
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceVideoModal;