// src/components/rightnav_chat/Rightnav_chat.jsx
import React, { useState } from 'react';
import rightnav_chatcss from './rightnav_chat.module.css';
import { useSelector } from 'react-redux';

export default function Rightnav_chat() {
  const entireState = useSelector(state => state);

  let members = [];
  if (Array.isArray(entireState.current_page?.members)) {
    members = entireState.current_page.members;
  } else if (Array.isArray(entireState.currentPage?.members)) {
    members = entireState.currentPage.members;
  }

  const roles = entireState.current_page?.roles || [];
  const currentServerId = entireState.current_page?._id;

  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (!parts[0]) return '';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
  };

  const getRolesFromIDs = (roleIDs) => {
    return roleIDs
      ?.map(id => roles.find(role => role.id === id))
      .filter(role => role);
  };

  const handleAssignRole = async (roleId) => {
    try {
      // Simulate API call
      console.log(`Assigning role ${roleId} to user ${selectedMember.user_id}`);
      // Example POST body:
      /*
      await axios.post('/assign_role', {
        server_id: currentServerId,
        user_id: selectedMember.user_id,
        role_id: roleId
      });
      */
      setShowRoleDropdown(false);
      alert('Role assigned! Refresh to see changes.');
    } catch (err) {
      console.error('❌ Error assigning role:', err);
    }
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
              <div
                key={user_id}
                className={rightnav_chatcss.individual_member}
                onClick={() => {
                  setSelectedMember(member);
                  setShowRoleDropdown(false);
                }}
              >
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

        {selectedMember && (
          <div className={rightnav_chatcss.selectedMemberRoles}>
            <h3>{selectedMember.user_name}'s Roles</h3>

            {Array.isArray(selectedMember.role_ids) && selectedMember.role_ids.length > 0 ? (
              <div className={rightnav_chatcss.rolesList}>
                {getRolesFromIDs(selectedMember.role_ids).map((role, index) => (
                  <span
                    key={index}
                    className={rightnav_chatcss.roleBadge}
                    style={{ backgroundColor: role.color || '#99AAB5' }}
                  >
                    {role.name}
                  </span>
                ))}
                <span
                  className={rightnav_chatcss.roleBadge + ' ' + rightnav_chatcss.addRoleButton}
                  onClick={() => setShowRoleDropdown(prev => !prev)}
                >
                  + Add Role
                </span>
              </div>
            ) : (
              <div className={rightnav_chatcss.noRolesAssigned}>
                <span
                  className={rightnav_chatcss.addRoleButton}
                  onClick={() => setShowRoleDropdown(prev => !prev)}
                >
                  ➕ Add Role
                </span>
              </div>
            )}

            {showRoleDropdown && (
              <div className={rightnav_chatcss.roleDropdown}>
                {roles.map(role => (
                  <div
                    key={role.id}
                    className={rightnav_chatcss.roleDropdownItem}
                    style={{ borderLeft: `5px solid ${role.color}` }}
                    onClick={() => handleAssignRole(role.id)}
                  >
                    {role.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}