import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { tokenExpiredEmitter, TOKEN_EXPIRED_EVENT, checkTelegramAuthStatus } from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  getAuthToken: () => Promise<string | null>;
  authToken: string | null;
  isTelegramConnected: boolean;
  telegramPhoneNumber: string | null;
  setTelegramConnected: (phoneNumber: string) => void;
  disconnectTelegram: () => void;
  checkTelegramStatus: () => Promise<void>;
  isCheckingTelegramStatus: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { login: privyLogin, logout: privyLogout, authenticated, getAccessToken } = usePrivy();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [telegramPhoneNumber, setTelegramPhoneNumber] = useState<string | null>(null);
  const [isCheckingTelegramStatus, setIsCheckingTelegramStatus] = useState(true);

  const checkTelegramStatus = useCallback(async () => {
    if (!authenticated) {
      setIsTelegramConnected(false);
      setTelegramPhoneNumber(null);
      return;
    }

    setIsCheckingTelegramStatus(true);
    try {
      const status = await checkTelegramAuthStatus();
      setIsTelegramConnected(status.logged_in);
      
      // Only keep phone number in localStorage if still connected
      if (status.logged_in) {
        const savedPhoneNumber = localStorage.getItem('telegram_phone_number');
        if (savedPhoneNumber) {
          setTelegramPhoneNumber(savedPhoneNumber);
        }
      } else {
        setTelegramPhoneNumber(null);
        localStorage.removeItem('telegram_phone_number');
      }
    } catch (error) {
      console.error('Error checking Telegram status:', error);
      setIsTelegramConnected(false);
      setTelegramPhoneNumber(null);
    } finally {
      setIsCheckingTelegramStatus(false);
    }
  }, [authenticated]);

  // Check Telegram status on mount and when authentication changes
  useEffect(() => {
    checkTelegramStatus();
  }, [authenticated, checkTelegramStatus]);

  const setTelegramConnected = useCallback((phoneNumber: string) => {
    setIsTelegramConnected(true);
    setTelegramPhoneNumber(phoneNumber);
    localStorage.setItem('telegram_phone_number', phoneNumber);
  }, []);

  const disconnectTelegram = useCallback(() => {
    setIsTelegramConnected(false);
    setTelegramPhoneNumber(null);
    localStorage.removeItem('telegram_phone_number');
  }, []);

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

  useEffect(() => {
    if (authenticated) {
      fetchAndSetToken();
    } else {
      setAuthToken(null);
      localStorage.removeItem('auth_token');
    }
  }, [authenticated, fetchAndSetToken]);

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
    disconnectTelegram();
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      login: privyLogin,
      logout,
      getAuthToken,
      authToken,
      isTelegramConnected,
      telegramPhoneNumber,
      setTelegramConnected,
      disconnectTelegram,
      checkTelegramStatus,
      isCheckingTelegramStatus,
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