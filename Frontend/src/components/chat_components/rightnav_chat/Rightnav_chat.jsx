// src/components/chat_components/rightnav_chat/Rightnav_chat.jsx
import React, { useState, useEffect } from 'react';
import { useSelector }    from 'react-redux';
import { useParams }      from 'react-router-dom';
import axios              from 'axios';
import rightnav_chatcss   from './rightnav_chat.module.css';

export default function Rightnav_chat() {
  const { server_id } = useParams();
  const API           = process.env.REACT_APP_URL;

  const reduxMembers = useSelector(s => s.current_page.members);
  const members      = Array.isArray(reduxMembers) ? reduxMembers : [];

  const [selectedMember,  setSelectedMember]  = useState(null);
  const [showRoleDropdown,setShowRoleDropdown]= useState(false);
  const [rolesList,       setRolesList]       = useState([]);

  useEffect(() => {
    if (!showRoleDropdown) return;

    (async () => {
      try {
        const { data } = await axios.get(`${API}/get_roles`, { server_id });
        setRolesList(data.roles || []);
        console.log(rolesList)
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    })();
  }, [showRoleDropdown, server_id, API]);

  const getInitials = name => {
    const parts = (name||'').trim().split(' ');
    if (parts.length === 1) return parts[0][0]?.toUpperCase()||'';
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  };

  const openRoleDropdown = () => {
    // reset rolesList if you're re-opening
    setShowRoleDropdown(v => !v);
  };

  const handleAssignRole = async roleId => {
    try {
      await axios.post(`${API}/assign_role`, {
        server_id,
        user_id: selectedMember.user_id,
        role_id: roleId
      });
      setShowRoleDropdown(false);
      alert('Role assigned!');
    } catch (err) {
      console.error('Error assigning role:', err);
      alert('Failed to assign role');
    }
  };

  return (
    <div className={rightnav_chatcss.main_wrap}>
      <div className={rightnav_chatcss.main}>
        <div className={rightnav_chatcss.members_length}>
          ALL MEMBERS — {members.length}
        </div>

        <div className={rightnav_chatcss.members}>
          {members.map(m => (
            <div
              key={m.user_id}
              className={rightnav_chatcss.individual_member}
              onClick={() => {
                setSelectedMember(m);
                setShowRoleDropdown(false);
              }}
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

        {selectedMember && (
          <div className={rightnav_chatcss.selectedMemberRoles}>
            <h3>{selectedMember.user_name}'s Roles</h3>

            <div className={rightnav_chatcss.rolesList}>
              {(selectedMember.role_ids||[]).map(rid => {
                const role = rolesList.find(r => r._id === rid);
                return role ? (
                  <span
                    key={rid}
                    className={rightnav_chatcss.roleBadge}
                    style={{ backgroundColor: role.color }}
                  >
                    {role.role_name}
                  </span>
                ) : null;
              })}

              <span
                className={`${rightnav_chatcss.roleBadge} ${rightnav_chatcss.addRoleButton}`}
                onClick={openRoleDropdown}
              >
                + Add Role
              </span>
            </div>

            {showRoleDropdown && (
              <div className={rightnav_chatcss.roleDropdown}>
                {rolesList.map(r => {
                  const id = r._id;
                  const name = r.role_name;
                  return (
                    <div
                      key={id}
                      className={rightnav_chatcss.roleDropdownItem}
                      style={{ borderLeft: `5px solid ${r.color}` }}
                      onClick={() => handleAssignRole(id)}
                    >
                      {name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}