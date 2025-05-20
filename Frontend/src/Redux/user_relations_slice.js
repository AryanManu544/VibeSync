import { createSlice } from '@reduxjs/toolkit';

// Helper function to safely normalize incoming request data
const normalizeRequest = (req, type) => {
  if (!req) return null;
  
  if (type === 'incoming') {
    return {
      ...req,
      status: 'incoming',
      // Ensure these fields exist with fallbacks
      username: req.sender_username || req.username || 'Unknown User',
      profile_pic: req.sender_profile_pic || req.profile_pic || '/default-avatar.png',
      id: req.sender_id || req.id || 'unknown-id'
    };
  } else { // outgoing
    return {
      ...req,
      status: 'outgoing',
      // Ensure these fields exist with fallbacks
      username: req.receiver_username || req.username || 'Unknown User',
      profile_pic: req.receiver_profile_pic || req.profile_pic || '/default-avatar.png',
      id: req.receiver_id || req.id || 'unknown-id'
    };
  }
};

export const userRelationsSlice = createSlice({
  name: 'user_relations',
  initialState: {
    incoming_reqs: [],
    outgoing_reqs: [],
    blocked: [],
    friends: [],
    servers: []   
  },
  reducers: {
    setIncomingReqs: (state, action) => {
      // Normalize data to ensure consistent structure
      state.incoming_reqs = Array.isArray(action.payload) 
        ? action.payload.map(req => normalizeRequest(req, 'incoming')).filter(Boolean)
        : [];
    },
    setOutgoingReqs: (state, action) => {
      // Normalize data to ensure consistent structure
      state.outgoing_reqs = Array.isArray(action.payload) 
        ? action.payload.map(req => normalizeRequest(req, 'outgoing')).filter(Boolean)
        : [];
    },
    setBlocked: (state, action) => {
      state.blocked = Array.isArray(action.payload) ? action.payload : [];
    },
    setFriends: (state, action) => {
      state.friends = Array.isArray(action.payload) ? action.payload : [];
    },
    clearRelations: (state) => {
      state.incoming_reqs = [];
      state.outgoing_reqs = [];
      state.blocked = [];
      state.friends = [];
    },
    setServers:(s,a) => { 
      s.servers = a.payload 
    },
  }
});

export const {
  setIncomingReqs,
  setOutgoingReqs,
  setBlocked,
  setFriends,
  clearRelations,
  setServers
} = userRelationsSlice.actions;

export default userRelationsSlice.reducer;