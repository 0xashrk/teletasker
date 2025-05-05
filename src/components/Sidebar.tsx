import React from 'react';
import styles from './Overview.module.css'; // Reusing the same styles for now

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
  return (
    <div className={styles.sidebar}>
      <div className={styles.navigation}>
        <div 
          className={`${styles.navItem} ${!selectedChatId ? styles.active : ''}`}
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
          >
            +
          </button>
        </div>
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
          >
            <div 
              className={styles.chatContent}
              onClick={() => onSelectChat(chat.id === selectedChatId ? null : chat.id)}
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
    </div>
  );
};

export default Sidebar; 