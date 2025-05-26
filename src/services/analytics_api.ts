import { withRetry } from './api';
import localApi from './api';

export interface UserMetrics {
  user_id: string;
  total_requests: number;
  total_tasks_extracted: number;
  unique_chats_analyzed: number;
  total_messages_analyzed: number;
  user_tier: 'Free' | 'Essential' | 'Pro';
}

/**
 * Get analytics metrics for the current user
 * @returns UserMetrics object containing various usage metrics
 */
export const getUserMetrics = async (): Promise<UserMetrics> => {
  try {
    // Check if auth token exists before making the request
    const token = localStorage.getItem('auth_token');
    if (!token) {
    //   console.error('No authentication token');
    //   throw new Error('Authentication required. Please log in again.');
    }

    // console.log('Fetching user metrics...');
    
    return await withRetry(async () => {
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
      });
      
      const requestPromise = localApi.get('/analytics/metrics');
      
      const response = await Promise.race([requestPromise, timeoutPromise]) as any;
    //   console.log('User metrics fetched successfully:', response.data);
      return response.data;
    });
  } catch (error: any) {
    console.error('Error fetching user metrics:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Authentication expired. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }
    
    throw error;
  }
}; 