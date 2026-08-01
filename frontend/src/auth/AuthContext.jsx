import React, { createContext, useContext, useEffect, useState } from "react";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:8080";
const STORAGE_KEY = "egov_auth_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      if (!token) {
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("session expired");
        const data = await res.json();
        setUser({ id: data.userId, name: data.name });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setChecking(false);
      }
    })();
  }, [token]);

  async function login(identifier, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login failed");
    }
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser({ id: data.userId, name: data.name });
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Read the current token outside of React (used by api/client.js's fetch wrapper). */
export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEY);
}
