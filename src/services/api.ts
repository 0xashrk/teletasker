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
      return error?.response?.status === 401;
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

export const checkUsernameAvailability = async (username: string): Promise<{ taken: boolean }> => {
  try {
    const response = await backendProdApi.get(`/profile/username/check/${username}`);
    return response.data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

export default localApi;
