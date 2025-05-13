import React, { useState, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import '../../styles/MessageInput.css';

const MessageInput = ({ channelId }) => {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const socket = useSocket();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !channelId) return;

    socket.emit('send_message', {
      channelId,
      content: message.trim()
    });
    
    // Clear input
    setMessage('');
  };

  const handleKeyPress = (e) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // In a real app, you would upload this to your server/cloud storage
    setMessage(prev => prev + `[Uploading: ${files[0].name}]`);
    
    // Close the attachment menu
    setIsAttachmentMenuOpen(false);
  };

  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen(!isEmojiPickerOpen);
    // Close attachment menu if open
    if (isAttachmentMenuOpen) {
      setIsAttachmentMenuOpen(false);
    }
  };

  const toggleAttachmentMenu = () => {
    setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
    // Close emoji picker if open
    if (isEmojiPickerOpen) {
      setIsEmojiPickerOpen(false);
    }
  };

  const handleEmojiSelect = (emoji) => {
    // Insert emoji at cursor position or at end
    setMessage(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  // Placeholder for emoji picker
  const EmojiPicker = () => (
    <div className="emoji-picker">
      {/* This would be your actual emoji picker component */}
      <div className="emoji-grid">
        {['😀', '😂', '😍', '🥳', '😎', '👍', '❤️', '🔥'].map(emoji => (
          <button 
            key={emoji} 
            className="emoji-button" 
            onClick={() => handleEmojiSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );

  // Attachment menu options
  const AttachmentMenu = () => (
    <div className="attachment-menu">
      <button className="attachment-option" onClick={() => fileInputRef.current.click()}>
        <i className="fas fa-file"></i> Upload File
      </button>
      <button className="attachment-option">
        <i className="fas fa-camera"></i> Take Photo
      </button>
      <button className="attachment-option">
        <i className="fas fa-film"></i> Record Video
      </button>
    </div>
  );

  return (
    <div className="message-input-container">
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
        multiple
      />

      {isEmojiPickerOpen && <EmojiPicker />}
      {isAttachmentMenuOpen && <AttachmentMenu />}
      
      <form className="message-form" onSubmit={handleSubmit}>
        <button 
          type="button" 
          className="attachment-button"
          onClick={toggleAttachmentMenu}
        >
          <i className="fas fa-plus-circle"></i>
        </button>
        
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={`Message #${channelId ? 'channel-name' : '...'}`}
          disabled={!channelId}
          className="message-textarea"
        />
        
        <button 
          type="button" 
          className="emoji-picker-button"
          onClick={toggleEmojiPicker}
        >
          <i className="fas fa-smile"></i>
        </button>
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim() || !channelId}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

export default MessageInput;