import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, saveToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    api("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    function handleLoggedOut() {
      setUser(null);
    }
    window.addEventListener("adme:logged-out", handleLoggedOut);
    return () => window.removeEventListener("adme:logged-out", handleLoggedOut);
  }, []);

  async function login(email, password) {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    saveToken(data.token);
    setUser(data.user);
  }

  async function register(fields) {
    const data = await api("/api/auth/register", { method: "POST", body: fields });
    saveToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  const value = { user, setUser, checking, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
