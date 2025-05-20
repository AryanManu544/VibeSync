// src/components/rightnav_chat/Rightnav_chat.jsx
import React from 'react';
import rightnav_chatcss from './rightnav_chat.module.css';
import { useSelector } from 'react-redux';

export default function Rightnav_chat() {
  // Log the entire Redux store for inspection
  const entireState = useSelector(state => state);
  console.log('⚛️ Entire Redux state:', entireState);

  // Try selecting members from the most likely path
  let members = [];
  if (entireState.current_page && Array.isArray(entireState.current_page.members)) {
    members = entireState.current_page.members;
  } else if (entireState.currentPage && Array.isArray(entireState.currentPage.members)) {
    members = entireState.currentPage.members;
  } else if (entireState.user_relations && Array.isArray(entireState.user_relations.servers)) {
    // just for fallback demo
    members = [];
  }

  console.log('👥 Render members:', members);

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (!parts[0]) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (
      parts[0][0].toUpperCase() +
      parts[parts.length - 1][0].toUpperCase()
    );
  };

  return (
    <div className={rightnav_chatcss.main_wrap}>
      <div className={rightnav_chatcss.main}>
        <div className={rightnav_chatcss.members_length}>
          ALL MEMBERS — {members.length}
        </div>
        <div className={rightnav_chatcss.members}>
          {members.map(member => {
            const { user_id, user_name, user_tag, user_profile_pic } = member;
            return (
              <div key={user_id} className={rightnav_chatcss.individual_member}>
                {user_profile_pic ? (
                  <img
                    src={user_profile_pic}
                    alt={`${user_name} avatar`}
                    className={rightnav_chatcss.avatar}
                  />
                ) : (
                  <div className={rightnav_chatcss.avatarFallback}>
                    {getInitials(user_name)}
                  </div>
                )}
                <div className={rightnav_chatcss.memberInfo}>
                  <span className={rightnav_chatcss.username}>{user_name}</span>
                  <span className={rightnav_chatcss.tag}>#{user_tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}