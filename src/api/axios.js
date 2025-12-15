import axios from "axios";
import store from "../store/store";
import { setAccessToken, logout } from "../store/authSlice";

const api = axios.create({
  baseURL: "https://api.freeapi.app/api/v1",
  // baseURL: "http://localhost:8080/api/v1/",
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;