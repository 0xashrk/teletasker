import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Overview.module.css';
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';
import AssistantModeConfig from './AssistantModeConfig';
import { ChatConfig } from '../hooks/useChatSelection';
import Sidebar from './Sidebar';
import ChatSelectionModal from './ChatSelectionModal';
import CopyTasksButton from './CopyTasksButton';
import { getChatTasks, pollChatProcessingStatus, ChatTask, ChatProcessingStatus } from '../services/api';

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
  status: 'pending' | 'completed';
  extractedFrom: string; // The original message text
}

interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: string;
  time: string;
  aiResponse?: {
    text: string;
    reasoning: string;
  };
}

interface OverviewProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onRemoveChat: (chatId: string) => void;
  availableChats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (id: string) => void;
  chatConfigs: ChatConfig[];
  onSetMode: (chatId: string, mode: 'observe' | 'automate') => void;
  onSaveConfigurations: () => Promise<void>;
  isLoading?: boolean;
  removeMonitoredChat: (chatId: string) => Promise<void>;
}

// Helper to convert API tasks to our Task interface
const mapApiTasksToTasks = (apiTasks: ChatTask[]): Task[] => {
  if (!apiTasks || !Array.isArray(apiTasks)) {
    console.error('Invalid API tasks data:', apiTasks);
    return [];
  }
  
  return apiTasks.map(task => {
    // Safely extract data with fallbacks
    const id = task.id?.toString() || Math.random().toString(36).substring(2, 10);
    const chatId = task.chat_id?.toString() || 'unknown';
    
    // For debugging
    console.log('Mapping task:', task);
    
    return {
      id,
      chatId,
      text: task.description || 'No task description',
      source: task.priority || 'Unknown',
      time: task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown time',
      status: task.completed ? 'completed' : 'pending',
      extractedFrom: task.reasoning || 'No source message'
    };
  });
};

const Overview: React.FC<OverviewProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onRemoveChat,
  availableChats,
  selectedChats,
  chatLimit,
  onToggleChat,
  chatConfigs,
  onSetMode,
  onSaveConfigurations,
  isLoading = false,
  removeMonitoredChat,
}) => {
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for tasks and processing status
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingStatuses, setProcessingStatuses] = useState<Record<string, ChatProcessingStatus>>({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  
  // Get the currently selected chat
  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  // Let's debug what's being returned from the API
  useEffect(() => {
    if (tasks.length > 0) {
      console.log('Current tasks:', tasks);
    }
  }, [tasks]);

  // Fetch tasks for a specific chat
  const fetchTasksForChat = useCallback(async (chatId: string) => {
    setIsLoadingTasks(true);
    setTaskError(null);
    
    try {
      const apiTasks = await getChatTasks(chatId);
      console.log('API Tasks received:', apiTasks);
      const mappedTasks = mapApiTasksToTasks(apiTasks);
      console.log('Mapped tasks:', mappedTasks);
      
      setTasks(prevTasks => {
        // Remove existing tasks for this chat
        const otherTasks = prevTasks.filter(task => task.chatId !== chatId);
        // Add new tasks
        return [...otherTasks, ...mappedTasks];
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTaskError('Failed to load tasks. Please try again.');
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  // Start polling for chat status
  const startPollingChatStatus = useCallback((chatId: string) => {
    pollChatProcessingStatus(
      chatId,
      // Status update callback
      (status) => {
        setProcessingStatuses(prev => ({
          ...prev,
          [chatId]: status
        }));
      },
      // Complete callback - fetch tasks
      (tasks) => {
        const mappedTasks = mapApiTasksToTasks(tasks);
        setTasks(prevTasks => {
          // Remove existing tasks for this chat
          const otherTasks = prevTasks.filter(task => task.chatId !== chatId);
          // Add new tasks
          return [...otherTasks, ...mappedTasks];
        });
      },
      // Error callback
      (error) => {
        console.error(`Error polling chat ${chatId}:`, error);
        setTaskError(`Failed to process chat: ${error.message}`);
      }
    );
  }, []);

  // Fetch tasks when the selected chat changes
  useEffect(() => {
    if (selectedChatId && selectedChat?.mode === 'observe') {
      fetchTasksForChat(selectedChatId);
      
      // Check processing status
      startPollingChatStatus(selectedChatId);
    }
  }, [selectedChatId, selectedChat, fetchTasksForChat, startPollingChatStatus]);

  // Select the appropriate content based on the chat mode
  const content = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? tasks.filter(task => task.chatId === selectedChatId)
      : messages.filter(msg => msg.chatId === selectedChatId)
    : tasks;

  // Debug content
  useEffect(() => {
    console.log('Filtered content for display:', content);
    console.log('Selected chat ID:', selectedChatId);
    console.log('All tasks:', tasks);
  }, [content, selectedChatId, tasks]);

  // Handlers for the chat selection flow
  const handleChatSelectionDone = () => {
    setShowChatSelection(false);
    setShowModeSelection(true);
  };

  const handleModeSelectionDone = () => {
    setShowModeSelection(false);
  };
  
  // Improved save configurations handler
  const handleSaveConfigurations = () => {
    setIsSaving(true);
    return onSaveConfigurations()
      .finally(() => {
        setIsSaving(false);
      });
  };

  // Get the processing status for the selected chat
  const selectedChatStatus = selectedChatId ? processingStatuses[selectedChatId] : null;
  const isProcessing = selectedChatStatus?.status === 'processing';

  return (
    <div className={styles.overview}>
      <Sidebar 
        chats={chats}
        selectedChatId={selectedChatId}
        onSelectChat={onSelectChat}
        onRemoveChat={onRemoveChat}
        onAddChat={() => setShowChatSelection(true)}
        tasksCount={tasks.length}
        removeMonitoredChat={removeMonitoredChat}
      />

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>
            {selectedChat ? (
              selectedChat.mode === 'observe' ? (
                <>
                  Tasks from {selectedChat.name} 
                  <span className={styles.count}>({content.length})</span>
                  {isProcessing && <span className={styles.processingStatus}>Processing...</span>}
                </>
              ) : (
                <>Messages from {selectedChat.name} <span className={styles.count}>({content.length})</span></>
              )
            ) : (
              <>All Tasks <span className={styles.count}>({tasks.length})</span></>
            )}
          </h3>
          <div className={styles.headerActions}>
            <CopyTasksButton tasks={tasks} selectedChatId={selectedChatId} />
          </div>
        </div>
        
        {/* Debugging panel - remove this in production */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ margin: '0 24px', padding: '8px', background: 'rgba(0,0,0,0.1)', fontSize: '12px' }}>
            <div>Selected Chat ID: {selectedChatId || 'none'}</div>
            <div>Content Items: {content.length}</div>
            <div>All Tasks: {tasks.length}</div>
            <button 
              onClick={() => selectedChatId && fetchTasksForChat(selectedChatId)}
              style={{ padding: '4px 8px', margin: '4px 0', fontSize: '12px' }}
            >
              Refresh Tasks
            </button>
          </div>
        )}
        
        <div className={styles.contentList}>
          {isLoadingTasks ? (
            <div className={styles.loading}>Loading tasks...</div>
          ) : taskError ? (
            <div className={styles.error}>
              {taskError}
              <button 
                className={styles.retryButton}
                onClick={() => selectedChatId && fetchTasksForChat(selectedChatId)}
              >
                Retry
              </button>
            </div>
          ) : content.length > 0 ? (
            <div className={selectedChat?.mode === 'observe' || !selectedChat ? styles.taskList : styles.messageList}>
              {(selectedChat?.mode === 'observe' || !selectedChat)
                ? (content as Task[]).map(task => (
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
                : (content as Message[]).map(message => (
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
      </div>
      
      {/* Use ChatSelectionModal component instead of inline implementation */}
      {showChatSelection && createPortal(
        <div className={styles.modalOverlay}>
          <ChatSelectionModal
            chats={availableChats}
            selectedChats={selectedChats}
            chatLimit={chatLimit}
            onToggleChat={onToggleChat}
            onContinue={handleChatSelectionDone}
            isLoading={isLoading}
          />
        </div>,
        document.body
      )}

      {/* Mode selection modal */}
      {showModeSelection && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.card}>
            <AssistantModeConfig
              selectedChats={availableChats.filter(chat => selectedChats.includes(chat.id))}
              chatConfigs={chatConfigs}
              onSetMode={onSetMode}
              onStart={handleModeSelectionDone}
              onSaveConfigurations={handleSaveConfigurations}
              isLoading={isLoading || isSaving}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Overview; 