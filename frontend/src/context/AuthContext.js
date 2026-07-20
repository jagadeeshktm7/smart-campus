// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// ── Base URL — points to Render backend ──────────────────────
const API = "https://smart-campus-w54h.onrender.com";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(localStorage.getItem("sc_token"));
  const [loading, setLoading] = useState(true);

  // Set axios default base URL and auth header
  useEffect(() => {
    axios.defaults.baseURL = API;
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Set base URL on first load too
  useEffect(() => {
    axios.defaults.baseURL = API;
  }, []);

  // Load user on mount
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    axios.get("/api/auth/me")
      .then(r => setUser(r.data.user))
      .catch(() => {
        localStorage.removeItem("sc_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const { data } = await axios.post("/api/auth/login", { email, password });
    localStorage.setItem("sc_token", data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("sc_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);