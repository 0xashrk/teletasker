import React from 'react';
import styles from '../pages/Dashboard.module.css';

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
  onSelectChat: (chatId: string) => void;
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

  return (
    <div className={styles.overview}>
      <div className={styles.sidebar}>
        <div className={styles.activeChats}>
          <h3 className={styles.sectionTitle}>Active Chats</h3>
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
              onClick={() => onSelectChat(chat.id)}
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
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.taskList}>
          <h3 className={styles.sectionTitle}>
            {selectedChatId 
              ? `Tasks from ${chats.find(c => c.id === selectedChatId)?.name}`
              : 'All Tasks'
            }
          </h3>
          
          {filteredTasks.map(task => (
            <div key={task.id} className={styles.taskItem}>
              <div className={styles.taskContent}>
                <div className={styles.taskHeader}>
                  <span className={styles.taskSource}>
                    <span className={styles.modeIcon}>
                      {task.isAutomated ? '⬡' : '◎'}
                    </span>
                    {task.source}
                  </span>
                </div>
                <div className={styles.taskText}>{task.text}</div>
                <div className={styles.taskMeta}>
                  <span className={styles.taskTime}>{task.time}</span>
                  <span className={`${styles.taskStatus} ${task.isAutomated ? styles.automated : ''}`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredTasks.length === 0 && (
            <div className={styles.taskItem}>
              <div className={styles.taskContent}>
                <div className={styles.taskText} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No tasks yet. The AI assistant will start tracking tasks as they appear in your chats.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview; 