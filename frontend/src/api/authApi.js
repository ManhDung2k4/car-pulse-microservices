import axios from "axios";

// const API = axios.create({
//   // baseURL: "https://gateway-api-ngbw.onrender.com/api",
//   baseURL: "http://localhost:8080/api",
// });

// SỬA TẠI authApi.js
const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
});

export const registerUser = (data) => API.post("/auth/register", data);

export const loginUser = (data) => API.post("/auth/login", data);

export const getMe = (token) =>
  API.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ✅ USER MANAGEMENT ENDPOINTS
export const getUsers = (page = 0, size = 10, token) =>
  API.get(`/auth/users?page=${page}&size=${size}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const createUser = (data, token) =>
  API.post("/auth/users", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const updateUser = (id, data, token) =>
  API.put(`/auth/users/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const deleteUser = (id, token) =>
  API.delete(`/auth/users/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

// ✅ PROFILE & PASSWORD ENDPOINTS
export const updateProfile = (data, token) =>
  API.put("/auth/profile", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const changePassword = (data, token) =>
  API.post("/auth/change-password", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
