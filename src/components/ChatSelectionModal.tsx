import React, { useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './ChatSelectionModal.module.css';
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';

interface ChatSelectionModalProps {
  chats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
  onContinue: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isDismissible?: boolean;
}

const ChatSelectionModal: React.FC<ChatSelectionModalProps> = ({
  chats,
  selectedChats,
  chatLimit,
  onToggleChat,
  onContinue,
  onClose,
  isLoading = false,
  error = null,
  onRetry = () => {},
  isDismissible = false
}) => {
  // Sort chats by time/date in descending order (newest first)
  const sortedChats = [...chats].sort((a, b) => {
    const dateA = new Date(a.time).getTime();
    const dateB = new Date(b.time).getTime();
    return dateB - dateA;
  });
  
  // Handle overlay click only if dismissible and onClose is provided
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (isDismissible && onClose && e.target === e.currentTarget) {
      onClose();
    }
  }, [isDismissible, onClose]);

  const modalContent = (
    <div className={styles.overlay} onClick={handleOverlayClick}>
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
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ChatSelectionModal; 