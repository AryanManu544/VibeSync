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

    // Optional: cleanup
    socket.on("disconnect", () => {
      console.log('🔴 Socket disconnected');
    });
  });
}

module.exports = { setupSocket };
