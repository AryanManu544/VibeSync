import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import rightnav_chatcss from './rightnav_chat.module.css';

export default function Rightnav_chat() {
  const { server_id } = useParams();
  const API = process.env.REACT_APP_URL;

  const reduxMembers = useSelector(s => s.current_page.members);
  const members = Array.isArray(reduxMembers) ? reduxMembers : [];

  const [selectedMember, setSelectedMember] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [rolesList, setRolesList] = useState([]);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const memberRefs = useRef({});
  const addRoleButtonRef = useRef(null);

  useEffect(() => {
    if (!showRoleDropdown) return;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/get_roles`, {
          params: { server_id }
        });
        setRolesList(data.roles || []);
        console.log(data.roles);
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    })();
  }, [showRoleDropdown, server_id, API]);

  // Close modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close role dropdown if clicking outside
      if (showRoleDropdown && !event.target.closest(`.${rightnav_chatcss.addRoleButton}`) && !event.target.closest(`.${rightnav_chatcss.roleDropdownModal}`)) {
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRoleDropdown]);

  const getInitials = name => {
    const parts = (name || '').trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || '';
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const openRoleDropdown = () => {
    if (addRoleButtonRef.current) {
      const rect = addRoleButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left
      });
    }
    setShowRoleDropdown(v => !v);
  };

  const handleAssignRole = async roleId => {
  try {
    const { data } = await axios.post(`${API}/assign_role`, {
      server_id,
      user_id: selectedMember.user_id,
      role_id: roleId
    });

    // Optional: fetch updated roles from backend again
    // But here we'll just update the selected member locally
    setSelectedMember(prev => ({
      ...prev,
      role_ids: [...(prev.role_ids || []), roleId]
    }));

    setShowRoleDropdown(false);
  } catch (err) {
    console.error('Error assigning role:', err);
    alert('Failed to assign role');
  }
};

  const closeProfile = () => {
    setSelectedMember(null);
    setShowRoleDropdown(false);
  };

  const handleMemberClick = (member) => {
    const memberElement = memberRefs.current[member.user_id];
    if (memberElement) {
      const rect = memberElement.getBoundingClientRect();
      setModalPosition({
        top: rect.top,
        left: rect.left - 420 
      });
    }
    setSelectedMember(member);
    setShowRoleDropdown(false);
  };

  return (
    <>
      <div className={rightnav_chatcss.main_wrap}>
        <div className={rightnav_chatcss.main}>
          <div className={rightnav_chatcss.membersSection}>
            <div className={rightnav_chatcss.members_length}>
              ALL MEMBERS — {members.length}
            </div>

            <div className={rightnav_chatcss.members}>
              {members.map(m => (
                <div
                  key={m.user_id}
                  ref={el => memberRefs.current[m.user_id] = el}
                  className={`${rightnav_chatcss.individual_member} ${
                    selectedMember?.user_id === m.user_id ? rightnav_chatcss.selected : ''
                  }`}
                  onClick={() => handleMemberClick(m)}
                >
                  {m.user_profile_pic
                    ? <img src={m.user_profile_pic} alt="" className={rightnav_chatcss.avatar}/>
                    : <div className={rightnav_chatcss.avatarFallback}>
                        {getInitials(m.user_name)}
                      </div>
                  }
                  <div className={rightnav_chatcss.memberInfo}>
                    <span className={rightnav_chatcss.username}>{m.user_name}</span>
                    <span className={rightnav_chatcss.tag}>#{m.user_tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal positioned to the left of clicked member */}
      {selectedMember && (
        <>
          <div className={rightnav_chatcss.overlay} onClick={closeProfile} />
          <div 
            className={rightnav_chatcss.profileModal}
            style={{
              top: `${modalPosition.top}px`,
              left: `${modalPosition.left}px`,
              transform: 'none'
            }}
          >
            <div className={rightnav_chatcss.selectedMemberRoles}>
              {/* Close button */}
              <button 
                className={rightnav_chatcss.closeButton}
                onClick={closeProfile}
              >
                ×
              </button>

              {/* Member Header with Avatar and Info */}
              <div className={rightnav_chatcss.memberHeader}>
                {selectedMember.user_profile_pic ? (
                  <img 
                    src={selectedMember.user_profile_pic} 
                    alt="" 
                    className={rightnav_chatcss.memberHeaderAvatar}
                  />
                ) : (
                  <div className={rightnav_chatcss.memberHeaderAvatarFallback}>
                    {getInitials(selectedMember.user_name)}
                  </div>
                )}
                
                <div className={rightnav_chatcss.memberHeaderInfo}>
                  <h2 className={rightnav_chatcss.memberHeaderName}>
                    {selectedMember.user_name}
                  </h2>
                  <div className={rightnav_chatcss.memberHeaderTag}>
                    #{selectedMember.user_tag}
                  </div>
                </div>
              </div>

              {/* Roles Section */}
              <div className={rightnav_chatcss.rolesSection}>
                <div className={rightnav_chatcss.rolesSectionTitle}>
                  Roles — {(selectedMember.role_ids || []).length}
                </div>

                <div className={rightnav_chatcss.rolesList}>
                  {(selectedMember.role_ids || []).map(rid => {
                    const role = rolesList.find(r => r._id === rid);
                    return role ? (
                      <span
                        key={rid}
                        className={rightnav_chatcss.roleBadge}
                        style={{ backgroundColor: role.color }}
                      >
                        {role.name}
                      </span>
                    ) : null;
                  })}

                  <span
                    ref={addRoleButtonRef}
                    className={`${rightnav_chatcss.roleBadge} ${rightnav_chatcss.addRoleButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openRoleDropdown();
                    }}
                  >
                    + Add Role
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Dropdown Modal - Separate modal */}
      {showRoleDropdown && (
        <>
          <div className={rightnav_chatcss.dropdownOverlay} onClick={() => setShowRoleDropdown(false)} />
          <div 
            className={rightnav_chatcss.roleDropdownModal}
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`
            }}
          >
            {rolesList.map(r => {
              const id = r._id;
              const name = r.name;
              const isAssigned = (selectedMember?.role_ids || []).includes(id);
              
              return (
                <div
                  key={id}
                  className={`${rightnav_chatcss.roleDropdownItem} ${isAssigned ? rightnav_chatcss.assignedRole : ''}`}
                  style={{ borderLeft: `4px solid ${r.color}` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAssigned) {
                      handleAssignRole(id);
                    }
                  }}
                >
                  <span className={rightnav_chatcss.roleName}>{name}</span>
                  {isAssigned && (
                    <span className={rightnav_chatcss.assignedIndicator}>✓</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}