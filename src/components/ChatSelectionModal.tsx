import React from 'react';
import styles from '../pages/Dashboard.module.css'; // Use the same styles as Dashboard
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';

interface ChatSelectionModalProps {
  chats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
  onContinue: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ChatSelectionModal: React.FC<ChatSelectionModalProps> = ({
  chats,
  selectedChats,
  chatLimit,
  onToggleChat,
  onContinue,
  isLoading = false,
  error = null,
  onRetry = () => {}
}) => {
  // Sort chats by time/date in descending order (newest first)
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = new Date(a.time).getTime();
    const dateB = new Date(b.time).getTime();
    return dateB - dateA;
  });
  
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Select Chats</h2>
      <p className={styles.desc}>
        Choose up to {chatLimit} chats for your AI assistant to manage.
      </p>
      
      {isLoading ? (
        <div className={styles.loading}>Loading your chats...</div>
      ) : error ? (
        <div className={styles.error}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      ) : (
        // Wrap the ChatList in a fixed height container
        <div style={{ maxHeight: '50vh', overflowY: 'auto', marginBottom: '20px' }}>
          <ChatList
            chats={sortedChats}
            selectedChats={selectedChats}
            chatLimit={chatLimit}
            onToggleChat={onToggleChat}
          />
        </div>
      )}
      
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