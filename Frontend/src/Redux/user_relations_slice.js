import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// URL for API
const API_URL = process.env.REACT_APP_URL;

// Async thunk to fetch all user relations
export const fetchUserRelations = createAsyncThunk(
  'user_relations/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/user_relations`, {
        headers: { 'x-auth-token': token }
      });
      const data = await res.json();
      console.log('[fetchUserRelations] got from server →', data);
      if (res.ok) return data;
      return rejectWithValue(data);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Normalizer helper
const normalizeRequest = (req, type) => {
  if (!req) return null;
  if (type === 'incoming') {
    return {
      ...req,
      status: 'incoming',
      username: req.sender_username || req.username || 'Unknown User',
      profile_pic: req.sender_profile_pic || req.profile_pic || '/default-avatar.png',
      id: req.sender_id || req.id || 'unknown-id'
    };
  } else {
    return {
      ...req,
      status: 'outgoing',
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
    servers: [],
    status: 'idle',
    error: null
  },
  reducers: {
    setIncomingReqs: (state, action) => {
      state.incoming_reqs = Array.isArray(action.payload)
        ? action.payload.map(r => normalizeRequest(r, 'incoming')).filter(Boolean)
        : [];
    },
    setOutgoingReqs: (state, action) => {
      state.outgoing_reqs = Array.isArray(action.payload)
        ? action.payload.map(r => normalizeRequest(r, 'outgoing')).filter(Boolean)
        : [];
    },
    setBlocked: (state, action) => {
      state.blocked = Array.isArray(action.payload) ? action.payload : [];
    },
    setFriends: (state, action) => {
      state.friends = Array.isArray(action.payload) ? action.payload : [];
    },
    setServers: (state, action) => {
      state.servers = Array.isArray(action.payload) ? action.payload : [];
    },
    clearRelations: (state) => {
      state.incoming_reqs = [];
      state.outgoing_reqs = [];
      state.blocked = [];
      state.friends = [];
      state.servers = [];
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchUserRelations.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserRelations.fulfilled, (state, { payload }) => {
        state.incoming_reqs = (payload.incoming_reqs || [])
          .map(r => normalizeRequest(r, 'incoming'));
        state.outgoing_reqs = (payload.outgoing_reqs || [])
          .map(r => normalizeRequest(r, 'outgoing'));
        state.blocked = payload.blocked || [];
        state.friends = payload.friends || [];
        state.servers = payload.servers || [];
        state.status = 'succeeded';
      })
      .addCase(fetchUserRelations.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.error = payload;
      });
  }
});

export const {
  setIncomingReqs,
  setOutgoingReqs,
  setBlocked,
  setFriends,
  setServers,
  clearRelations
} = userRelationsSlice.actions;
export default userRelationsSlice.reducer;