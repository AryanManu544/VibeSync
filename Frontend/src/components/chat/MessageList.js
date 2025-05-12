import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './MessageList.css';

const MessageList = ({ messages, currentChannel }) => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are received
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!currentChannel) {
    return (
      <div className="no-channel-selected">
        <h3>Select a channel to start chatting</h3>
      </div>
    );
  }

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="message-list">
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date} className="message-group">
          <div className="date-divider">
            <span>{date}</span>
          </div>
          
          {dateMessages.map((message) => {
            const isCurrentUser = message.userId === user?.id;
            
            return (
              <div 
                key={message.id} 
                className={`message ${isCurrentUser ? 'my-message' : ''}`}
              >
                {!isCurrentUser && (
                  <div className="message-avatar">
                    <img 
                      src={message.user?.avatarUrl || '/default-avatar.png'} 
                      alt={message.user?.username || 'User'} 
                    />
                  </div>
                )}
                
                <div className="message-content">
                  {!isCurrentUser && (
                    <div className="message-header">
                      <span className="username">{message.user?.username || 'Unknown User'}</span>
                      <span className="timestamp">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  )}
                  
                  <div className="message-text">{message.content}</div>
                  
                  {/* Message actions: reactions, edit, delete */}
                  {isCurrentUser && (
                    <div className="message-actions">
                      <button className="action-button emoji-button">
                        <i className="fas fa-smile"></i>
                      </button>
                      <button className="action-button edit-button">
                        <i className="fas fa-edit"></i>
                      </button>
                      <button className="action-button delete-button">
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;