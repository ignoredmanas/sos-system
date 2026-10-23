// src/context/AuthContext.jsx
// Keeps the logged-in user in React state and in localStorage ("user").

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "user";

// Read the saved user from localStorage (returns null if nothing or broken data)
function readStoredUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

// Save the user object in localStorage
function storeUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
  // Start with the user saved in localStorage (if any)
  const [user, setUser] = useState(readStoredUser);

  // Log in with phone and password
  const login = useCallback(async (phone, password) => {
    const data = await loginUser({ phone, password });
    storeUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  // Register a new account. The backend returns the user, so we log in right away.
  const register = useCallback(async (name, phone, email, password) => {
    const body = { name, phone, password };
    // Email is optional, so only send it when the user typed one
    if (email && email.trim() !== "") {
      body.email = email.trim();
    }
    const data = await registerUser(body);
    storeUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  // Log out: clear localStorage and state
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Small hook so components can write: const { user, logout } = useAuth();
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}