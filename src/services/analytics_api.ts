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
    return await withRetry(async () => {
      const response = await localApi.get('/analytics/metrics');
      return response.data;
    });
  } catch (error: any) {
    console.error('Error fetching user metrics:', error.response?.data || error.message);
    throw error;
  }
}; 