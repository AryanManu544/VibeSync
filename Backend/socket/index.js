function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log('🟢 New socket connected');

    socket.on('get_userid', (userId) => {
      socket.join(userId);
    });

    socket.on('send_req', (receiverId, senderId, senderProfilePic, senderName) => {
      socket.to(receiverId).emit('recieve_req', {
        sender_name: senderName,
        sender_profile_pic: senderProfilePic,
        sender_id: senderId
      });
    });

    socket.on('req_accepted', (senderId, friendId, friendName, friendProfilePic) => {
      socket.to(friendId).emit('req_accepted_notif', {
        sender_id: senderId,
        friend_name: friendName,
        friend_profile_pic: friendProfilePic
      });
    });

    socket.on('join_chat', (channelId) => {
      socket.join(channelId);
    });

    socket.on('send_message', (channelId, message, timestamp, senderName, senderTag, senderPic) => {
      socket.to(channelId).emit('recieve_message', {
        message_data: {
          message,
          timestamp,
          sender_name: senderName,
          sender_tag: senderTag,
          sender_pic: senderPic
        }
      });
    });

    // ========== VOICE/VIDEO CHAT FUNCTIONALITY ==========

    // Join voice/video channel
    socket.on('join_voice_channel', (data) => {
      const { channelId, userId, userName, userAvatar, isVideo } = data;
      
      socket.join(`voice_${channelId}`);
      socket.voiceChannelId = channelId;
      socket.userId = userId;
      socket.isVideo = isVideo;
      
      // Notify others in the voice channel about new user
      socket.to(`voice_${channelId}`).emit('user_joined_voice', {
        userId,
        userName,
        userAvatar,
        socketId: socket.id,
        isVideo
      });
      
      // Send current users in channel to the new user
      const socketsInChannel = Array.from(io.sockets.adapter.rooms.get(`voice_${channelId}`) || []);
      const currentUsers = [];
      
      socketsInChannel.forEach(socketId => {
        const userSocket = io.sockets.sockets.get(socketId);
        if (userSocket && userSocket.id !== socket.id && userSocket.userId) {
          currentUsers.push({
            userId: userSocket.userId,
            socketId: userSocket.id,
            isVideo: userSocket.isVideo || false
          });
        }
      });
      
      socket.emit('current_voice_users', currentUsers);
    });

    // Leave voice/video channel
    socket.on('leave_voice_channel', () => {
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_left_voice', {
          userId: socket.userId,
          socketId: socket.id
        });
        socket.leave(`voice_${socket.voiceChannelId}`);
        socket.voiceChannelId = null;
        socket.userId = null;
        socket.isVideo = false;
      }
    });

    // Toggle video on/off
    socket.on('toggle_video', (isVideo) => {
      socket.isVideo = isVideo;
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_video_toggle', {
          userId: socket.userId,
          socketId: socket.id,
          isVideo
        });
      }
    });

    // Mute/unmute audio
    socket.on('toggle_audio', (isMuted) => {
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_audio_toggle', {
          userId: socket.userId,
          socketId: socket.id,
          isMuted
        });
      }
    });

    // WebRTC Signaling
    socket.on('webrtc_offer', (data) => {
      const { targetSocketId, offer, userId } = data;
      socket.to(targetSocketId).emit('webrtc_offer', {
        offer,
        fromSocketId: socket.id,
        fromUserId: userId
      });
    });

    socket.on('webrtc_answer', (data) => {
      const { targetSocketId, answer, userId } = data;
      socket.to(targetSocketId).emit('webrtc_answer', {
        answer,
        fromSocketId: socket.id,
        fromUserId: userId
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { targetSocketId, candidate, userId } = data;
      socket.to(targetSocketId).emit('webrtc_ice_candidate', {
        candidate,
        fromSocketId: socket.id,
        fromUserId: userId
      });
    });

    // Screen sharing
    socket.on('start_screen_share', () => {
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_screen_share_start', {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });

    socket.on('stop_screen_share', () => {
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_screen_share_stop', {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log('🔴 Socket disconnected');
      
      // Clean up voice channel
      if (socket.voiceChannelId) {
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_left_voice', {
          userId: socket.userId,
          socketId: socket.id
        });
      }
    });
  });
}

module.exports = { setupSocket };