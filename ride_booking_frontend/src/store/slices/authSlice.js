import { createSlice } from '@reduxjs/toolkit';

const initialToken = (() => {
  try {
    return localStorage.getItem('token') || null;
  } catch {
    return null;
  }
})();

const initialState = {
  isAuthenticated: !!initialToken,
  token: initialToken,
  user: initialToken ? { name: 'Rider' } : null,
};

/**
 * PUBLIC_INTERFACE
 * authSlice manages authentication state using a simple token model.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // PUBLIC_INTERFACE
    loginSuccess(state, action) {
      state.isAuthenticated = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      try {
        localStorage.setItem('token', state.token);
      } catch {}
    },
    // PUBLIC_INTERFACE
    logout(state) {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      try {
        localStorage.removeItem('token');
      } catch {}
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
