function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log('🟢 New socket connected', socket.id);

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
      socket.userName = userName;     
      socket.userAvatar = userAvatar; 
      socket.isVideo = isVideo;
      
      console.log(`User ${socket.userName} (ID: ${socket.userId}, Socket: ${socket.id}) joined voice channel ${channelId}`);

      // Notify others in the voice channel about new user
      socket.to(`voice_${channelId}`).emit('user_joined_voice', {
        userId: userId,       
        userName: userName,  
        userAvatar: userAvatar,
        socketId: socket.id,
        isVideo: isVideo   
      });
      
      // Send current users in channel to the new user
      const room = io.sockets.adapter.rooms.get(`voice_${channelId}`);
      const socketsInChannel = room ? Array.from(room) : [];
      const currentUsers = [];
      
      console.log(`Building current_voice_users for ${socket.id}. Sockets in channel: ${socketsInChannel.length}`);
      socketsInChannel.forEach(socketIdInRoom => { 
        const otherUserSocket = io.sockets.sockets.get(socketIdInRoom);
        // We want to send details of OTHER users already in the room
        if (otherUserSocket && otherUserSocket.id !== socket.id && otherUserSocket.userId) {
          // Now we can access userName and userAvatar because they were stored
          console.log(`Found other user: ${otherUserSocket.userName} (ID: ${otherUserSocket.userId}, Socket: ${otherUserSocket.id})`);
          currentUsers.push({
            userId: otherUserSocket.userId,
            userName: otherUserSocket.userName,     // Retrieve stored userName
            userAvatar: otherUserSocket.userAvatar,   // Retrieve stored userAvatar
            socketId: otherUserSocket.id,
            isVideo: otherUserSocket.isVideo || false
          });
        }
      });
      
      console.log(`Emitting current_voice_users to ${socket.id}:`, currentUsers);
      socket.emit('current_voice_users', currentUsers);
    });

    // Leave voice/video channel
    socket.on('leave_voice_channel', () => {
      if (socket.voiceChannelId) {
        console.log(`User ${socket.userName} (ID: ${socket.userId}, Socket: ${socket.id}) leaving voice channel ${socket.voiceChannelId}`);
        socket.to(`voice_${socket.voiceChannelId}`).emit('user_left_voice', {
          userId: socket.userId,
          socketId: socket.id
        });
        socket.leave(`voice_${socket.voiceChannelId}`);
        socket.voiceChannelId = null;
        socket.userId = null;
        socket.userName = null;    
        socket.userAvatar = null; 
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
      const { targetSocketId, offer, userId: fromUserIdParam } = data; 
      socket.to(targetSocketId).emit('webrtc_offer', {
        offer,
        fromSocketId: socket.id,
        fromUserId: fromUserIdParam // Use the userId passed in the event data
      });
    });

    socket.on('webrtc_answer', (data) => {
      const { targetSocketId, answer, userId: fromUserIdParam } = data;
      socket.to(targetSocketId).emit('webrtc_answer', {
        answer,
        fromSocketId: socket.id,
        fromUserId: fromUserIdParam
      });
    });

    socket.on('webrtc_ice_candidate', (data) => {
      const { targetSocketId, candidate, userId: fromUserIdParam } = data;
      socket.to(targetSocketId).emit('webrtc_ice_candidate', {
        candidate,
        fromSocketId: socket.id,
        fromUserId: fromUserIdParam
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
      console.log(`🔴 Socket disconnected: ${socket.id}. User: ${socket.userName} (ID: ${socket.userId})`); // Added details
      
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