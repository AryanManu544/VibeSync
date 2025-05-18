import { configureStore } from '@reduxjs/toolkit'
import auth from './counterSlice'
import options from './options_slice'
import page from './current_page'
import user_creds from './user_creds_slice'
import direct_messages from './dms_slice'
import active_dm from './active_dm_slice'

// Create the store first and assign it to a variable
const store = configureStore({
  reducer: {
    isauthorized: auth,
    selected_option: options,
    current_page: page,
    user_info: user_creds,
    direct_messages,
    active_dm
  },
})

// For debugging only: expose store globally
window.store = store

// Export store as default export
export default store