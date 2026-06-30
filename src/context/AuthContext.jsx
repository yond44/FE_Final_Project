import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!getToken()) return setLoading(false);
      try {
        setUser(await authApi.me());
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    setUser(res.user || (await authApi.me()));
    return res;
  }, []);

  const register = useCallback(async (payload) => {
    await authApi.register(payload);
    // auto sign-in after register
    const res = await authApi.login(payload.username, payload.password);
    setUser(res.user || (await authApi.me()));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
