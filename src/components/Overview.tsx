import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  getChatSummaries,
  ChatSummary,
  ChatSummariesResponse,
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
  
  // State for managing cached chat summaries
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
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
  
  // Get the currently selected chat
  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  // Fetch chat summaries - this is now the only data fetching method
  const fetchChatSummaries = useCallback(async (options: {
    refresh?: boolean;
    specificChatIds?: string[];
    page?: number;
    silent?: boolean;
  } = {}) => {
    // Skip fetch if not forced and we've fetched recently (within last 60 seconds)
    const now = Date.now();
    const cacheAge = now - lastFetchTime;
    const isCacheValid = cacheAge < 60000; // 60 seconds

    if (isCacheValid && !options.refresh && chatSummaries.length > 0) {
      console.log('Using cached chat summaries - cache is still fresh');
      
      // If looking for specific chats, check if they're in the cache
      if (options.specificChatIds && options.specificChatIds.length > 0) {
        const allChatIdsInCache = options.specificChatIds.every(id => 
          chatSummaries.some(summary => summary.chat.chat_id.toString() === id)
        );
        
        if (allChatIdsInCache) {
          console.log('All requested chat IDs found in cache');
          return;
        }
        console.log('Some requested chat IDs not in cache, fetching from API');
      } else {
        return; // Use cache for all chats
      }
    }
    
    // Only show loading state if not silent refresh
    if (!options.silent) {
      setIsLoadingChats(true);
      // Only enable animation for explicit (non-silent) refreshes
      if (options.refresh) {
        setAnimate(true);
        // Use requestAnimationFrame for smoother timing
        requestAnimationFrame(() => {
          // Reset animation flag after animation completes
          setTimeout(() => {
            setAnimate(false);
          }, 500);
        });
      }
    }
    setError(null);
    
    // Store current tasks to compare for finding new tasks later
    const currentTasks = [...tasks];
    
    try {
      // Prepare request parameters
      const requestParams: Parameters<typeof getChatSummaries>[0] = {
        include_tasks: true,
        page: options.page || currentPage,
        page_size: 10 // Default page size
      };
      
      // Add specific chat IDs if requested
      if (options.specificChatIds && options.specificChatIds.length > 0) {
        requestParams.chat_ids = options.specificChatIds.map(id => parseInt(id, 10));
      }
      
      // Make the API call
      console.log('Fetching chat summaries with params:', requestParams);
      const response = await getChatSummaries(requestParams);
      
      // Update state with the response
      setChatSummaries(response.chats);
      setLastFetchTime(now);
      setCurrentPage(response.page);
      setHasMore(response.has_more);
      
      // Calculate total pages based on total count and page size
      const calculatedTotalPages = Math.ceil(response.total_count / response.page_size);
      setTotalPages(calculatedTotalPages);
      
      // Extract and map all tasks from all chat summaries
      const allTasks: Task[] = [];
      
      if (response.chats && Array.isArray(response.chats)) {
        response.chats.forEach(chatSummary => {
          if (chatSummary.tasks && Array.isArray(chatSummary.tasks)) {
            const chatId = chatSummary.chat.chat_id.toString();
            const chatTasks = mapApiTasksToTasks(chatSummary.tasks, chatId);
            allTasks.push(...chatTasks);
          }
        });
      }
      
      // Update tasks
      setTasks(allTasks);
      
      console.log(`Loaded ${allTasks.length} tasks from ${response.chats.length} chats`);
    } catch (error: any) {
      console.error('Error fetching chat summaries:', error);
      setError('Failed to load data: ' + (error.message || 'Unknown error'));
    } finally {
      if (!options.silent) {
        setIsLoadingChats(false);
      }
    }
  }, [chatSummaries, currentPage, lastFetchTime, tasks]);

  // Initial data load
  useEffect(() => {
    // Fetch data on initial load
    fetchChatSummaries();
    
    // Set up interval for periodic refresh (every 60 seconds instead of 30)
    const intervalId = setInterval(() => {
      // Skip refresh if already loading data to prevent UI glitches
      if (!isLoadingChats) {
        console.log('Performing periodic data refresh');
        // Use a silent refresh approach that doesn't trigger loading states
        fetchChatSummaries({ refresh: true, silent: true });
      }
    }, 60000); // Increased from 30000 to 60000 ms (1 minute)
    
    return () => clearInterval(intervalId);
  }, [fetchChatSummaries, isLoadingChats]);

  // Handle page change for pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchChatSummaries({ page: newPage, refresh: true });
    }
  };

  // Get chat data from cache by ID
  const getChatFromCache = useCallback((chatId: string) => {
    return chatSummaries.find(summary => summary.chat.chat_id.toString() === chatId);
  }, [chatSummaries]);

  // Get processing status for a chat
  const getChatStatus = useCallback((chatId: string): ChatProcessingStatus | undefined => {
    const chatSummary = getChatFromCache(chatId);
    return chatSummary?.status;
  }, [getChatFromCache]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    if (selectedChatId) {
      // Refresh just the selected chat
      fetchChatSummaries({ 
        specificChatIds: [selectedChatId],
        refresh: true 
      });
    } else {
      // Refresh all chats
      fetchChatSummaries({ refresh: true });
    }
  }, [fetchChatSummaries, selectedChatId]);

  // Get unread task count for a chat

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
    const status = getChatStatus(selectedChatId);
    return status?.status === 'processing';
  }, [selectedChatId, getChatStatus]);
  
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

  // Simple pagination UI component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className={styles.paginationControls}>
        <button 
          className={styles.paginationButton}
          disabled={currentPage <= 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span className={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </span>
        <button 
          className={styles.paginationButton}
          disabled={!hasMore}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    );
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
            {(!selectedChat || selectedChat.mode === 'observe') && (
              <CopyTasksButton 
                tasks={tasks}
                selectedChatId={selectedChatId}
              />
            )}
          </div>
        </div>
        
        {/* Debugging panel - remove this in production */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div style={{ margin: '0 24px', padding: '8px', background: 'rgba(0,0,0,0.1)', fontSize: '12px' }}>
            <div>Last fetched: {new Date(lastFetchTime).toLocaleTimeString() || 'Never'}</div>
            <div>Chats loaded: {chatSummaries.length}</div>
            <div>Tasks loaded: {tasks.length}</div>
            <button 
              onClick={handleRefresh}
              style={{ padding: '4px 8px', margin: '4px 0', fontSize: '12px' }}
            >
              Refresh Data
            </button>
          </div>
        )} */}
        
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
            
            {/* Pagination controls for all tasks view */}
            {!selectedChatId && totalPages > 1 && <PaginationControls />}
          </div>
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