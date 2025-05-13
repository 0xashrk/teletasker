import React, { useState, useEffect, useRef } from 'react';
import styles from './TaskMessageList.module.css';
import { Task, Message, Chat } from '../types';

// Helper function to extract URLs and format them
const extractUrls = (text: string): { url: string; display: string; icon: string }[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  
  return matches.map(url => {
    try {
      const urlObj = new URL(url);
      // Remove 'www.' if present and get the hostname
      let display = urlObj.hostname.replace(/^www\./, '');
      let icon = '🔗';
      
      // If it's a known platform, make it more readable
      if (display.includes('tally.so')) {
        display = 'Form';
        icon = '📝';
      } else if (display.includes('github.com')) {
        display = 'GitHub';
        icon = '🐙';
      } else if (display.includes('notion.so')) {
        display = 'Notion';
        icon = '📔';
      } else if (display.includes('discord.com')) {
        display = 'Discord';
        icon = '💬';
      } else if (display.includes('figma.com')) {
        display = 'Figma';
        icon = '🎨';
      } else if (display.includes('docs.google.com')) {
        display = 'Google Doc';
        icon = '📄';
      } else if (display.includes('sheets.google.com')) {
        display = 'Google Sheet';
        icon = '📊';
      } else if (display.includes('drive.google.com')) {
        display = 'Google Drive';
        icon = '📁';
      } else if (display.includes('youtube.com') || display.includes('youtu.be')) {
        display = 'YouTube';
        icon = '▶️';
      } else if (display.includes('meet.google.com')) {
        display = 'Google Meet';
        icon = '📹';
      } else if (display.includes('calendar.google.com')) {
        display = 'Calendar';
        icon = '📅';
      } else if (display.includes('slack.com')) {
        display = 'Slack';
        icon = '💬';
      } else if (display.includes('zoom.us')) {
        display = 'Zoom';
        icon = '🎥';
      } else {
        // For unknown URLs, show the domain without TLD
        display = display.split('.')[0];
        // Capitalize first letter
        display = display.charAt(0).toUpperCase() + display.slice(1);
      }
      
      return { url, display, icon };
    } catch (e) {
      return { url, display: url, icon: '🔗' };
    }
  });
};

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

  // Keep track of which tasks we've already seen
  const [seenTaskIds, setSeenTaskIds] = useState<Set<string>>(new Set());
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!selectedChat) {
      if (isFirstRender.current) {
        // First render - animate everything
        setVisibleItems(0);
        const timer = setTimeout(() => {
          setVisibleItems(content.length);
          // Mark all current tasks as seen
          setSeenTaskIds(new Set(content.filter(isTask).map(task => task.id)));
        }, 100);
        isFirstRender.current = false;
        return () => clearTimeout(timer);
      } else {
        // Subsequent updates - only animate new tasks
        const currentTasks = content.filter(isTask);
        const newTaskIds = currentTasks
          .filter(task => !seenTaskIds.has(task.id))
          .map(task => task.id);

        if (newTaskIds.length > 0) {
          setSeenTaskIds(prev => new Set([...Array.from(prev), ...newTaskIds]));
        }
        setVisibleItems(content.length);
      }
    } else {
      // Reset for individual chat view
      setVisibleItems(content.length);
      setSeenTaskIds(new Set());
      isFirstRender.current = true;
    }
  }, [content, selectedChat]);

  // Helper to determine if a task should be animated
  const shouldAnimateTask = (taskId: string, index: number): boolean => {
    if (selectedChat) return false;
    return !seenTaskIds.has(taskId) || index >= visibleItems;
  };

  // Helper to get animation delay index
  const getAnimationIndex = (index: number): string => {
    if (index > 9) return "10+";
    return index.toString();
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
            ? content.filter(isTask).map((task, index) => (
                <div 
                  key={task.id} 
                  className={`${styles.taskItem} ${shouldAnimateTask(task.id, index) ? styles.animatedTask : ''}`}
                  data-index={shouldAnimateTask(task.id, index) ? getAnimationIndex(index) : undefined}
                  style={{
                    visibility: !selectedChat && index >= visibleItems ? 'hidden' : 'visible'
                  }}
                >
                  <div className={styles.taskHeader}>
                    <span className={styles.taskSource}>Priority: {task.source}</span>
                    <span className={styles.taskTime}>{task.time}</span>
                  </div>
                  <div className={styles.taskText}>
                    {task.text.split(/(https?:\/\/[^\s]+)/).map((part, index) => {
                      if (part.match(/(https?:\/\/[^\s]+)/)) {
                        const { display, icon, url } = extractUrls(part)[0];
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.linkButton}
                            title={url}
                          >
                            <span className={styles.linkIcon}>{icon}</span>
                            {display}
                          </a>
                        );
                      }
                      // Add a space after the link if the next part starts with a space
                      const nextPart = task.text.split(/(https?:\/\/[^\s]+)/)[index + 1];
                      const needsSpace = nextPart && !nextPart.startsWith(' ');
                      return <span key={index}>{part}{needsSpace ? ' ' : ''}</span>;
                    })}
                  </div>
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