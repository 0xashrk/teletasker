import { useState, useEffect } from 'react';
import { TelegramChat } from './useTelegramChats';
import { addMonitoredChat, getMonitoredChats, removeMonitoredChat } from '../services/api';

export interface ChatConfig {
  id: string;
  mode: 'observe' | 'automate';
}

interface UseChatSelectionReturn {
  selectedChats: string[];
  chatConfigs: ChatConfig[];
  configuredChats: (TelegramChat & { mode: 'observe' | 'automate' })[];
  handleToggleChat: (id: string) => void;
  handleSetMode: (chatId: string, mode: 'observe' | 'automate') => void;
  saveChatConfigurations: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
}

export const useChatSelection = (
  chats: TelegramChat[],
  chatLimit: number
): UseChatSelectionReturn => {
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [chatConfigs, setChatConfigs] = useState<ChatConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Fetch initial monitored chats on mount
  useEffect(() => {
    const fetchMonitoredChats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const monitoredChats = await getMonitoredChats();
        // Convert the response to our format
        const chatIds = monitoredChats.map(chat => chat.chat_id.toString());
        setSelectedChats(chatIds);
        
        // Set default mode as 'observe' for all monitored chats
        const configs = monitoredChats.map(chat => ({
          id: chat.chat_id.toString(),
          mode: 'observe' as const
        }));
        setChatConfigs(configs);
      } catch (err) {
        console.error('Error fetching monitored chats:', err);
        setError('Failed to fetch monitored chats. Please try again.');
      } finally {
        setIsLoading(false);
        setInitialized(true);
      }
    };

    fetchMonitoredChats();
  }, []);

  // Modified to no longer persist immediately
  const handleToggleChat = (id: string) => {
    if (selectedChats.includes(id)) {
      // Remove chat locally only
      setSelectedChats(selectedChats.filter(cid => cid !== id));
      setChatConfigs(chatConfigs.filter(config => config.id !== id));
    } else if (selectedChats.length < chatLimit) {
      // Add chat locally only
      setSelectedChats([...selectedChats, id]);
    }
  };

  const handleSetMode = (chatId: string, mode: 'observe' | 'automate') => {
    const existingConfig = chatConfigs.find(c => c.id === chatId);
    if (existingConfig) {
      setChatConfigs(chatConfigs.map(c => 
        c.id === chatId ? { ...c, mode } : c
      ));
    } else {
      setChatConfigs([...chatConfigs, { id: chatId, mode }]);
    }
  };

  // New function to persist all changes at once
  const saveChatConfigurations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current monitored chats from backend
      const currentMonitoredChats = await getMonitoredChats();
      const currentIds = currentMonitoredChats.map(chat => chat.chat_id.toString());
      
      // Find chats to add (in selectedChats but not in currentIds)
      const chatsToAdd = selectedChats.filter(id => !currentIds.includes(id));
      
      // Find chats to remove (in currentIds but not in selectedChats)
      const chatsToRemove = currentIds.filter(id => !selectedChats.includes(id));
      
      // Process removals
      for (const chatId of chatsToRemove) {
        await removeMonitoredChat(chatId);
      }
      
      // Process additions
      for (const chatId of chatsToAdd) {
        await addMonitoredChat(chatId);
      }
      
      return;
    } catch (err) {
      console.error('Error saving chat configurations:', err);
      setError('Failed to save chat configurations. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const configuredChats = chats
    .filter(chat => chatConfigs.some(c => c.id === chat.id.toString()))
    .map(chat => ({
      ...chat,
      mode: chatConfigs.find(c => c.id === chat.id.toString())?.mode || 'observe'
    }));

  return {
    selectedChats,
    chatConfigs,
    configuredChats,
    handleToggleChat,
    handleSetMode,
    saveChatConfigurations,
    isLoading,
    error,
    initialized
  };
}; 