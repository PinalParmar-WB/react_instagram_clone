import api from "./axios";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../store/authSlice";

export const loginUser = async (dispatch, credentials) => {
  try {
    dispatch(loginStart());

    const res = await api.post("/users/login", credentials);
    console.log("Login Response:", res);
    const { user, accessToken } = res.data;

    // 💾 Save to localStorage
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(user));

    dispatch(
      loginSuccess({
        user,
        token: accessToken,
      })
    );
  } catch (err) {
    console.log("Login Error:", err);
    console.error(err);
    dispatch(loginFailure());
  }
};
