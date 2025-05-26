import React from 'react';
import styles from './Sidebar.module.css';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  mode: 'observe' | 'automate';
}

interface SidebarProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onRemoveChat: (chatId: string) => void;
  onAddChat: () => void;
  tasksCount: number;
  removeMonitoredChat: (chatId: string) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onRemoveChat,
  onAddChat,
  tasksCount,
  removeMonitoredChat,
}) => {
  // Check if we're on mobile
  const isMobile = () => window.innerWidth <= 768;

  const handleChatClick = (chatId: string) => {
    if (isMobile()) {
      // On mobile, always select the chat (don't toggle)
      onSelectChat(chatId);
    } else {
      // On desktop, toggle selection (existing behavior)
      onSelectChat(chatId === selectedChatId ? null : chatId);
    }
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.navigation}>
        <div 
          className={`${styles.navItem} ${!selectedChatId ? styles.active : ''} ${styles.allTasksItem}`}
          onClick={() => onSelectChat(null)}
        >
          <span className={styles.navIcon}>📋</span>
          All Tasks
          <span className={styles.count}>
            ({tasksCount})
          </span>
        </div>
      </div>

      <div className={styles.activeChats}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Active Chats</h3>
          <button 
            className={styles.addButton}
            onClick={onAddChat}
            title="Add more chats"
            aria-label="Add more chats"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 1V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
          >
            <div 
              className={styles.chatContent}
              onClick={() => handleChatClick(chat.id)}
            >
              <span className={styles.chatAvatar}>{chat.avatar}</span>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                <div className={styles.chatMode}>
                  <span className={styles.modeIcon}>
                    {chat.mode === 'observe' ? '📋' : '⚡'}
                  </span>
                  {chat.mode === 'observe' ? 'Task Extraction' : 'Auto Reply'}
                </div>
              </div>
            </div>
            <button
              className={styles.removeButton}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  // First remove from backend
                  await removeMonitoredChat(chat.id);
                  // Then update UI
                  onRemoveChat(chat.id);
                } catch (error) {
                  console.error('Error removing chat:', error);
                }
              }}
              title="Remove chat"
            >
              −
            </button>
          </div>
        ))}
      </div>

      {/* Floating Action Button for Mobile */}
      <button 
        className={styles.floatingAddButton}
        onClick={onAddChat}
        title="Add more chats"
        aria-label="Add more chats"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4 10H16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export default Sidebar; 