import { useState, useEffect } from 'react';
import { getTelegramChats } from '../services/api';

export interface TelegramChat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface UseTelegramChatsReturn {
  chats: TelegramChat[];
  isLoadingChats: boolean;
  chatError: string | null;
  refetchChats: () => Promise<void>;
}

export const useTelegramChats = (
  connected: boolean,
  isTelegramConnected: boolean
): UseTelegramChatsReturn => {
  const [chats, setChats] = useState<TelegramChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const fetchChats = async () => {
    if (!connected || !isTelegramConnected) return;
    
    setIsLoadingChats(true);
    setChatError(null);
    
    try {
      const telegramChats = await getTelegramChats();
      const formattedChats = telegramChats.map(chat => ({
        id: chat.id.toString(),
        name: chat.title,
        avatar: chat.type === 'user' ? '👤' : '👥',
        lastMessage: chat.last_message.text || 'No messages',
        time: new Date(chat.last_message.date).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        unread: chat.unread_count
      }));
      setChats(formattedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChatError('Failed to load chats. Please try again.');
    } finally {
      setIsLoadingChats(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [connected, isTelegramConnected]);

  return {
    chats,
    isLoadingChats,
    chatError,
    refetchChats: fetchChats
  };
}; 