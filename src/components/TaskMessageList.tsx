import React from 'react';
import styles from './TaskMessageList.module.css';
import { Task, Message, Chat } from '../types';

interface TaskMessageListProps {
  isLoadingTasks: boolean;
  taskError: string | null;
  content: (Task | Message)[];
  selectedChat: Chat | null;
  isProcessing: boolean;
  fetchTasksForChat: (chatId: string) => void;
}

export const TaskMessageList: React.FC<TaskMessageListProps> = ({
  isLoadingTasks,
  taskError,
  content,
  selectedChat,
  isProcessing,
  fetchTasksForChat,
}) => {
  // Add type guard to help TypeScript understand our type checks
  const isTask = (item: Task | Message): item is Task => {
    return 'source' in item && 'extractedFrom' in item;
  };

  return (
    <div className={styles.contentList}>
      {isLoadingTasks ? (
        <div className={styles.loading}>Loading tasks...</div>
      ) : taskError ? (
        <div className={styles.error}>
          {taskError}
          <button 
            className={styles.retryButton}
            onClick={() => selectedChat?.id && fetchTasksForChat(selectedChat.id)}
          >
            Retry
          </button>
        </div>
      ) : content.length > 0 ? (
        <div className={selectedChat?.mode === 'observe' || !selectedChat ? styles.taskList : styles.messageList}>
          {(selectedChat?.mode === 'observe' || !selectedChat)
            ? content.filter(isTask).map(task => (
                <div key={task.id} className={styles.taskItem}>
                  <div className={styles.taskHeader}>
                    <span className={styles.taskSource}>Priority: {task.source}</span>
                    <span className={styles.taskTime}>{task.time}</span>
                  </div>
                  <div className={styles.taskText}>{task.text}</div>
                  {task.extractedFrom && (
                    <div className={styles.extractedFrom}>
                      <div className={styles.extractedHeader}>Reasoning:</div>
                      <div className={styles.extractedText}>{task.extractedFrom}</div>
                    </div>
                  )}
                  <div className={styles.taskMeta}>
                    <span className={`${styles.taskStatus} ${styles[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))
            : content.filter((item): item is Message => !isTask(item)).map(message => (
                <div key={message.id} className={styles.messageItem}>
                  <div className={styles.messageHeader}>
                    <span className={styles.messageSender}>{message.sender}</span>
                    <span className={styles.messageTime}>{message.time}</span>
                  </div>
                  <div className={styles.messageText}>{message.text}</div>
                  {message.aiResponse && (
                    <div className={styles.aiResponse}>
                      <div className={styles.aiResponseHeader}>
                        <span className={styles.aiIcon}>🤖</span>
                        AI Response
                      </div>
                      <div className={styles.aiResponseText}>{message.aiResponse.text}</div>
                      <div className={styles.aiReasoning}>
                        <div className={styles.reasoningHeader}>Reasoning</div>
                        <div className={styles.reasoningText}>{message.aiResponse.reasoning}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      ) : (
        <div className={styles.emptyState}>
          {isProcessing ? (
            <>
              <span className={styles.emptyStateIcon}>⏳</span>
              <p className={styles.emptyStateText}>
                Processing chat messages... This may take a few moments.
              </p>
            </>
          ) : (
            <>
              <span className={styles.emptyStateIcon}>
                {selectedChat?.mode === 'observe' || !selectedChat ? '📋' : '💬'}
              </span>
              <p className={styles.emptyStateText}>
                {selectedChat 
                  ? selectedChat.mode === 'observe'
                    ? `No tasks extracted yet from ${selectedChat.name}. The AI assistant will analyze messages and extract tasks as they appear.`
                    : `No messages yet from ${selectedChat.name}. The AI assistant will automatically respond when new messages arrive.`
                  : 'No tasks extracted yet. The AI assistant will analyze messages and extract tasks as they appear in your chats.'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}; 