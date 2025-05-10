import { Task } from '../types';

interface CachedData {
  tasks: Task[];
  timestamp: number;
}

const CACHE_PREFIX = 'task_cache_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const getCachedTasks = (chatId: string | null): Task[] | null => {
  try {
    const key = chatId ? `${CACHE_PREFIX}${chatId}` : `${CACHE_PREFIX}all`;
    const cachedData = localStorage.getItem(key);
    
    if (!cachedData) return null;
    
    const { tasks, timestamp }: CachedData = JSON.parse(cachedData);
    
    // Check if cache is still valid
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return tasks;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const setCachedTasks = (tasks: Task[], chatId: string | null): void => {
  try {
    const key = chatId ? `${CACHE_PREFIX}${chatId}` : `${CACHE_PREFIX}all`;
    const data: CachedData = {
      tasks,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearTaskCache = (chatId?: string): void => {
  if (chatId) {
    localStorage.removeItem(`${CACHE_PREFIX}${chatId}`);
  } else {
    // Clear all task caches
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}; 