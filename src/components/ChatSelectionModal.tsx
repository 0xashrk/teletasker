import React, { useCallback, useState } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort chats
  const filteredAndSortedChats = [...chats]
    .filter(chat => 
      chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

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
          <>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.chatListWrapper}>
              <ChatList
                chats={filteredAndSortedChats}
                selectedChats={selectedChats}
                chatLimit={chatLimit}
                onToggleChat={onToggleChat}
              />
              {filteredAndSortedChats.length === 0 && searchQuery && (
                <div className={styles.noResults}>
                  No chats found matching "{searchQuery}"
                </div>
              )}
            </div>
          </>
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