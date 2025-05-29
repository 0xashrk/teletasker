import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './Overview.module.css';
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';
import { ChatConfig } from '../hooks/useChatSelection';
import Sidebar from './Sidebar';
import ChatSelectionModal from './ChatSelectionModal';
import CopyTasksButton from './CopyTasksButton';
import FilterButton from './FilterButton';
import SortButton from './SortButton';
import { getChatTasks, pollChatProcessingStatus, ChatTask, ChatProcessingStatus, useTaskUpdates } from '../services/api';
import { TaskMessageList } from './TaskMessageList';
import { Chat, Task, Message } from '../types/index';
import { getCachedTasks, setCachedTasks, clearTaskCache } from '../utils/taskCache';
import Notifications from './Notifications';
import UserMenu from './UserMenu';

// Add types for filtering and sorting
type TaskFilter = 'all' | 'completed' | 'pending';
type SortOrder = 'newest' | 'oldest';

interface OverviewProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onRemoveChat: (chatId: string) => void;
  availableChats: TelegramChat[];
  selectedChats: string[];
  chatLimit: number;
  onToggleChat: (chatId: string) => void;
  chatConfigs: ChatConfig[];
  onSetMode: (chatId: string, mode: 'observe' | 'automate') => void;
  setBatchModes: (chatModes: { chatId: string; mode: 'observe' | 'automate' }[]) => void;
  onSaveConfigurations: () => Promise<void>;
  isLoading?: boolean;
  removeMonitoredChat: (chatId: string) => Promise<void>;
  username?: string;
  onLogout?: () => void;
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
    
    // Keep raw dates for sorting
    const createdAtRaw = task.created_at ? new Date(task.created_at) : new Date(0);
    const messageDateRaw = task.message_date ? new Date(task.message_date) : new Date(0);
    
    // Format dates for display
    const createdAt = task.created_at ? createdAtRaw.toLocaleString() : 'Unknown time';
    const messageDate = task.message_date ? messageDateRaw.toLocaleString() : 'Unknown time';
    
    return {
      id,
      chatId,
      text: task.description || 'No task description',
      source: task.priority || 'Unknown',
      time: createdAt,
      messageDate: messageDate,
      // Add raw dates for sorting
      createdAtRaw: createdAtRaw,
      messageDateRaw: messageDateRaw,
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
  setBatchModes,
  onSaveConfigurations,
  isLoading = false,
  removeMonitoredChat,
  username,
  onLogout,
}) => {
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Filter and sort state
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  // Mobile navigation state - start with sidebar visible on mobile
  const [showSidebar, setShowSidebar] = useState(true);

  // Handle window resize to reset mobile navigation state
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowSidebar(true); // Always show sidebar on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // State for tasks and processing status
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [processingStatuses, setProcessingStatuses] = useState<Record<string, ChatProcessingStatus>>({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  
  // Get the currently selected chat
  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId) || null
    : null;

  // Add SSE connection
  const { updates, error: sseError, isConnected } = useTaskUpdates();

  // Mobile navigation handlers
  const handleMobileSelectChat = (chatId: string | null) => {
    onSelectChat(chatId);
    if (chatId) {
      setShowSidebar(false); // Hide sidebar when selecting a chat on mobile
    }
  };

  const handleMobileBackToSidebar = () => {
    setShowSidebar(true);
    // Deselect chat when going back to sidebar on mobile for cleaner UX
    onSelectChat(null);
  };

  // Let's debug what's being returned from the API
  useEffect(() => {
    if (tasks.length > 0) {
      // console.log('Current tasks:', tasks);
    }
  }, [tasks]);

  // Fetch tasks for a specific chat
  const fetchTasksForChat = useCallback(async (chatId: string) => {
    const cachedTasks = getCachedTasks(chatId);
    
    // If we have cached tasks, show them immediately
    if (cachedTasks) {
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.chatId !== chatId);
        return [...otherTasks, ...cachedTasks];
      });
      setIsLoadingTasks(false);
    } else {
      setIsLoadingTasks(true);
    }
    
    try {
      const apiTasks = await getChatTasks(chatId);
      // console.log('API Tasks received:', apiTasks);
      const mappedTasks = mapApiTasksToTasks(apiTasks);
      // console.log('Mapped tasks:', mappedTasks);
      
      setTasks(prevTasks => {
        const otherTasks = prevTasks.filter(task => task.chatId !== chatId);
        const newTasks = [...otherTasks, ...mappedTasks];
        setCachedTasks(mappedTasks, chatId);
        return newTasks;
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      if (!cachedTasks) {
        setTasks(prevTasks => prevTasks.filter(task => task.chatId !== chatId));
      }
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  // Start polling for chat status
  const startPollingChatStatus = useCallback((chatId: string) => {
    let isPolling = true; // Add flag to control polling

    pollChatProcessingStatus(
      chatId,
      // Status update callback
      (status) => {
        // console.log('Processing status update:', status);
        setProcessingStatuses(prev => ({
          ...prev,
          [chatId]: status
        }));
        
        // Handle different status cases
        switch (status.status) {
          case 'processing':
            clearTaskCache(chatId);
            setTaskError(null);
            break;
          case 'error':
            clearTaskCache(chatId);
            setTaskError(status.error_message || 'Unknown error occurred');
            break;
          case 'completed':
            setTaskError(null);
            if (isPolling) {
              fetchTasksForChat(chatId);
              isPolling = false; // Stop polling once completed
            }
            break;
          default:
            setTaskError(null);
        }
      },
      // Complete callback - fetch tasks
      (tasks) => {
        if (!isPolling) return; // Skip if we're no longer polling
        const mappedTasks = mapApiTasksToTasks(tasks);
        setTasks(prevTasks => {
          const otherTasks = prevTasks.filter(task => task.chatId !== chatId);
          setCachedTasks(mappedTasks, chatId);
          return [...otherTasks, ...mappedTasks];
        });
      },
      // Error callback - only for critical polling failures
      (error) => {
        console.error(`Critical polling error for chat ${chatId}:`, error);
      }
    );

    // Cleanup function to stop polling
    return () => {
      isPolling = false;
    };
  }, [fetchTasksForChat]);

  // Fetch tasks when the selected chat changes
  useEffect(() => {
    if (selectedChatId && selectedChat?.mode === 'observe') {
      // Start polling first to get the current status
      const stopPolling = startPollingChatStatus(selectedChatId);
      
      // Return cleanup function
      return () => {
        stopPolling();
      };
    }
  }, [selectedChatId, selectedChat, startPollingChatStatus]);

  // Select the appropriate content based on the chat mode
  const content = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? tasks.filter(task => task.chatId === selectedChatId)
      : messages.filter(msg => msg.chatId === selectedChatId)
    : tasks;

  // Apply filtering and sorting to tasks
  const getFilteredAndSortedTasks = (tasksToFilter: Task[]): Task[] => {
    // Apply filter
    let filteredTasks = tasksToFilter;
    if (taskFilter === 'completed') {
      filteredTasks = tasksToFilter.filter(task => task.status === 'completed');
    } else if (taskFilter === 'pending') {
      filteredTasks = tasksToFilter.filter(task => task.status === 'pending');
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      // Ensure we always get valid Date objects
      let dateA: Date;
      let dateB: Date;
      
      // Use raw dates if available and valid, otherwise parse display strings
      if (a.messageDateRaw instanceof Date) {
        dateA = a.messageDateRaw;
      } else if (a.createdAtRaw instanceof Date) {
        dateA = a.createdAtRaw;
      } else {
        dateA = new Date(a.messageDate || a.time || 0);
      }
      
      if (b.messageDateRaw instanceof Date) {
        dateB = b.messageDateRaw;
      } else if (b.createdAtRaw instanceof Date) {
        dateB = b.createdAtRaw;
      } else {
        dateB = new Date(b.messageDate || b.time || 0);
      }
      
      if (sortOrder === 'newest') {
        return dateB.getTime() - dateA.getTime();
      } else {
        return dateA.getTime() - dateB.getTime();
      }
    });
  };

  // Update content to use filtered and sorted tasks
  const filteredContent = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? getFilteredAndSortedTasks(tasks.filter(task => task.chatId === selectedChatId))
      : messages.filter(msg => msg.chatId === selectedChatId)
    : getFilteredAndSortedTasks(tasks);

  // Debug content
  // useEffect(() => {
  //   console.log('Filtered content for display:', content);
  //   console.log('Selected chat ID:', selectedChatId);
  //   console.log('All tasks:', tasks);
  // }, [content, selectedChatId, tasks]);

  // Handlers for the chat selection flow
  const handleChatSelectionDone = async () => {
    setShowChatSelection(false);
    
    // Auto-configure all newly selected chats with "Track" mode
    const newlySelectedChats = selectedChats.filter(chatId => 
      !chatConfigs.find(config => config.id === chatId)
    );
    
    if (newlySelectedChats.length > 0) {
      const chatModes = newlySelectedChats.map(chatId => ({ chatId, mode: 'observe' as const }));
      setBatchModes(chatModes);
    }
    
    // Save configurations in the background
    try {
      await onSaveConfigurations();
    } catch (error) {
      console.error('Error saving chat configurations:', error);
    }
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

  // Handle task status updates
  const handleTaskUpdate = useCallback((taskId: string, completed: boolean) => {
    setTasks(prevTasks => prevTasks.map(task => 
      task.id === taskId 
        ? { ...task, status: completed ? 'completed' : 'pending' }
        : task
    ));
  }, []);

  // Handle SSE updates
  useEffect(() => {
    if (updates.length > 0) {
      const latestUpdate = updates[updates.length - 1];
      console.log('Received SSE update:', latestUpdate);

      // Handle different update types
      switch (latestUpdate.type) {
        case 'new_task': {
          const chatId = latestUpdate.chat_id.toString();
          // If we're viewing this chat or viewing all tasks, refresh the task list
          if (!selectedChatId || selectedChatId === chatId) {
            fetchTasksForChat(chatId);
          }
          break;
        }
        case 'new_tasks': {
          const chatId = latestUpdate.chat_id.toString();
          // If we're viewing this chat or viewing all tasks, refresh the task list
          if (!selectedChatId || selectedChatId === chatId) {
            fetchTasksForChat(chatId);
          }
          break;
        }
        case 'polling_update': {
          const chatId = latestUpdate.chat_id.toString();
          // Update processing status if we're viewing this chat
          if (selectedChatId === chatId) {
            setProcessingStatuses(prev => ({
              ...prev,
              [chatId]: {
                ...prev[chatId],
                processed_messages: latestUpdate.data.processed_messages
              }
            }));
          }
          break;
        }
      }
    }
  }, [updates, selectedChatId, fetchTasksForChat]);

  useEffect(() => {
    // console.log('SSE connection status:', { isConnected, error: sseError });
  }, [isConnected, sseError]);

  return (
    <div className={styles.overview}>
      <Notifications updates={updates} />
      
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        {!showSidebar && selectedChat && (
          <button 
            className={styles.backButton}
            onClick={handleMobileBackToSidebar}
            aria-label="Back to chats"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        <h1 className={styles.mobileTitle}>
          {!showSidebar && selectedChat ? selectedChat.name : 'Teletasker'}
        </h1>
        {!showSidebar && selectedChat ? (
          <div className={styles.mobileHeaderActions}>
            <CopyTasksButton tasks={tasks} selectedChatId={selectedChatId} />
          </div>
        ) : showSidebar && username && onLogout && (
          <div className={styles.mobileHeaderActions}>
            <UserMenu username={username} onLogout={onLogout} />
          </div>
        )}
      </div>

      {/* Sidebar - conditionally shown on mobile */}
      <div className={`${styles.sidebarContainer} ${showSidebar ? styles.sidebarVisible : styles.sidebarHidden}`}>
        <Sidebar 
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={handleMobileSelectChat}
          onRemoveChat={onRemoveChat}
          onAddChat={() => setShowChatSelection(true)}
          tasksCount={tasks.length}
          removeMonitoredChat={removeMonitoredChat}
        />
      </div>

      {/* Content - conditionally shown on mobile */}
      <div className={`${styles.content} ${!showSidebar ? styles.contentVisible : styles.contentHidden}`}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>
            {selectedChat ? (
              selectedChat.mode === 'observe' ? (
                <>
                  Tasks from {selectedChat.name} 
                  <span className={styles.count}>({filteredContent.length})</span>
                  {isProcessing && <span className={styles.processingStatus}>Processing...</span>}
                </>
              ) : (
                <>Messages from {selectedChat.name} <span className={styles.count}>({filteredContent.length})</span></>
              )
            ) : (
              <>All Tasks <span className={styles.count}>({filteredContent.length})</span></>
            )}
          </h3>
          <div className={styles.headerActions}>
            {/* Filter and Sort Controls - only show for task views */}
            {(!selectedChat || selectedChat.mode === 'observe') && (
              <div className={styles.filterSortControls}>
                <FilterButton 
                  value={taskFilter} 
                  onChange={setTaskFilter}
                />
                <SortButton 
                  value={sortOrder} 
                  onChange={setSortOrder}
                />
              </div>
            )}
            <CopyTasksButton tasks={tasks} selectedChatId={selectedChatId} />
          </div>
        </div>
        
        {/* Debugging panel - remove this in production */}
        {/* {process.env.NODE_ENV === 'development' && (
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
        )} */}
        
        <div className={styles.contentList}>
          <TaskMessageList
            isLoadingTasks={isLoadingTasks}
            taskError={taskError}
            content={filteredContent}
            selectedChat={selectedChat}
            isProcessing={isProcessing}
            fetchTasksForChat={fetchTasksForChat}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>
      </div>
      
      {/* Use ChatSelectionModal component instead of inline implementation */}
      {showChatSelection && createPortal(
        <ChatSelectionModal
          chats={availableChats}
          selectedChats={selectedChats}
          chatLimit={chatLimit}
          onToggleChat={onToggleChat}
          onContinue={handleChatSelectionDone}
          onClose={() => setShowChatSelection(false)}
          isLoading={isLoading}
          isDismissible={true}
        />,
        document.body
      )}


    </div>
  );
};

export default Overview; 