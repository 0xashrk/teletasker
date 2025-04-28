import React from 'react';
import './ChatList.css';

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
    <div className="chat-list-container">
      <div className="chat-list">
        {chats.map(chat => {
          const selected = selectedChats.includes(chat.id);
          const disabled = !selected && selectedChats.length >= chatLimit;

          return (
            <div
              key={chat.id}
              className={`chat-item${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
              onClick={() => !disabled && onToggleChat(chat.id)}
            >
              <span className="chat-avatar">{chat.avatar}</span>
              <div className="chat-info">
                <div className="chat-name">{chat.name}</div>
                <div className="chat-message">{chat.lastMessage}</div>
              </div>
              <div className="chat-meta">
                <span className="chat-time">{chat.time}</span>
                {chat.unread > 0 && (
                  <span className="chat-unread">{chat.unread}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedChats.length >= chatLimit && (
        <div className="beta-banner">
          <span className="beta-tag">Beta</span>
          <span>Chat selection is limited to 5 during Beta</span>
        </div>
      )}
    </div>
  );
};

export default ChatList; 