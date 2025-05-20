// src/Redux/current_page.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchServerInfo = createAsyncThunk(
  'current_page/fetchServerInfo',
  async (server_id, thunkAPI) => {
    const token = localStorage.getItem('token');
    const res = await fetch(
      `${process.env.REACT_APP_URL}/server_info`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ server_id })
      }
    );
    const data = await res.json();
    if (!res.ok) return thunkAPI.rejectWithValue(data.message);
    return data; 
  }
);

const current_page = createSlice({
  name: 'current_page',
  initialState: {
    page_id:       '',
    page_name:     '',
    members:       [],
    role:          '',
    server_exists: null,
    status:        'idle',
    error:         null
  },
  reducers: {
    change_page_id:   (state, action) => { state.page_id = action.payload; },
    change_page_name: (state, action) => { state.page_name = action.payload; },
    server_role:      (state, action) => { state.role = action.payload; },
    server_existence: (state, action) => { state.server_exists = action.payload; },
    server_members: (state, action) => {
      state.members = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchServerInfo.pending, (state) => {
        state.status = 'loading';
        state.error  = null;
      })
      .addCase(fetchServerInfo.fulfilled, (state, action) => {
        state.status  = 'succeeded';
        state.members = action.payload.users;
      })
      .addCase(fetchServerInfo.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.payload || action.error.message;
      });
  }
});

export const {
  change_page_id,
  change_page_name,
  server_members,
  server_role,
  server_existence
} = current_page.actions;

export default current_page.reducer;