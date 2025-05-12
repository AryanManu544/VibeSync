import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useSocket } from '../../context/SocketContext';
import apiService from '../../services/apiService';
import './ChatWindow.css';

const ChatWindow = ({ currentServer, currentChannel }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const socket = useSocket();

  // Fetch messages when channel changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentChannel) return;

      setLoading(true);
      setError(null);

      try {
        const response = await apiService.get(`/channels/${currentChannel._id}/messages`);
        setMessages(response);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [currentChannel]);

  // Listen for new messages
  useEffect(() => {
    if (!socket || !currentChannel) return;

    const handleNewMessage = (newMessage) => {
      if (newMessage.channelId === currentChannel._id) {
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }
    };

    socket.on('receive_message', handleNewMessage);

    // Join the channel room
    socket.emit('join_channel', currentChannel._id);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, currentChannel]);

  return (
    <div className="chat-window">
      {/* Channel Header */}
      <div className="channel-header">
        {currentChannel ? (
          <>
            <div className="channel-name">
              <i className="fas fa-hashtag"></i>
              <span>{currentChannel.name}</span>
            </div>
            <div className="channel-topic">
              {currentChannel.topic || 'No topic set'}
            </div>
            <div className="channel-actions">
              <button className="action-button">
                <i className="fas fa-user-plus"></i>
              </button>
              <button className="action-button">
                <i className="fas fa-search"></i>
              </button>
              <button className="action-button">
                <i className="fas fa-bell"></i>
              </button>
              <button className="action-button">
                <i className="fas fa-thumbtack"></i>
              </button>
              <button className="action-button">
                <i className="fas fa-info-circle"></i>
              </button>
            </div>
          </>
        ) : (
          <div className="no-channel">Select a channel</div>
        )}
      </div>

      {/* Message Content */}
      <div className="chat-content">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : error ? (
          <div className="error-messages">{error}</div>
        ) : (
          <MessageList 
            messages={messages} 
            currentChannel={currentChannel} 
          />
        )}
      </div>

      {/* Message Input */}
      <MessageInput 
        channelId={currentChannel?._id} 
      />
    </div>
  );
};

export default ChatWindow;