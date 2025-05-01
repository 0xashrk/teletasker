import React from 'react';
import styles from './ChatList.module.css';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ChatListProps {
  chats: Chat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChats,
  chatLimit,
  onToggleChat,
}) => {
  return (
    <div className={styles.chatListContainer}>
      <div className={styles.chatList}>
        {chats.map(chat => {
          const selected = selectedChats.includes(chat.id);
          const disabled = !selected && selectedChats.length >= chatLimit;

          return (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => !disabled && onToggleChat(chat.id)}
            >
              <span className={styles.chatAvatar}>{chat.avatar}</span>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                <div className={styles.chatMessage}>{chat.lastMessage}</div>
              </div>
              <div className={styles.chatMeta}>
                <span className={styles.chatTime}>{chat.time}</span>
                {chat.unread > 0 && (
                  <span className={styles.chatUnread}>{chat.unread}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedChats.length >= chatLimit && (
        <div className={styles.betaBanner}>
          <span className={styles.betaTag}>Beta</span>
          <span>Chat selection is limited to 5 during Beta</span>
        </div>
      )}
    </div>
  );
};

export default ChatList; 