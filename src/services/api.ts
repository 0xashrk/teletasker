import axios from 'axios';

import { backOff } from 'exponential-backoff';
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';
const SOCIAL_BACKEND_LEGACY_API_URL = 'https://swipeit-backend-ehfpe8g7a5f7edam.westeurope-01.azurewebsites.net';
const BACKEND_PRODUCTION_API_URL = 'https://swipeit-backend-preprod-avfqggardqazfkdw.westeurope-01.azurewebsites.net'
const BACKEND_DEV_AR_API_URL = 'https://dev-ar-backend-weu-dphyazg4d3fmfpag.westeurope-01.azurewebsites.net'
const SEARCH_PRODUCTION_API_URL = 'https://surf-b6hagnhrezhxedhs.uksouth-01.azurewebsites.net/'
const PORTFOLIO_PNL_URL = "https://gains-bydmcxepbfc0gddw.westeurope-01.azurewebsites.net/"
const SOCIAL_PRODUCTION_API_URL = "https://social-dmfjg7hqebfmb5ct.westeurope-01.azurewebsites.net/"
const SEARCH_DEV_API_URL = 'http://127.0.0.1:8000';


// Get the fixed Bearer token from environment variables
const FIXED_BEARER_TOKEN = process.env.REACT_APP_SWIPE_KEY;

if (!FIXED_BEARER_TOKEN) {
  console.error('Fixed Bearer Token is not set correctly. Please check your .env file.');
}

export const TOKEN_EXPIRED_EVENT = 'token:expired';
export const tokenExpiredEmitter = new EventTarget();

const createApi = (baseURL: string) => axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${FIXED_BEARER_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

const createJwtApi = (baseURL: string) => {
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add request interceptor to always use latest token
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  });

  // Add response interceptor
  api.interceptors.response.use(
    response => response,
    async error => {
      const retryCount = error.config?.retryCount || 0;
      
      if (error.response?.status === 403 && 
          error.response?.data?.detail === "Token has expired" && 
          retryCount < 3) {
        
        // Increment retry count
        error.config.retryCount = retryCount + 1;
        
        // Emit token expired event and wait for new token
        tokenExpiredEmitter.dispatchEvent(new Event(TOKEN_EXPIRED_EVENT));
        
        // Wait a bit for the new token
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Retry the original request (will use latest token from request interceptor)
        return api(error.config);
      }
      return Promise.reject(error);
    }
  );

  return api;
};

const localApi = createJwtApi(API_BASE_URL);
const socialBackendLegacyApi = createApi(SOCIAL_BACKEND_LEGACY_API_URL);
const backendProdApi = createJwtApi(BACKEND_PRODUCTION_API_URL);
const backendDevArApi = createJwtApi(BACKEND_DEV_AR_API_URL);
const searchProdApi = createApi(SEARCH_PRODUCTION_API_URL);
const socialProdApi = createJwtApi(SOCIAL_PRODUCTION_API_URL);
const searchDevApi = createApi(SEARCH_DEV_API_URL);
const portfolioPnLApi = createApi(PORTFOLIO_PNL_URL);

const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> => {
  return backOff(() => operation(), {
    numOfAttempts: maxAttempts,
    startingDelay: 1000,
    timeMultiple: 2,
    retry: (error: any) => {
      if (error?.response?.status === 401) {
        // Trigger token refresh event
        tokenExpiredEmitter.dispatchEvent(new Event(TOKEN_EXPIRED_EVENT));
        return true;
      }
      return false;
    },
  });
};

export const testApiConnection = async () => {
  try {
    return await withRetry(async () => {
      const response = await localApi.get('/api-test');
      return response.data;
    });
  } catch (error: any) {
    console.error('Error testing API connection:', error.response.data);
    throw error;
  }
};

export const sendTelegramVerificationCode = async (phoneNumber: string) => {
  try {
    return await withRetry(async () => {
      const response = await localApi.post('/telethon/auth/send-code', {
        phone_number: phoneNumber
      });
      return response.data;
    });
  } catch (error: any) {
    console.error('Error sending Telegram verification code:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyTelegramCode = async (phoneNumber: string, verificationCode: string) => {
  try {
    return await withRetry(async () => {
      const response = await localApi.post('/telethon/auth/verify', {
        phone_number: phoneNumber,
        verification_code: verificationCode
      });
      return response.data;
    });
  } catch (error: any) {
    console.error('Error verifying Telegram code:', error.response?.data || error.message);
    throw error;
  }
};

interface TelegramAuthStatus {
  logged_in: boolean;
}

export const checkTelegramAuthStatus = async (): Promise<TelegramAuthStatus> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.get('/telethon/auth/status');
      return response.data;
    });
  } catch (error: any) {
    console.error('Error checking Telegram auth status:', error.response?.data || error.message);
    throw error;
  }
};

interface TelegramChat {
  id: number;
  title: string;
  type: string;
  username?: string;
  unread_count: number;
  last_message: {
    text: string;
    date: string;
    is_outgoing: boolean;
  };
}

export const getTelegramChats = async (): Promise<TelegramChat[]> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.get('/telethon/chats');
      return response.data;
    });
  } catch (error: any) {
    console.error('Error fetching Telegram chats:', error.response?.data || error.message);
    throw error;
  }
};

// Add functions for monitored chats
export const addMonitoredChat = async (chatId: string | number): Promise<any> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.post(`/tasks/monitored-chats/${chatId}`);
      return response.data;
    });
  } catch (error: any) {
    console.error('Error adding monitored chat:', error.response?.data || error.message);
    throw error;
  }
};

export const getMonitoredChats = async (): Promise<any[]> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.get('/tasks/monitored-chats');
      return response.data;
    });
  } catch (error: any) {
    console.error('Error getting monitored chats:', error.response?.data || error.message);
    throw error;
  }
};

export const removeMonitoredChat = async (chatId: string | number): Promise<any> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.delete(`/tasks/monitored-chats/${chatId}`);
      return response.data;
    });
  } catch (error: any) {
    console.error('Error removing monitored chat:', error.response?.data || error.message);
    throw error;
  }
};

// Interfaces for chat processing and tasks
export interface ChatProcessingStatus {
  id: number;
  user_id: string;
  chat_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  message_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// Updated to match the actual backend response format
export interface ChatTask {
  id: number;
  user_id: string;
  chat_id: number;
  description: string;
  due_date: string | null;
  priority: string;
  source_message_id: number;
  reasoning: string;
  completed: boolean;
  created_at: string;
}

// Chat processing status endpoint
export const getChatProcessingStatus = async (chatId: string | number): Promise<ChatProcessingStatus> => {
  try {
    return await withRetry(async () => {
      const response = await localApi.get(`/tasks/chat/${chatId}/processing-status`);
      console.log('Processing status response:', response.data);
      return response.data;
    });
  } catch (error: any) {
    console.error('Error fetching chat processing status:', error.response?.data || error.message);
    throw error;
  }
};

// Chat tasks endpoint
export const getChatTasks = async (chatId: string | number): Promise<ChatTask[]> => {
  try {
    return await withRetry(async () => {
      // Using the exact endpoint format from the API documentation
      const response = await localApi.get(`/tasks/chat/${chatId}/tasks`);
      console.log('Raw API response for tasks:', response);
      
      // Check if the data is wrapped in a property
      const tasks = Array.isArray(response.data) 
        ? response.data 
        : (response.data.tasks || response.data.data || []);
      
      return tasks;
    });
  } catch (error: any) {
    console.error('Error fetching chat tasks:', error.response?.data || error.message);
    throw error;
  }
};

// Polling utility for chat processing status
export const pollChatProcessingStatus = async (
  chatId: string | number, 
  onStatusUpdate?: (status: ChatProcessingStatus) => void,
  onComplete?: (tasks: ChatTask[]) => void,
  onError?: (error: any) => void,
  intervalMs: number = 2000,
  maxAttempts: number = 30
): Promise<void> => {
  let attempts = 0;
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      if (onError) onError(new Error('Maximum polling attempts reached'));
      return;
    }
    
    attempts++;
    
    try {
      const status = await getChatProcessingStatus(chatId);
      
      // Call the status update callback if provided
      if (onStatusUpdate) onStatusUpdate(status);
      
      // Check if processing is complete or errored
      if (status.status === 'completed' || status.status === 'error') {
        if (status.status === 'error' && onError) {
          onError(new Error(status.error_message || 'Unknown error during chat processing'));
          return;
        }
        
        // If complete, fetch tasks
        if (onComplete) {
          try {
            const tasks = await getChatTasks(chatId);
            console.log(`Fetched ${tasks.length} tasks for chat ${chatId} after completion`, tasks);
            onComplete(tasks);
          } catch (tasksError) {
            console.error('Error fetching tasks after completion:', tasksError);
            if (onError) onError(tasksError);
          }
        }
        return;
      }
      
      // Continue polling
      setTimeout(poll, intervalMs);
    } catch (error) {
      console.error('Error during polling:', error);
      if (onError) onError(error);
    }
  };
  
  // Start polling
  poll();
};

export default localApi;
