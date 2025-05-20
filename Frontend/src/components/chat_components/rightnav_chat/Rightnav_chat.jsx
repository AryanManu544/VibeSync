import React from 'react';
import rightnav_chatcss from '../rightnav_chat/rightnav_chat.module.css';
import { useSelector } from 'react-redux';

const Rightnav_chat = () => {
  const members = useSelector(state => state.current_page.members) || [];

  // Helper to get initials from a name
  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <div className={rightnav_chatcss.main_wrap}>
      <div className={rightnav_chatcss.main}>
        <div className={rightnav_chatcss.members_length}>
          ALL MEMBERS — {members.length}
        </div>
        <div className={rightnav_chatcss.members}>
          {members.map((member) => {
            const {
              user_id,
              user_name = 'Unknown',
              user_tag = '0000',
              user_profile_pic = ''
            } = member;

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
                  <span className={rightnav_chatcss.username}>
                    {user_name}
                  </span>
                  <span className={rightnav_chatcss.tag}>
                    #{user_tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Rightnav_chat;