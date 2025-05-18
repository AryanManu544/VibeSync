import { createSlice } from '@reduxjs/toolkit';

const initialState = null; // No active DM initially

const activeDMSlice = createSlice({
  name: 'active_dm',
  initialState,
  reducers: {
    setActiveDM: (_, action) => action.payload, // payload is the active DM object
    clearActiveDM: () => null, // clear active DM
  },
});

export const { setActiveDM, clearActiveDM } = activeDMSlice.actions;
export default activeDMSlice.reducer;