import { useState } from 'react';
import { TelegramChat } from './useTelegramChats';

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
}

export const useChatSelection = (
  chats: TelegramChat[],
  chatLimit: number
): UseChatSelectionReturn => {
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [chatConfigs, setChatConfigs] = useState<ChatConfig[]>([]);

  const handleToggleChat = (id: string) => {
    if (selectedChats.includes(id)) {
      setSelectedChats(selectedChats.filter(cid => cid !== id));
      setChatConfigs(chatConfigs.filter(config => config.id !== id));
    } else if (selectedChats.length < chatLimit) {
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

  const configuredChats = chats
    .filter(chat => chatConfigs.some(c => c.id === chat.id))
    .map(chat => ({
      ...chat,
      mode: chatConfigs.find(c => c.id === chat.id)?.mode || 'observe'
    }));

  return {
    selectedChats,
    chatConfigs,
    configuredChats,
    handleToggleChat,
    handleSetMode,
  };
}; 