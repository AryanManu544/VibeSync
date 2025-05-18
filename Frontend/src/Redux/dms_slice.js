import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [
    { id: 'test', name: 'Test', profile_pic: '', online: false }
  ],
  selectedUser: null,  // add selected user here
};

const dmsSlice = createSlice({
  name: 'direct_messages',
  initialState,
  reducers: {
    setDMs: (state, action) => {
      state.list = action.payload;
    },
    addDM: (state, action) => {
      const exists = state.list.some(dm => dm.id === action.payload.id);
      if (!exists) {
        state.list.push(action.payload);
      }
    },
    clearDMs: (state) => {
      state.list.length = 0;
      state.selectedUser = null;
    },

    // New reducer to set the selected DM user
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },

    // New reducer to clear the selected DM user
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
});

export const { setDMs, addDM, clearDMs, setSelectedUser, clearSelectedUser } = dmsSlice.actions;
export default dmsSlice.reducer;
