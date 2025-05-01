import axios from 'axios';
import { FeedItem, FeedResponse, Network, ReactionCounts, ReactionResponse, ReferralClaimData, ReferralClaimResponse, ReferralCodeResponse, Token, UserPoints, UserReaction } from '../types/types';
import { UsernameResponse, ProfileUpdateRequest, ProfileUpdateResponse } from './profile/types';
import { UserAnalyticsData, AnalyticsResponse } from './analytics/types';
import { BookmarkFolder, BookmarkCreate, BookmarkUpdate, BookmarkResponse, BookmarkFolderResponse, BookmarkFolderUpdate } from '../types/bookmarkTypes';
import { BirdeyePortfolioResponse, PnLResponse } from '../types/types';
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
      return error?.response?.status === 401;
    },
  });
};

export const testApiConnection = async () => {
  try {
    const response = await socialProdApi.get('/api-test');
    return response.data;
  } catch (error: any) {
    console.error('Error testing API connection:', error.response.data);
    throw error;
  }
};

export const getTokens = async (network: Network): Promise<Token[]> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.get<Token[]>('/products', {
        params: { network }
      });
      return response.data;
    });
  } catch (error) {
    console.error('Error fetching tokens: ', error);
    throw error;
  }
};

export const getTokenOverview = async (contractAddress: string) => {
  try {
    const response = await backendProdApi.get(`/token-overview/${contractAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching token overview:', error);
    throw error;
  }
};

export const getPriceChart = async (timeRange: string, contractAddress: string) => {
  try {
    const response = await backendProdApi.get(`/price-chart/${timeRange}?token_address=${contractAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching price chart data:', error);
    throw error;
  }
};

export const searchToken = async (input: string) => {
  try {
    const response = await searchProdApi.get('/search', {
      params: {
        query_text: input,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error returning search result:', error);
    throw error; // Re-throw to handle in the component
  }
}

// And for suggestions
export const getSuggestions = async (input: string) => {
  try {
    const response = await searchProdApi.get('/search/suggest', {
      params: {
        query_text: input,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }
}

export const getPortfolioTokenDetails = async (contractAddresses: string[]) => {
  try {
    const response = await backendProdApi.post('/products/token-details', {
      contract_addresses: contractAddresses
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio token details:', error);
    throw error;
  }
};

export const getTrendingTokens = async () => {
  try {
    const response = await backendProdApi.get('/api/trending-tokens');
    return response.data;
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    throw error;
  }
};

export const trackUserData = async (data: UserAnalyticsData): Promise<AnalyticsResponse> => {
  try {
    // console.log("Attempting user analytics")
    const response = await backendProdApi.post('/analytics/user/login', data);
    return response.data;
  } catch (error) {
    console.error("Error logging user status:", error);
    throw error;
  }
};

export const getProfileById = async (userId: string): Promise<UsernameResponse> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.get(`/profile/${userId}`);
      return response.data;
    });
  } catch (error) {
    console.error("Error checking username:", error);
    throw error;
  }
};

export const updateProfile = async (data: ProfileUpdateRequest): Promise<ProfileUpdateResponse> => {
  try {
    const response = await backendProdApi.post<ProfileUpdateResponse>('/profile/update', data);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const checkUsernameAvailability = async (username: string): Promise<{ taken: boolean }> => {
  try {
    const response = await backendProdApi.get(`/profile/username/check/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

// Bookmark begins
export const createBookmarkFolder = async (folderData: BookmarkFolder): Promise<BookmarkFolderResponse> => {
  try {
    const response = await backendProdApi.post('/bookmarks/folders', folderData);
    console.log("Created folder data:", response.data)
    return response.data;
  } catch (error) {
    console.error('Error creating bookmark folder:', error);
    throw error;
  }
};

export const getFolders = async (userId: string): Promise<BookmarkFolder[]> => {
  try {
    const response = await backendProdApi.get(`/bookmarks/folders/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmark folders:', error);
    throw error;
  }
};

export const createBookmark = async (bookmarkData: BookmarkCreate): Promise<BookmarkResponse> => {
  try {
    const response = await backendProdApi.post('/bookmarks/create', bookmarkData);
    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error('Error creating bookmark:', error);
    throw error;
  }
};

export const getBookmarks = async (userId: string, folderId?: string): Promise<BookmarkResponse[]> => {
  try {
    const url = `/bookmarks/${userId}${folderId ? `?folder_id=${folderId}` : ''}`;
    const response = await backendProdApi.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw error;
  }
};

export const updateBookmark = async (bookmarkData: BookmarkUpdate): Promise<BookmarkResponse> => {
  try {
    const response = await backendProdApi.patch('/bookmarks/update', bookmarkData);
    return response.data;
  } catch (error) {
    console.error('Error updating bookmark:', error);
    throw error;
  }
};

export const deleteBookmark = async (bookmarkId: string): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await backendProdApi.delete(`/bookmarks/${bookmarkId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
};

export const updateBookmarkFolder = async (folderData: BookmarkFolderUpdate): Promise<BookmarkFolderResponse> => {
  try {
    const response = await backendProdApi.patch('/folders/update', folderData);
    return response.data;
  } catch (error) {
    console.error('Error updating bookmark folder:', error);
    throw error;
  }
};

export const deleteBookmarkFolder = async (folderId: string): Promise<{ success: boolean; data: any }> => {
  try {
    const response = await backendProdApi.delete(`/bookmarks/folders/${folderId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting bookmark folder:', error);
    throw error;
  }
};
// Bookmark end

// Referral starts
export const initiateReferralClaim = async (code: string): Promise<ReferralClaimResponse> => {
  try {
    const response = await backendProdApi.post<ReferralClaimResponse>(`/profile/referral/${code}/initiate`);
    return response.data;
  } catch (error) {
    console.error('Error initiating referral claim:', error);
    throw error;
  }
};

export const generateReferralCode = async (username: string): Promise<ReferralCodeResponse> => {
  try {
    const response = await backendProdApi.post<ReferralCodeResponse>('/profile/referral', {
      username
    });
    // console.log("Referral Response:", response.data)
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Username not found');
    } else if (error.response?.status === 400) {
      throw new Error('Invalid username format');
    } else {
      console.error('Error generating referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }
};

export const completeReferralClaim = async (code: string, data: ReferralClaimData): Promise<ReferralClaimResponse> => {
  try {
    return await withRetry(async () => {
      const response = await backendProdApi.post<ReferralClaimResponse>(`/profile/referral/${code}/complete`, data);
      return response.data;
    });
  } catch (error) {
    console.error('Error completing referral claim:', error);
    throw error;
  }
};
// Referral end

export const getBirdeyeSearch = async (keyword: string) => {
  try {
    const response = await searchProdApi.get('/search/birdeye', {
      params: {
        keyword,
        limit: 5
      }
    });
    // Extract and return only the result array from the nested response
    console.log("Bird eye:", response.data?.data?.items?.[0]?.result || [])
    return response.data?.data?.items?.[0]?.result || [];
  } catch (error) {
    console.error('Error fetching Birdeye search results:', error);
    throw error;
  }
};

export const getBirdeyePortfolio = async (walletAddress: string): Promise<BirdeyePortfolioResponse> => {
  try {
    const response = await portfolioPnLApi.get<BirdeyePortfolioResponse>(`/portfolio/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Birdeye portfolio:', error);
    throw error;
  }
};

export const getWalletPnL = async (walletAddress: string): Promise<PnLResponse> => {
  try {
    const response = await portfolioPnLApi.get<PnLResponse>(`/pnl/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet PnL:', error);
    throw error;
  }
};

// Social

// Social end

// Image types (add these at the top with other type imports)
interface ImageUploadResponse {
  file_path: string;
  url: string;
}

interface FrameCollectionResponse {
  collection_id: string;
  frame_urls: string[];
}

// Image endpoints
export const uploadImage = async (file: File): Promise<ImageUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Override the default application/json content type for file upload
    const response = await socialProdApi.post<ImageUploadResponse>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Required for file uploads
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImage = async (filePath: string): Promise<void> => {
  try {
    await socialProdApi.delete(`/images/${filePath}`);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const getMyImages = async (): Promise<string[]> => {
  try {
    const response = await socialProdApi.get<string[]>('/images/my-images');
    return response.data;
  } catch (error) {
    console.error('Error fetching user images:', error);
    throw error;
  }
};

export const uploadFrameCollection = async (
  frames: string[],
  duration: '3s' | '5s' | '15s'
): Promise<FrameCollectionResponse> => {
  try {
    const response = await socialProdApi.post<FrameCollectionResponse>('/images/frames', {
      frames,
      duration
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading frame collection:', error);
    throw error;
  }
};

export const getFeedImages = async (
  page: number = 1, 
  pageSize: number = 10
): Promise<FeedResponse> => {
  try {
    return await withRetry(async () => {
      console.log(`Fetching page ${page} with size ${pageSize}`);
      const response = await socialProdApi.get<FeedResponse>('/feed/images', {
        params: {
          page,
          page_size: pageSize
        }
      });
      // console.log('API Response:', {
      //   itemsCount: response.data.items.length,
      //   totalItems: response.data.total_items,
      //   hasMore: response.data.has_more,
      //   page: response.data.page
      // });
      return response.data;
    });
  } catch (error) {
    console.error('Error fetching feed images:', error);
    throw error;
  }
};
// Social end

// Reactions
export const likeImage = async (imageId: string, viewDuration: number): Promise<ReactionResponse> => {
  try {
    const payload = { view_duration_seconds: viewDuration };
    console.log("likeImage API call payload:", payload);
    
    const response = await socialProdApi.post<ReactionResponse>(
      `/feed/images/${imageId}/like`,
      payload
    );
    
    // Log the actual request that was sent
    console.log("Response:", response);
    return response.data;
  } catch (error) {
    console.error('Error liking image:', error);
    throw error;
  }
};

/**
 * Dislike an image
 */
export const dislikeImage = async (imageId: string, viewDuration: number): Promise<ReactionResponse> => {
  try {
    const response = await socialProdApi.post<ReactionResponse>(
      `/feed/images/${imageId}/dislike`,
      { view_duration_seconds: viewDuration }
    );
    return response.data;
  } catch (error) {
    console.error('Error disliking image:', error);
    throw error;
  }
};

/**
 * Remove reaction from an image
 */
export const removeReaction = async (imageId: string): Promise<ReactionResponse> => {
  try {
    const response = await socialProdApi.delete<ReactionResponse>(
      `/feed/images/${imageId}/reaction`
    );
    return response.data;
  } catch (error) {
    console.error('Error removing reaction:', error);
    throw error;
  }
};

/**
 * Get reaction counts for an image
 */
export const getImageReactions = async (imageId: string): Promise<ReactionCounts> => {
  try {
    const response = await socialProdApi.get<ReactionCounts>(
      `/feed/images/${imageId}/reactions`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting image reactions:', error);
    throw error;
  }
};

/**
 * Get current user's reaction to an image
 */
export const getMyReaction = async (imageId: string): Promise<UserReaction> => {
  try {
    const response = await socialProdApi.get<UserReaction>(
      `/feed/images/${imageId}/my-reaction`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user reaction:', error);
    throw error;
  }
};

// 

// Points
export const getUserPoints = async (): Promise<UserPoints> => {
  try {
    return await withRetry(async () => {
      console.log('Fetching user points');
      const response = await socialProdApi.get<UserPoints>('/points/me');
      // console.log('Points Response:', response.data);
      return response.data;
    });
  } catch (error) {
    console.error('Error fetching user points:', error);
    throw error;
  }
}; 

interface LivePoints extends UserPoints {
  is_live: boolean;
  trend: {
    aura: 'up' | 'down';
    sync: 'up' | 'down';
  };
}

// hooks/usePoints.ts
export const useLivePoints = () => {
  const [points, setPoints] = useState<LivePoints | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLivePoints = async () => {
    try {
      const response = await socialProdApi.get<LivePoints>('/points/me/live');
      setPoints(response.data);
    } catch (err) {
      console.error('Error fetching live points:', err);
      setError('Failed to load points');
    }
  };

  // Fetch real points initially
  useEffect(() => {
    const fetchInitialPoints = async () => {
      setLoading(true);
      await fetchLivePoints();
      setLoading(false);
    };
    fetchInitialPoints();
  }, []);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(fetchLivePoints, 10000); // Every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return { points, loading, error };
};

export default localApi;
