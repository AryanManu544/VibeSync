import { createSlice } from '@reduxjs/toolkit'

const persisted = (() => {
  try {
    const stored = localStorage.getItem('userProfile');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

export const user_creds = createSlice({
  name: 'user_info',
  initialState: {
    username:    persisted?.username    || '',
    tag:         persisted?.tag         || '',
    profile_pic: persisted?.profile_pic || '',
    id:          persisted?.id          || 0
  },
  reducers: {
    change_username: (state, action) => {
      state.username = action.payload;
      localStorage.setItem('userProfile', JSON.stringify({
        ...persisted,
        username: action.payload,
        tag: state.tag,
        profile_pic: state.profile_pic,
        id: state.id
      }));
    },
    change_tag: (state, action) => {
      state.tag = action.payload;
      localStorage.setItem('userProfile', JSON.stringify({
        ...persisted,
        username: state.username,
        tag: action.payload,
        profile_pic: state.profile_pic,
        id: state.id
      }));
    },
    option_profile_pic: (state, action) => {
      state.profile_pic = action.payload;
      localStorage.setItem('userProfile', JSON.stringify({
        ...persisted,
        username: state.username,
        tag: state.tag,
        profile_pic: action.payload,
        id: state.id
      }));
    },
    option_user_id: (state, action) => {
      state.id = action.payload;
      localStorage.setItem('userProfile', JSON.stringify({
        ...persisted,
        username: state.username,
        tag: state.tag,
        profile_pic: state.profile_pic,
        id: action.payload
      }));
    },
    clearUser: (state) => {
      state.username = '';
      state.tag = '';
      state.profile_pic = '';
      state.id = 0;
      localStorage.removeItem('userProfile');
      localStorage.removeItem('token');
    }
  },
})

export const {
  change_username,
  change_tag,
  option_profile_pic,
  option_user_id,
  clearUser
} = user_creds.actions

export default user_creds.reducer