import React from 'react';
import styles from './Overview.module.css';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  mode: 'observe' | 'automate';
}

interface Task {
  id: string;
  chatId: string;
  text: string;
  source: string;
  time: string;
  status: 'pending' | 'automated' | 'completed';
  isAutomated: boolean;
}

interface OverviewProps {
  chats: Chat[];
  tasks: Task[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
}

const Overview: React.FC<OverviewProps> = ({
  chats,
  tasks,
  selectedChatId,
  onSelectChat,
}) => {
  const filteredTasks = selectedChatId 
    ? tasks.filter(task => task.chatId === selectedChatId)
    : tasks;

  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  const renderTaskStatus = (task: Task) => {
    const statusClass = task.status === 'automated' 
      ? styles.automated 
      : task.status === 'completed' 
        ? styles.completed 
        : styles.pending;

    return (
      <span className={`${styles.taskStatus} ${statusClass}`}>
        {task.status}
      </span>
    );
  };

  return (
    <div className={styles.overview}>
      <div className={styles.sidebar}>
        <div className={styles.navigation}>
          <div 
            className={`${styles.navItem} ${!selectedChatId ? styles.active : ''}`}
            onClick={() => onSelectChat(null)}
          >
            <span className={styles.navIcon}>📋</span>
            All Tasks
            <span className={styles.taskCount}>({tasks.length})</span>
          </div>
        </div>

        <div className={styles.activeChats}>
          <h3 className={styles.sectionTitle}>Active Chats</h3>
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
              onClick={() => onSelectChat(chat.id === selectedChatId ? null : chat.id)}
            >
              <span className={styles.chatAvatar}>{chat.avatar}</span>
              <div className={styles.chatInfo}>
                <div className={styles.chatName}>{chat.name}</div>
                <div className={styles.chatMode}>
                  <span className={styles.modeIcon}>
                    {chat.mode === 'observe' ? '◎' : '⬡'}
                  </span>
                  {chat.mode === 'observe' ? 'Track Mode' : 'Auto Mode'}
                </div>
              </div>
              {tasks.filter(t => t.chatId === chat.id).length > 0 && (
                <span className={styles.chatTaskCount}>
                  {tasks.filter(t => t.chatId === chat.id).length}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>
            {selectedChat 
              ? <>Tasks from {selectedChat.name} <span className={styles.taskCount}>({filteredTasks.length})</span></>
              : <>All Tasks <span className={styles.taskCount}>({tasks.length})</span></>
            }
          </h3>
        </div>
        
        <div className={styles.taskList}>
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskHeader}>
                  <span className={styles.taskSource}>
                    <span className={styles.taskSourceIcon}>
                      {task.isAutomated ? '⬡' : '◎'}
                    </span>
                    {task.source}
                  </span>
                </div>
                <div className={styles.taskText}>{task.text}</div>
                <div className={styles.taskMeta}>
                  <span className={styles.taskTime}>{task.time}</span>
                  {renderTaskStatus(task)}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyStateIcon}>📋</span>
              <p className={styles.emptyStateText}>
                {selectedChat 
                  ? `No tasks yet from ${selectedChat.name}. The AI assistant will start tracking tasks as they appear.`
                  : 'No tasks yet. The AI assistant will start tracking tasks as they appear in your chats.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; 