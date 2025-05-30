import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';

// Icons (using Material-UI icons from your existing imports)
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

  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(initialVideoEnabled);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  // Refs
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});
  const userVideosRef = useRef({});

  // WebRTC configuration
  const rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Initialize socket connection
  useEffect(() => {
    if (!isOpen) return;

    const API = process.env.REACT_APP_URL;
    socketRef.current = io(API);
    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('get_userid', userId);
    });

    // Voice chat event handlers
    socket.on('user_joined_voice', handleUserJoined);
    socket.on('current_voice_users', handleCurrentUsers);
    socket.on('user_left_voice', handleUserLeft);
    socket.on('user_video_toggle', handleUserVideoToggle);
    socket.on('user_audio_toggle', handleUserAudioToggle);
    
    // WebRTC signaling handlers
    socket.on('webrtc_offer', handleWebRTCOffer);
    socket.on('webrtc_answer', handleWebRTCAnswer);
    socket.on('webrtc_ice_candidate', handleICECandidate);

    // Screen sharing handlers
    socket.on('user_screen_share_start', handleScreenShareStart);
    socket.on('user_screen_share_stop', handleScreenShareStop);

    return () => {
      socket.disconnect();
    };
  }, [isOpen, userId]);

  // Get user media and join voice channel
  useEffect(() => {
    if (isConnected && isOpen) {
      joinVoiceChannel();
    }
    
    return () => {
      leaveVoiceChannel();
    };
  }, [isConnected, isOpen]);

  const joinVoiceChannel = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      socketRef.current.emit('join_voice_channel', {
        channelId,
        userId,
        userName: username,
        userAvatar,
        isVideo: isVideoEnabled
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access microphone/camera. Please check permissions.');
    }
  };

  const leaveVoiceChannel = () => {
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop screen sharing stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Close all peer connections
    Object.values(peersRef.current).forEach(peer => {
      peer.close();
    });
    peersRef.current = {};

    // Leave voice channel
    if (socketRef.current) {
      socketRef.current.emit('leave_voice_channel');
    }

    setConnectedUsers([]);
    setIsConnected(false);
  };

  // User event handlers
  const handleUserJoined = (data) => {
    const { userId: newUserId, userName, userAvatar, socketId, isVideo } = data;
    
    setConnectedUsers(prev => [...prev, {
      userId: newUserId,
      userName,
      userAvatar,
      socketId,
      isVideo,
      isMuted: false,
      isScreenSharing: false
    }]);

    // Create peer connection for new user
    createPeerConnection(socketId, newUserId, true);
  };

  const handleCurrentUsers = (users) => {
    users.forEach(user => {
      setConnectedUsers(prev => [...prev, {
        ...user,
        isMuted: false,
        isScreenSharing: false
      }]);
      
      // Create peer connection for existing users
      createPeerConnection(user.socketId, user.userId, false);
    });
  };

  const handleUserLeft = (data) => {
    const { socketId } = data;
    
    setConnectedUsers(prev => prev.filter(user => user.socketId !== socketId));
    
    // Close peer connection
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].close();
      delete peersRef.current[socketId];
    }

    // Remove video element
    if (userVideosRef.current[socketId]) {
      delete userVideosRef.current[socketId];
    }
  };

  const handleUserVideoToggle = (data) => {
    const { socketId, isVideo } = data;
    setConnectedUsers(prev => 
      prev.map(user => 
        user.socketId === socketId 
          ? { ...user, isVideo }
          : user
      )
    );
  };

  const handleUserAudioToggle = (data) => {
    const { socketId, isMuted } = data;
    setConnectedUsers(prev => 
      prev.map(user => 
        user.socketId === socketId 
          ? { ...user, isMuted }
          : user
      )
    );
  };

  // WebRTC functions
  const createPeerConnection = async (socketId, remoteUserId, isInitiator) => {
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peersRef.current[socketId] = peerConnection;

    // Add local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      if (userVideosRef.current[socketId]) {
        userVideosRef.current[socketId].srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc_ice_candidate', {
          targetSocketId: socketId,
          candidate: event.candidate,
          userId
        });
      }
    };

    // Create offer if initiator
    if (isInitiator) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socketRef.current.emit('webrtc_offer', {
          targetSocketId: socketId,
          offer,
          userId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  };

  const handleWebRTCOffer = async (data) => {
    const { offer, fromSocketId, fromUserId } = data;
    const peerConnection = peersRef.current[fromSocketId];

    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socketRef.current.emit('webrtc_answer', {
          targetSocketId: fromSocketId,
          answer,
          userId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    }
  };

  const handleWebRTCAnswer = async (data) => {
    const { answer, fromSocketId } = data;
    const peerConnection = peersRef.current[fromSocketId];

    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(answer);
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  };

  const handleICECandidate = async (data) => {
    const { candidate, fromSocketId } = data;
    const peerConnection = peersRef.current[fromSocketId];

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  };

  // Control functions
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        
        socketRef.current.emit('toggle_audio', !audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoEnabled) {
        // Turn off video
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
          localStreamRef.current.removeTrack(videoTrack);
        }
        setIsVideoEnabled(false);
      } else {
        // Turn on video
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = videoStream.getVideoTracks()[0];
        
        localStreamRef.current.addTrack(videoTrack);
        
        // Update peer connections
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            peer.addTrack(videoTrack, localStreamRef.current);
          }
        });
        
        setIsVideoEnabled(true);
      }
      
      socketRef.current.emit('toggle_video', !isVideoEnabled);
      
    } catch (error) {
      console.error('Error toggling video:', error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }
        
        // Switch back to camera
        if (isVideoEnabled) {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const videoTrack = videoStream.getVideoTracks()[0];
          
          Object.values(peersRef.current).forEach(peer => {
            const sender = peer.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          });
        }
        
        setIsScreenSharing(false);
        socketRef.current.emit('stop_screen_share');
        
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true, 
          audio: true 
        });
        screenStreamRef.current = screenStream;
        
        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace video track in peer connections
        Object.values(peersRef.current).forEach(peer => {
          const sender = peer.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
          } else {
            peer.addTrack(videoTrack, screenStream);
          }
        });
        
        // Handle screen share end
        videoTrack.addEventListener('ended', () => {
          setIsScreenSharing(false);
          socketRef.current.emit('stop_screen_share');
        });
        
        setIsScreenSharing(true);
        socketRef.current.emit('start_screen_share');
      }
      
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleScreenShareStart = (data) => {
    const { socketId } = data;
    setConnectedUsers(prev => 
      prev.map(user => 
        user.socketId === socketId 
          ? { ...user, isScreenSharing: true }
          : user
      )
    );
  };

  const handleScreenShareStop = (data) => {
    const { socketId } = data;
    setConnectedUsers(prev => 
      prev.map(user => 
        user.socketId === socketId 
          ? { ...user, isScreenSharing: false }
          : user
      )
    );
  };

  const handleClose = () => {
    leaveVoiceChannel();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="voice-modal-overlay">
      <div className="voice-modal">
        {/* Header */}
        <div className="voice-modal-header">
          <div className="voice-modal-title">
            <div className="channel-info">
              <span className="channel-name">#{channelName}</span>
              <span className="connection-status">
                {isConnected ? '🟢 Connected' : '🔴 Connecting...'}
              </span>
            </div>
          </div>
          <button className="close-btn" onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Video Grid */}
        <div className="video-grid">
          {/* Local video */}
          <div className="video-container local-video">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className={`user-video ${!isVideoEnabled ? 'video-off' : ''}`}
            />
            <div className="video-overlay">
              <div className="user-info">
                <img src={userAvatar} alt={username} className="user-avatar" />
                <span className="user-name">{username} (You)</span>
              </div>
              <div className="video-controls-overlay">
                {isMuted && <MicOffIcon className="muted-indicator" />}
                {isScreenSharing && <ScreenShareIcon className="screen-share-indicator" />}
              </div>
            </div>
          </div>

          {/* Remote videos */}
          {connectedUsers.map((user) => (
            <div key={user.socketId} className="video-container">
              <video
                ref={el => userVideosRef.current[user.socketId] = el}
                autoPlay
                playsInline
                className={`user-video ${!user.isVideo ? 'video-off' : ''}`}
              />
              <div className="video-overlay">
                <div className="user-info">
                  <img src={user.userAvatar} alt={user.userName} className="user-avatar" />
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

        {/* Controls */}
        <div className="voice-controls">
          <div className="control-group">
            <button
              className={`control-btn ${isMuted ? 'muted' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>

            <button
              className={`control-btn ${!isVideoEnabled ? 'video-off' : ''}`}
              onClick={toggleVideo}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
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
            <button
              className="control-btn settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <SettingsIcon />
            </button>

            <button
              className="control-btn leave-btn"
              onClick={handleClose}
              title="Leave call"
            >
              <CallEndIcon />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="settings-panel">
            <h3>Audio & Video Settings</h3>
            <div className="setting-item">
              <label>Microphone</label>
              <select>
                <option>Default - Built-in Microphone</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Camera</label>
              <select>
                <option>Default - Built-in Camera</option>
              </select>
            </div>
            <div className="setting-item">
              <label>Speakers</label>
              <select>
                <option>Default - Built-in Speakers</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
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
          border-top: 1px solid rgba(255, 255, 255, 0.1);
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
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
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
          border: 1px solid rgba(255, 255, 255, 0.1);
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