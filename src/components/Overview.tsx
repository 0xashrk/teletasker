import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Overview.module.css';
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';
import AssistantModeConfig from './AssistantModeConfig';
import { ChatConfig } from '../hooks/useChatSelection';
import Sidebar from './Sidebar';
import ChatSelectionModal from './ChatSelectionModal';
import CopyTasksButton from './CopyTasksButton';
import { 
  ChatTask, 
  ChatProcessingStatus,
  getChatProcessingStatus,
  getChatTasks,
  ChatInfo
} from '../services/api';

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
const mapApiTasksToTasks = (apiTasks: ChatTask[], chatId: string): Task[] => {
  if (!apiTasks || !Array.isArray(apiTasks)) {
    console.error('Invalid API tasks data:', apiTasks);
    return [];
  }
  
  return apiTasks.map(task => {
    // Safely extract data with fallbacks
    const id = task.id?.toString() || Math.random().toString(36).substring(2, 10);
    
    return {
      id,
      chatId: chatId.toString(),
      text: task.description || 'No task description',
      source: task.priority || 'Unknown',
      time: task.created_at ? new Date(task.created_at).toLocaleString() : 'Unknown time',
      status: task.completed ? 'completed' : 'pending',
      extractedFrom: task.reasoning || 'No source message'
    };
  });
};

// Chat status cache object with lastChecked timestamp
interface ChatStatusCache {
  chatId: string;
  status: ChatProcessingStatus | null;
  lastChecked: number;
  tasks: Task[];
  isPolling: boolean;
  error: string | null;
}

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
  
  // State for chats, tasks and processing status
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for chat status and tasks
  const [chatStatusCache, setChatStatusCache] = useState<Record<string, ChatStatusCache>>({});
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  
  // Polling timeouts ref
  const pollingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  
  // Animation state for smooth transitions
  const [animate, setAnimate] = useState(true);
  const [fadeKey, setFadeKey] = useState(selectedChatId || 'all');
  const [previousTasks, setPreviousTasks] = useState<Task[]>([]);
  
  // Update the fadeKey when selectedChatId changes to trigger animation
  useEffect(() => {
    setFadeKey(selectedChatId || 'all');
    setAnimate(true); // Enable animation when chat changes
    
    // Disable animation after it plays
    const timer = setTimeout(() => {
      setAnimate(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedChatId]);
  
  // Track which tasks are new when data refreshes
  useEffect(() => {
    setPreviousTasks(tasks);
  }, [tasks]);
  
  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      // Clear all polling timeouts
      Object.values(pollingTimeouts.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);
  
  // Get the currently selected chat
  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  // Initialize chat in cache if needed
  const initializeChatInCache = useCallback((chatId: string) => {
    setChatStatusCache(prev => {
      if (prev[chatId]) {
        // Already exists
        return prev;
      }
      
      // Create new entry
      return {
        ...prev,
        [chatId]: {
          chatId,
          status: null,
          lastChecked: 0,
          tasks: [],
          isPolling: false,
          error: null
        }
      };
    });
  }, []);

  // Fetch chat status directly
  const fetchChatStatus = useCallback(async (chatId: string) => {
    initializeChatInCache(chatId);
    
    // Mark as loading
    setChatStatusCache(prev => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        isPolling: true
      }
    }));
    
    try {
      // Fetch status directly
      const status = await getChatProcessingStatus(chatId);
      const now = Date.now();
      
      // Check if we already have tasks
      const existingTasks = chatStatusCache[chatId]?.tasks || [];
      
      // Update cache
      setChatStatusCache(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          status,
          lastChecked: now,
          error: null,
          isPolling: status.status === 'processing' // Keep polling if processing
        }
      }));
      
      if (status.status === 'completed' && existingTasks.length === 0) {
        // If completed and no tasks, fetch tasks
        fetchChatTasks(chatId);
      } else if (status.status === 'processing') {
        // If processing, schedule next poll
        scheduleNextPoll(chatId);
      }
      
      // Update global lastFetchTime
      setLastFetchTime(now);
    } catch (error: any) {
      console.error(`Error fetching status for chat ${chatId}:`, error);
      
      // Update cache with error
      setChatStatusCache(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          error: `Failed to fetch status: ${error.message || 'Unknown error'}`,
          isPolling: false // Stop polling on error
        }
      }));
    }
  }, [chatStatusCache, initializeChatInCache]);

  // Fetch chat tasks directly
  const fetchChatTasks = useCallback(async (chatId: string) => {
    initializeChatInCache(chatId);
    
    // Mark as loading
    setChatStatusCache(prev => ({
      ...prev,
      [chatId]: {
        ...prev[chatId],
        isPolling: true
      }
    }));
    
    try {
      // Fetch tasks directly
      const apiTasks = await getChatTasks(chatId);
      
      // Convert to our format
      const chatTasks = mapApiTasksToTasks(apiTasks, chatId);
      const now = Date.now();
      
      // Update cache with tasks
      setChatStatusCache(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          tasks: chatTasks,
          lastChecked: now,
          isPolling: false, // Stop polling
          error: null
        }
      }));
      
      // Update tasks state for UI
      setTasks(prev => {
        // Remove any existing tasks for this chat
        const filteredTasks = prev.filter(task => task.chatId !== chatId);
        // Add new tasks
        return [...filteredTasks, ...chatTasks];
      });
      
      // Update global lastFetchTime
      setLastFetchTime(now);
    } catch (error: any) {
      console.error(`Error fetching tasks for chat ${chatId}:`, error);
      
      // Update cache with error
      setChatStatusCache(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          error: `Failed to fetch tasks: ${error.message || 'Unknown error'}`,
          isPolling: false // Stop polling on error
        }
      }));
    }
  }, [initializeChatInCache]);

  // Schedule next poll for a chat
  const scheduleNextPoll = useCallback((chatId: string) => {
    // Clear any existing timeout
    if (pollingTimeouts.current[chatId]) {
      clearTimeout(pollingTimeouts.current[chatId]);
    }
    
    // Only poll if chat is marked for polling
    if (!chatStatusCache[chatId]?.isPolling) {
      return;
    }
    
    // Set timeout for next poll (3 seconds)
    pollingTimeouts.current[chatId] = setTimeout(() => {
      fetchChatStatus(chatId);
    }, 3000);
  }, [chatStatusCache, fetchChatStatus]);

  // Start polling for a chat
  const startPollingChat = useCallback((chatId: string) => {
    if (!chatId) return;
    
    const cache = chatStatusCache[chatId];
    
    // If already polling or completed, don't start again
    if (cache?.isPolling || (cache?.status?.status === 'completed' && cache?.tasks.length > 0)) {
      return;
    }
    
    // Fetch status which will trigger polling if needed
    fetchChatStatus(chatId);
  }, [chatStatusCache, fetchChatStatus]);

  // Handle newly added chats
  useEffect(() => {
    // For each chat in chats list, initialize in cache
    chats.forEach(chat => {
      initializeChatInCache(chat.id);
      
      // If we haven't checked this chat's status recently, do it now
      const cache = chatStatusCache[chat.id];
      const now = Date.now();
      const cacheAge = now - (cache?.lastChecked || 0);
      
      if ((!cache?.lastChecked || cacheAge > 60000) && // Not checked or older than 60 seconds
          (!cache?.tasks.length || !cache?.status)) {  // No tasks or status
        fetchChatStatus(chat.id);
      }
    });
  }, [chats, chatStatusCache, initializeChatInCache, fetchChatStatus]);

  // When a chat is selected, ensure its data is loaded
  useEffect(() => {
    if (selectedChatId) {
      // Initialize if needed
      initializeChatInCache(selectedChatId);
      
      const cache = chatStatusCache[selectedChatId];
      const now = Date.now();
      const cacheAge = now - (cache?.lastChecked || 0);
      
      // If we haven't checked this chat's status recently and no tasks, do it now
      if ((!cache?.lastChecked || cacheAge > 60000) && // Not checked or older than 60 seconds 
          (!cache?.tasks.length)) {                   // No tasks  
        fetchChatStatus(selectedChatId);
      }
      // If processing, ensure we're polling
      else if (cache?.status?.status === 'processing' && !cache?.isPolling) {
        startPollingChat(selectedChatId);
      }
    }
  }, [selectedChatId, chatStatusCache, initializeChatInCache, fetchChatStatus, startPollingChat]);

  // Update tasks when cache changes
  useEffect(() => {
    // Compile tasks from all chats in cache
    const allTasks: Task[] = [];
    
    Object.values(chatStatusCache).forEach(cache => {
      if (cache.tasks.length > 0) {
        allTasks.push(...cache.tasks);
      }
    });
    
    setTasks(allTasks);
  }, [chatStatusCache]);

  // Handle manual refresh button
  const handleRefresh = useCallback(() => {
    if (selectedChatId) {
      // Just fetch current chat
      fetchChatTasks(selectedChatId);
    } else {
      // Fetch all chats
      setIsLoadingChats(true);
      
      // Create fetch promises for all chats
      const fetchPromises = chats.map(chat => fetchChatTasks(chat.id));
      
      // Wait for all to complete
      Promise.all(fetchPromises)
        .catch(error => {
          console.error('Error refreshing all chats:', error);
          setError('Failed to refresh some chats');
        })
        .finally(() => {
          setIsLoadingChats(false);
        });
    }
  }, [selectedChatId, chats, fetchChatTasks]);

  // Filter content based on selected chat
  const content = useMemo(() => {
    if (selectedChatId && selectedChat) {
      if (selectedChat.mode === 'observe') {
        return tasks.filter(task => task.chatId === selectedChatId);
      } else {
        return messages.filter(msg => msg.chatId === selectedChatId);
      }
    } else {
      return tasks;
    }
  }, [selectedChatId, selectedChat, tasks, messages]);

  // Get the processing status for the selected chat
  const isProcessing = useMemo(() => {
    if (!selectedChatId) return false;
    
    const cache = chatStatusCache[selectedChatId];
    return cache?.status?.status === 'processing';
  }, [selectedChatId, chatStatusCache]);
  
  // Handlers for the chat selection flow
  const handleChatSelectionDone = () => {
    setShowChatSelection(false);
    setShowModeSelection(true);
  };

  const handleModeSelectionDone = () => {
    setShowModeSelection(false);
    
    // Force refresh of all newly added chats
    selectedChats.forEach(chatId => {
      startPollingChat(chatId);
    });
  };
  
  // Improved save configurations handler
  const handleSaveConfigurations = () => {
    setIsSaving(true);
    return onSaveConfigurations()
      .then(() => {
        // After saving, start polling new chats
        selectedChats.forEach(chatId => {
          startPollingChat(chatId);
        });
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

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
            <button
              className={styles.refreshButton}
              onClick={handleRefresh}
              disabled={isLoadingChats}
            >
              Refresh
            </button>
            {(!selectedChat || selectedChat.mode === 'observe') && (
              <CopyTasksButton 
                tasks={tasks}
                selectedChatId={selectedChatId}
              />
            )}
          </div>
        </div>
        
        <div className={styles.contentList}>
          {/* Animated content with key-based transitions */}
          <div 
            key={fadeKey} 
            className={styles.animatedContent}
            data-animate={animate ? "true" : "false"}
          >
            {isLoadingChats ? (
              <div className={styles.loading}>Loading data...</div>
            ) : error ? (
              <div className={styles.error}>
                {error}
                <button 
                  className={styles.retryButton}
                  onClick={handleRefresh}
                >
                  Retry
                </button>
              </div>
            ) : content.length > 0 ? (
              <div className={selectedChat?.mode === 'observe' || !selectedChat ? styles.taskList : styles.messageList}>
                {(selectedChat?.mode === 'observe' || !selectedChat)
                  ? (content as Task[]).map(task => {
                      // Check if this task is new (not in previousTasks)
                      const isNewTask = !previousTasks.some(t => t.id === task.id);
                      
                      return (
                        <div 
                          key={task.id} 
                          className={styles.taskItem}
                          data-new={isNewTask ? "true" : "false"}
                        >
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
                      );
                    })
                  : (content as Message[]).map(message => {
                      // Similar logic for messages
                      return (
                        <div 
                          key={message.id} 
                          className={styles.messageItem}
                          data-new={false} // Add data-new attribute for messages if needed
                        >
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
                      );
                    })
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
                    <p className={styles.processingDetails}>
                      The AI assistant is analyzing messages and extracting tasks.
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
          
          {/* Last updated indicator */}
          {lastFetchTime > 0 && (
            <div className={styles.lastUpdated}>
              Last updated: {new Date(lastFetchTime).toLocaleTimeString()}
              {isProcessing && (
                <span className={styles.pollingIndicator}>
                  {' '}• Updating...
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modals */}
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