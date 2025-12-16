import { createSlice } from "@reduxjs/toolkit";

// 1. Get data from localStorage immediately when the app starts
const storedUser = localStorage.getItem("user");
const storedToken = localStorage.getItem("accessToken");

const initialState = {
  // If data exists in localStorage, parse it. Otherwise, set to null.
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedToken ? storedToken : null,
  userProfile: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            localStorage.setItem('user', JSON.stringify(action.payload.user));
            localStorage.setItem('accessToken', action.payload.accessToken);
        },
        removeUser: (state) => {
            state.user = null;
            state.accessToken = null;
            state.userProfile = null;
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");
        },
        setUserProfile: (state, action) => {
            state.userProfile = action.payload;
        }
    },
});

export const { setUser, removeUser, setUserProfile } = authSlice.actions;
export default authSlice.reducer;