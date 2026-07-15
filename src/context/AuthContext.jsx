import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as authApi from "../api/auth.js";
import { getToken, setToken } from "../api/client.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fixed: Proper cleanup and error handling
  useEffect(() => {
    let isMounted = true;
    
    const loadUser = async () => {
      try {
        if (!getToken()) {
          if (isMounted) setLoading(false);
          return;
        }
        
        const userData = await authApi.me();
        if (isMounted) {
          setUser(userData);
          setError(null);
        }
      } catch (err) {
        console.error('Auth loading error:', err);
        if (isMounted) {
          setToken(null); // Clear invalid token
          setUser(null);
          setError('Session expired. Please login again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUser();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (username, password) => {
    setError(null);
    try {
      const res = await authApi.login(username, password);
      // Ensure we have user data
      const userData = res.user || await authApi.me();
      setUser(userData);
      return res;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setUser(null);
      throw err; // Re-throw so the component can handle it
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    try {
      await authApi.register(payload);
      // Auto sign-in after register
      const res = await authApi.login(payload.username, payload.password);
      const userData = res.user || await authApi.me();
      setUser(userData);
      return res;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
      setUser(null);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setError(null);
    try {
      await authApi.logout();
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear user state even if API fails
      setUser(null);
      setToken(null);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ 
      user, 
      loading, 
      error, 
      login, 
      register, 
      logout,
      clearError,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthCtx.Provider>
  );
}