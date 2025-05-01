import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { tokenExpiredEmitter, TOKEN_EXPIRED_EVENT } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
  authToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login: privyLogin, logout: privyLogout, authenticated, getAccessToken } = usePrivy();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchAndSetToken = useCallback(async () => {
    if (!authenticated) return null;
    try {
      const token = await getAccessToken();
      setAuthToken(token);
      localStorage.setItem('auth_token', token as string);
      return token;
    } catch (error) {
      console.error('Error refreshing auth token:', error);
      setAuthToken(null);
      localStorage.removeItem('auth_token');
      return null;
    }
  }, [authenticated, getAccessToken]);

  const getAuthToken = useCallback(async () => {
    if (!authenticated) return null;
    if (authToken) return authToken;
    return fetchAndSetToken();
  }, [authenticated, authToken, fetchAndSetToken]);

  // Set up token management
  useEffect(() => {
    if (authenticated) {
      fetchAndSetToken();
    } else {
      setAuthToken(null);
      localStorage.removeItem('auth_token');
    }
  }, [authenticated, fetchAndSetToken]);

  // Handle token expiry
  useEffect(() => {
    const handleTokenExpired = async () => {
      await fetchAndSetToken();
    };

    tokenExpiredEmitter.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    return () => {
      tokenExpiredEmitter.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, [fetchAndSetToken]);

  useEffect(() => {
    setIsAuthenticated(authenticated);
  }, [authenticated]);

  const logout = () => {
    privyLogout();
    setAuthToken(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login: privyLogin,
      logout,
      getAuthToken,
      authToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 