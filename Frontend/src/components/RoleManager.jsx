import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import './RoleManager.css'; // You can style this as needed
const url = process.env.REACT_APP_URL;

function RoleManager() {
  const server_id = useSelector(state => state.current_page.server_id); // make sure this exists
  const [roles, setRoles] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [server_id]);

  const fetchRoles = async () => {
    const res = await fetch(`${url}/get_roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ server_id })
    });
    const data = await res.json();
    if (res.ok) setRoles(data.roles);
  };

  const fetchUsers = async () => {
    const res = await fetch(`${url}/get_server_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ server_id })
    });
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) return;
    const res = await fetch(`${url}/add_role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ server_id, role: newRole.trim() })
    });
    const data = await res.json();
    if (res.ok) {
      setNewRole('');
      fetchRoles();
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) return;
    const res = await fetch(`${url}/assign_role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ server_id, user_id: selectedUserId, role: selectedRole })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Role assigned");
      fetchUsers();
    }
  };

  const handleRemoveRole = async (user_id) => {
    if (!window.confirm('Remove role from this user?')) return;
    const res = await fetch(`${url}/remove_role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': localStorage.getItem('token')
      },
      body: JSON.stringify({ server_id, user_id })
    });
    const data = await res.json();
    if (res.ok) fetchUsers();
  };

  return (
    <div className="role-manager">
      <h2>Server Role Management</h2>

      <div className="create-role">
        <input
          type="text"
          value={newRole}
          onChange={e => setNewRole(e.target.value)}
          placeholder="New role name"
        />
        <button onClick={handleAddRole}>Add Role</button>
      </div>

      <div className="role-list">
        <h3>Existing Roles</h3>
        <ul>
          {roles.map((role, idx) => (
            <li key={idx}>{role}</li>
          ))}
        </ul>
      </div>

      <div className="assign-role">
        <h3>Assign Role to User</h3>
        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
          <option value="">Select user</option>
          {users.map(user => (
            <option key={user.user_id} value={user.user_id}>
              {user.user_name}#{user.user_tag}
            </option>
          ))}
        </select>

        <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
          <option value="">Select role</option>
          {roles.map((role, idx) => (
            <option key={idx} value={role}>{role}</option>
          ))}
        </select>

        <button onClick={handleAssignRole}>Assign</button>
      </div>

      <div className="user-role-table">
        <h3>Server Members & Roles</h3>
        <ul>
          {users.map(user => (
            <li key={user.user_id}>
              {user.user_name}#{user.user_tag} — {user.user_role || 'No role'}
              {user.user_role && (
                <button onClick={() => handleRemoveRole(user.user_id)} style={{ marginLeft: '1rem' }}>
                  Remove Role
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default RoleManager;