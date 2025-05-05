import React from 'react';
import styles from './ChatSelectionModal.module.css'; // We could reuse styles from Overview or create a dedicated file
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';

interface ChatSelectionModalProps {
  chats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
  onContinue: () => void;
  isLoading?: boolean;
}

const ChatSelectionModal: React.FC<ChatSelectionModalProps> = ({
  chats,
  selectedChats,
  chatLimit,
  onToggleChat,
  onContinue,
  isLoading = false
}) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Select Chats</h2>
      <p className={styles.desc}>
        Choose up to {chatLimit} chats for your AI assistant to manage.
      </p>
      <ChatList
        chats={chats}
        selectedChats={selectedChats}
        chatLimit={chatLimit}
        onToggleChat={onToggleChat}
      />
      <button 
        className={styles.button}
        disabled={selectedChats.length === 0 || isLoading}
        onClick={onContinue}
      >
        {selectedChats.length === 0 
          ? 'Select chats to continue' 
          : `Continue with ${selectedChats.length} ${selectedChats.length === 1 ? 'chat' : 'chats'}`}
      </button>
    </div>
  );
};

export default ChatSelectionModal; 