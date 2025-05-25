import React, { useState } from 'react';
import { X, Shield, Plus, Palette, Check } from 'lucide-react';

export default function ManageRolesPopup({ serverId, roles = [], onClose, onCreateRole }) {
  const [newRole, setNewRole] = useState({
    name: '',
    color: '#5865F2',
    permissions: {
      canDeleteChannels: false,
      canAddChannels: false
    }
  });

  const handleCreateRole = () => {
    if (newRole.name.trim()) {
      onCreateRole(newRole);
      setNewRole({ name: '', color: '#5865F2', permissions: { canDeleteChannels: false, canAddChannels: false } });
    }
  };

  const colorPresets = [
    '#5865F2', '#ED4245', '#FEE75C', '#57F287', 
    '#EB459E', '#FF6B35', '#00D2FF', '#9C59B6'
  ];

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 999999
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '448px',
          background: 'linear-gradient(135deg, #1e293b 0%, #581c87 20%, #1e293b 100%)',
          border: '1px solid rgba(168, 85, 247, 0.2)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          style={{
            background: 'linear-gradient(90deg, #9333ea, #3b82f6)',
            padding: '24px',
            color: 'white'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield style={{ width: '24px', height: '24px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>Manage Roles</h2>
            </div>
            <button 
              onClick={onClose}
              style={{
                padding: '8px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            >
              <X style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Role Name Input */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#d1d5db',
              marginBottom: '8px'
            }}>
              Role Name
            </label>
            <input
              type="text"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              placeholder="Enter role name..."
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(30, 41, 59, 0.5)',
                border: '1px solid rgba(71, 85, 105, 0.5)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#a855f7';
                e.target.style.boxShadow = '0 0 0 2px rgba(168, 85, 247, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(71, 85, 105, 0.5)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Color Selection */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#d1d5db',
              marginBottom: '12px'
            }}>
              <Palette style={{ width: '16px', height: '16px' }} />
              <span>Role Color</span>
            </label>
            
            {/* Color Presets */}
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px', 
              marginBottom: '12px' 
            }}>
              {colorPresets.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewRole({ ...newRole, color })}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border: newRole.color === color ? '2px solid white' : '2px solid #4b5563',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s',
                    boxShadow: newRole.color === color ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {newRole.color === color && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>

            {/* Custom Color Picker */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                value={newRole.color}
                onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                style={{
                  width: '48px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  backgroundColor: 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer'
                }}
              />
              <span style={{ 
                fontSize: '14px', 
                color: '#9ca3af', 
                fontFamily: 'monospace' 
              }}>
                {newRole.color.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Permissions */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block',
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#d1d5db',
              marginBottom: '12px'
            }}>
              Permissions
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'canDeleteChannels', label: 'Can Delete Channels', icon: '🗑️' },
                { key: 'canAddChannels', label: 'Can Add Channels', icon: '➕' }
              ].map(({ key, label, icon }) => (
                <label 
                  key={key} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(30, 41, 59, 0.3)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.5)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(30, 41, 59, 0.3)'}
                >
                  <input
                    type="checkbox"
                    checked={newRole.permissions[key]}
                    onChange={(e) => setNewRole({
                      ...newRole,
                      permissions: {
                        ...newRole.permissions,
                        [key]: e.target.checked
                      }
                    })}
                    style={{
                      width: '20px',
                      height: '20px',
                      accentColor: '#a855f7',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '18px' }}>{icon}</span>
                  <span style={{ color: '#d1d5db', fontWeight: '500' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
            <button
              onClick={handleCreateRole}
              disabled={!newRole.name.trim()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                color: 'white',
                fontWeight: '500',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: !newRole.name.trim() 
                  ? 'linear-gradient(90deg, #6b7280, #6b7280)' 
                  : 'linear-gradient(90deg, #9333ea, #3b82f6)',
                cursor: !newRole.name.trim() ? 'not-allowed' : 'pointer',
                opacity: !newRole.name.trim() ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (newRole.name.trim()) {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.background = 'linear-gradient(90deg, #7c3aed, #2563eb)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                if (newRole.name.trim()) {
                  e.target.style.background = 'linear-gradient(90deg, #9333ea, #3b82f6)';
                }
              }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
              <span>Create Role</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '12px 24px',
                fontWeight: '500',
                borderRadius: '12px',
                backgroundColor: 'rgba(71, 85, 105, 0.5)',
                color: '#d1d5db',
                cursor: 'pointer',
                border: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.7)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.5)'}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Preview */}
        {newRole.name && (
          <div 
            style={{
              margin: '0 24px 24px 24px',
              padding: '16px',
              backgroundColor: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: '12px'
            }}
          >
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginBottom: '8px' 
            }}>
              Preview:
            </div>
            <div 
              style={{ 
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: newRole.color + '20',
                color: newRole.color,
                border: `1px solid ${newRole.color}40`
              }}
            >
              {newRole.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}