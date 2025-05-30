import React, { useState, useEffect, useCallback } from 'react';
import topnav_chatcss from '../topnav_chat/topnav_chat.module.css';
import TagIcon from '@mui/icons-material/Tag';
import PushPinIcon from '@mui/icons-material/PushPin';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function Topnav_chat() {
  const channel_name = useSelector(state => state.current_page.page_name);
  const channel_id = useSelector(state => state.current_page.page_id);
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [availableMessages, setAvailableMessages] = useState([]);

  // Helper function to format timestamps
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    
    try {
      const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
      const date = numTimestamp > 9999999999 
        ? new Date(numTimestamp) 
        : new Date(numTimestamp * 1000);
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return timestamp.toString();
    }
  }, []);

  // Function to get messages from API
  const getMessagesForSearch = useCallback(async () => {
    const url = process.env.REACT_APP_URL;
    const server_id = window.location.pathname.split('/')[2];

    if (!channel_id) {
      setAvailableMessages([]);
      return;
    }

    try {
      const res = await fetch(`${url}/get_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({ channel_id, server_id }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.chats && Array.isArray(data.chats)) {
        const formattedMessages = data.chats.map(msg => ({
          id: msg.sender_id || msg.id || msg.timestamp || msg._id,
          content: msg.content || msg.message || '',
          author: msg.sender_name || msg.author || msg.username || '',
          sender_pic: msg.sender_pic || msg.avatar || msg.profile_picture || '',
          timestamp: msg.timestamp || msg.created_at || msg.date || '',
          displayTimestamp: formatTimestamp(msg.timestamp),
          image: msg.image || msg.attachment || null
        }));

        setAvailableMessages(formattedMessages);
        console.log('Messages loaded for search:', formattedMessages.length);
      } else {
        console.warn('Unexpected API response structure:', data);
        setAvailableMessages([]);
      }

    } catch (err) {
      console.error('Error fetching messages for search:', err);
      setAvailableMessages([]);
    }
  }, [channel_id, formatTimestamp]);

  // Fetch messages when channel changes
  useEffect(() => {
    getMessagesForSearch();
  }, [getMessagesForSearch]);

  // Search function with debouncing
  const performSearch = useCallback((query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const timeoutId = setTimeout(() => {
      const results = availableMessages.filter(message =>
        (message.content || '').toLowerCase().includes(query.toLowerCase()) ||
        (message.author || '').toLowerCase().includes(query.toLowerCase())
      ).map(message => {
        const content = message.content || '';
        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const highlightedContent = content.replace(
          new RegExp(`(${safeQuery})`, 'gi'),
          '<mark>$1</mark>'
        );

        return {
          ...message,
          highlightedContent
        };
      });

      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [availableMessages]);

  // Handle search input with proper debouncing
  const handleSearchInput = useCallback((e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  // Handle search form submission
  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchModal(true);
      performSearch(searchQuery);
    }
  }, [searchQuery, performSearch]);

  // Enhanced message navigation
  const handleResultClick = useCallback((messageId, messageTimestamp) => {
    setShowSearchModal(false);
    
    // Try multiple selectors to find the message
    const selectors = [
      `[data-timestamp="${messageId}"]`,
      `[data-timestamp="${messageTimestamp}"]`,
      `[data-id="${messageId}"]`,
      `[id="${messageId}"]`,
      `[id*="${messageId}"]`
    ];
    
    let messageElement = null;
    
    for (const selector of selectors) {
      messageElement = document.querySelector(selector);
      if (messageElement) break;
    }
    
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add(topnav_chatcss.highlightMessage);
      setTimeout(() => {
        messageElement.classList.remove(topnav_chatcss.highlightMessage);
      }, 3000);
    } else {
      // Fallback: search by message content
      const messageData = availableMessages.find(m => m.id === messageId);
      if (messageData) {
        const allMessages = document.querySelectorAll('[class*="message"], .message, [id*="message"]');
        let foundMessage = null;
        
        allMessages.forEach(msg => {
          const msgContent = msg.textContent || msg.innerText;
          if (msgContent.includes(messageData.content)) {
            foundMessage = msg;
          }
        });
        
        if (foundMessage) {
          foundMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
          foundMessage.classList.add(topnav_chatcss.highlightMessage);
          setTimeout(() => {
            foundMessage.classList.remove(topnav_chatcss.highlightMessage);
          }, 3000);
        } else {
          // Last resort: scroll to messages container
          const messagesContainer = document.querySelector('[id*="messages"]') || 
                                   document.querySelector('.messages-container') ||
                                   document.querySelector('[class*="chat"]');
          if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }
          console.warn(`Message with ID ${messageId} not found in DOM`);
        }
      }
    }
  }, [availableMessages]);

  // Clear search functionality
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchModal(false);
  }, []);

  // Handle modal backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      setShowSearchModal(false);
    }
  }, []);

  // Tooltip renderer
  const renderTooltip = useCallback((value) => (
    <Tooltip id={`tooltip-${value}`}>
      {value}
    </Tooltip>
  ), []);

  // Button renderer with proper event handling
  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${process.env.REACT_APP_URL}/logout`, {
        method: 'POST',
        credentials: 'include',        
      });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate]);

  const renderButton = useCallback((message, Icon) => {
    const handleClick = () => {
      if (message === 'Logout') {
        handleLogout();
        return;
      }
  };
    return (
      <div
        className={topnav_chatcss.right_comps}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
      >
        <OverlayTrigger placement="bottom" overlay={renderTooltip(message)}>
          <div>
            <Icon />
          </div>
        </OverlayTrigger>
      </div>
    );
  }, [navigate, renderTooltip]);

  return (
    <>
      <div className={topnav_chatcss.main_wrap}>
        <div id={topnav_chatcss.left}>
          <TagIcon />
          <div id={topnav_chatcss.channel_name}>
            {channel_name}
          </div>
        </div>

        <div id={topnav_chatcss.right}>
          {renderButton('Pinned Messages', PushPinIcon)}

          {/* Enhanced Search Input */}
          <form onSubmit={handleSearchSubmit} className={topnav_chatcss.searchForm}>
            <input
              placeholder="Search messages..."
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              className={topnav_chatcss.searchInput}
              autoComplete="off"
            />
            {searchQuery && (
              <CloseIcon
                onClick={clearSearch}
                className={topnav_chatcss.clearSearchIcon}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    clearSearch();
                  }
                }}
              />
            )}
          </form>

          {renderButton('Logout', LogoutIcon)}
        </div>
      </div>

      {/* Enhanced Search Results Modal */}
      {showSearchModal && (
        <div 
          className={topnav_chatcss.modalOverlay} 
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-modal-title"
        >
          <div className={topnav_chatcss.modalContent}>
            <div className={topnav_chatcss.modalHeader}>
              <div 
                id="search-modal-title"
                className={topnav_chatcss.modalTitle}
              >
                <SearchIcon className={topnav_chatcss.modalTitleIcon} />
                Search Results for "{searchQuery}"
              </div>
              <CloseIcon
                className={topnav_chatcss.modalCloseIcon}
                onClick={() => setShowSearchModal(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setShowSearchModal(false);
                  }
                }}
                aria-label="Close search modal"
              />
            </div>

            <div className={topnav_chatcss.modalBody}>
              {isSearching ? (
                <div className={topnav_chatcss.loadingContainer}>
                  <div className={topnav_chatcss.spinner} aria-hidden="true"></div>
                  <p className={topnav_chatcss.loadingText}>Searching messages...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div>
                  <p className={topnav_chatcss.resultsCount}>
                    Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </p>
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result.id, result.timestamp)}
                      className={topnav_chatcss.searchResult}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleResultClick(result.id, result.timestamp);
                        }
                      }}
                    >
                      <div className={topnav_chatcss.resultHeader}>
                        <div className={topnav_chatcss.resultAuthor}>
                          {result.sender_pic && (
                            <img
                              src={result.sender_pic}
                              alt={`${result.author}'s avatar`}
                              className={topnav_chatcss.authorAvatar}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <strong className={topnav_chatcss.authorName}>
                            {result.author}
                          </strong>
                        </div>
                        <small className={topnav_chatcss.resultTimestamp}>
                          {result.displayTimestamp}
                        </small>
                      </div>
                      <div
                        dangerouslySetInnerHTML={{ __html: result.highlightedContent }}
                        className={topnav_chatcss.resultContent}
                      />
                      {result.image && (
                        <img
                          src={result.image}
                          alt="Shared content"
                          className={topnav_chatcss.resultImage}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className={topnav_chatcss.noResults}>
                  <SearchIcon className={topnav_chatcss.noResultsIcon} />
                  <p>No messages found for "{searchQuery}"</p>
                  <p className={topnav_chatcss.noResultsSubtext}>
                    Try different keywords or check your spelling
                  </p>
                </div>
              ) : (
                <div className={topnav_chatcss.searchPrompt}>
                  <SearchIcon className={topnav_chatcss.searchPromptIcon} />
                  <p>Start typing to search messages</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Topnav_chat;