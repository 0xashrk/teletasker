import React from 'react';
import { createPortal } from 'react-dom';
import styles from './ChatSelectionModal.module.css';
import { TelegramChat } from '../hooks/useTelegramChats';

interface ChatSelectionModalProps {
  chats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
  onClose: () => void;
}

const ChatSelectionModal: React.FC<ChatSelectionModalProps> = ({
  chats,
  selectedChats,
  chatLimit,
  onToggleChat,
  onClose
}) => {
  const modalContent = (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Add Chats</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          {chats.map(chat => {
            const isSelected = selectedChats.includes(chat.id);
            const disabled = !isSelected && selectedChats.length >= chatLimit;

            return (
              <div
                key={chat.id}
                className={`${styles.chatItem} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
                onClick={() => !disabled && onToggleChat(chat.id)}
              >
                <span className={styles.chatAvatar}>{chat.avatar}</span>
                <div className={styles.chatInfo}>
                  <div className={styles.chatName}>{chat.name}</div>
                  <div className={styles.chatMessage}>{chat.lastMessage}</div>
                </div>
                <button 
                  className={`${styles.actionButton} ${isSelected ? styles.removeButton : styles.addButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    !disabled && onToggleChat(chat.id);
                  }}
                >
                  {isSelected ? '−' : '+'}
                </button>
              </div>
            );
          })}
        </div>
        <div className={styles.footer}>
          <button className={styles.doneButton} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ChatSelectionModal; 