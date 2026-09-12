import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("kisan_token"));
  const [user, setUser] = useState(() => localStorage.getItem("kisan_user"));

  const login = useCallback(async (username, password) => {
    username = username.trim();
    const res = await fetch(`${API_BASE}/api/v1/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    localStorage.setItem("kisan_token", data.access_token);
    localStorage.setItem("kisan_user", username);
    setToken(data.access_token);
    setUser(username);
    return data;
  }, []);

  const register = useCallback(async (username, password) => {
    username = username.trim();
    const res = await fetch(`${API_BASE}/api/v1/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    return res.json();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("kisan_token");
    localStorage.removeItem("kisan_user");
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
        throw new Error("Session expired. Please log in again.");
      }
      return res;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider value={{ token, user, login, logout, register, authFetch, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
