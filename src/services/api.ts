import axios from 'axios';

import { backOff } from 'exponential-backoff';
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';
const BACKEND_PRODUCTION_API_URL = 'https://prod-backend-teletasker-csb6ggdxcgbvf4d6.westeurope-01.azurewebsites.net';

// const BACKEND_PRODUCTION_API_URL = 'http://127.0.0.1:8000';
// const API_BASE_URL = 'https://prod-backend-teletasker-csb6ggdxcgbvf4d6.westeurope-01.azurewebsites.net';

const SOCIAL_BACKEND_LEGACY_API_URL = 'https://swipeit-backend-ehfpe8g7a5f7edam.westeurope-01.azurewebsites.net';
const BACKEND_DEV_AR_API_URL = 'https://dev-ar-backend-weu-dphyazg4d3fmfpag.westeurope-01.azurewebsites.net'
const SEARCH_PRODUCTION_API_URL = 'https://surf-b6hagnhrezhxedhs.uksouth-01.azurewebsites.net/'
const PORTFOLIO_PNL_URL = "https://gains-bydmcxepbfc0gddw.westeurope-01.azurewebsites.net/"
const SOCIAL_PRODUCTION_API_URL = "https://social-dmfjg7hqebfmb5ct.westeurope-01.azurewebsites.net/"
const SEARCH_DEV_API_URL = 'http://127.0.0.1:8000';

export const TOKEN_EXPIRED_EVENT = 'token:expired';
export const tokenExpiredEmitter = new EventTarget();

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

export const localApi = createJwtApi(API_BASE_URL);
export const backendProdApi = createJwtApi(BACKEND_PRODUCTION_API_URL);
const backendDevArApi = createJwtApi(BACKEND_DEV_AR_API_URL);
const socialProdApi = createJwtApi(SOCIAL_PRODUCTION_API_URL);


export const withRetry = async <T>(
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
      const response = await backendProdApi.get('/api-test');
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
      const response = await backendProdApi.post('/telethon/auth/send-code', {
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
      const response = await backendProdApi.post('/telethon/auth/verify', {
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

export const verifyTelegramPassword = async (phoneNumber: string, password: string) => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.post('/telethon/auth/verify-password', {
        phone_number: phoneNumber,
        password: password
      });
      return response.data;
    });
  } catch (error: any) {
    console.error('Error verifying Telegram password:', error.response?.data || error.message);
    throw error;
  }
};

interface TelegramAuthStatus {
  logged_in: boolean;
}

export const checkTelegramAuthStatus = async (): Promise<TelegramAuthStatus> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.get('/telethon/auth/status');
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
      const response = await backendProdApi.get('/telethon/chats');
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
      const response = await backendProdApi.post(`/tasks/monitored-chats/${chatId}`);
      return response.data;
    });
  } catch (error: any) {
    console.error('Error adding monitored chat:', error.response?.data || error.message);
    throw error;
  }
};

// New bulk function for adding multiple chats at once
export const addMonitoredChats = async (chatIds: (string | number)[]): Promise<any> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.post('/tasks/monitored-chats', {
        chat_ids: chatIds.map(id => typeof id === 'string' ? parseInt(id) : id)
      });
      return response.data;
    });
  } catch (error: any) {
    console.error('Error adding monitored chats:', error.response?.data || error.message);
    throw error;
  }
};

export const getMonitoredChats = async (): Promise<any[]> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.get('/tasks/monitored-chats');
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
      const response = await backendProdApi.delete(`/tasks/monitored-chats/${chatId}`);
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
  message_date: string;
}

// Chat processing status endpoint
export const getChatProcessingStatus = async (chatId: string | number): Promise<ChatProcessingStatus> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.get(`/tasks/chat/${chatId}/processing-status`);
      // console.log('Processing status response:', response.data);
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
      const response = await backendProdApi.get(`/tasks/chat/${chatId}/tasks`);
      // console.log('Raw API response for tasks:', response);
      
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
            // console.log(`Fetched ${tasks.length} tasks for chat ${chatId} after completion`, tasks);
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

/**
 * Update the completed status of a task
 * @param taskId - The ID of the task to update
 * @param completed - The new completed status (true/false)
 * @returns The updated task object
 */
export const updateTaskCompletedStatus = async (taskId: number, completed: boolean): Promise<any> => {
  try {
    const response = await backendProdApi.patch(`/tasks/task/${taskId}/completed`, null, {
      params: { completed }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error updating task completed status:', error.response?.data || error.message);
    throw error;
  }
};

export const useTaskUpdates = () => {
  const [updates, setUpdates] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connectSSE = async () => {
      try {
        // console.log('Initiating SSE connection...');
        
        // Close existing connection if any
        if (eventSource) {
          // console.log('Closing existing connection...');
          eventSource.close();
        }

        // Get the current auth token
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          const error = 'No authentication token available';
          console.error(error);
          setError(error);
          return;
        }

        // Create new EventSource connection with auth token in URL
        const url = new URL(`${BACKEND_PRODUCTION_API_URL}/tasks/updates/stream`);
        url.searchParams.append('token', token);
        
        eventSource = new EventSource(url.toString());

        // Connection opened
        eventSource.onopen = () => {
          // console.log('SSE connection opened successfully');
          setIsConnected(true);
          setError(null);
        };

        // Handle specific event types
        eventSource.addEventListener('update', (event) => {
          try {
            const data = JSON.parse(event.data);
            // Only process new_tasks events
            if (data.type === 'new_tasks') {
              // console.log('New tasks created:', data);
              setUpdates(prev => [...prev, data]);
            }
          } catch (e) {
            console.error('Error parsing update event:', e);
          }
        });

        // Handle ping events silently
        eventSource.addEventListener('ping', () => {
          setIsConnected(true);
        });

        // Handle errors
        eventSource.onerror = (event) => {
          if (eventSource?.readyState === EventSource.CONNECTING) {
            setError('Connecting...');
          } else if (eventSource?.readyState === EventSource.CLOSED) {
            setError('Connection closed');
            setIsConnected(false);
            eventSource.close();
            setTimeout(connectSSE, 5000);
          }
        };

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to establish connection';
        console.error('SSE Connection Error:', errorMsg);
        setError(errorMsg);
        setIsConnected(false);
      }
    };

    // Initial connection
    connectSSE();

    // Listen for token expired events
    const handleTokenExpired = () => {
      setTimeout(connectSSE, 1000);
    };
    tokenExpiredEmitter.addEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
        setIsConnected(false);
      }
      tokenExpiredEmitter.removeEventListener(TOKEN_EXPIRED_EVENT, handleTokenExpired);
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return { updates, error, isConnected };
};

