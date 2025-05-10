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
import { TaskMessageList } from './TaskMessageList';
import { Chat, Task, Message } from '../types';

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
    ? chats.find(chat => chat.id === selectedChatId) || null
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
      // Fetch tasks for a specific chat
      fetchTasksForChat(selectedChatId);
      
      // Check processing status
      startPollingChatStatus(selectedChatId);
    } else if (!selectedChatId) {
      // When no chat is selected, fetch tasks for all monitored chats
      setIsLoadingTasks(true);
      setTaskError(null);
      
      // Get all observe mode chats
      const observeChats = chats.filter(chat => chat.mode === 'observe');
      
      // Fetch tasks for all observe mode chats
      Promise.all(observeChats.map(chat => getChatTasks(chat.id)))
        .then(allTasksArrays => {
          // Flatten and map all tasks
          const allTasks = allTasksArrays.flatMap(mapApiTasksToTasks);
          setTasks(allTasks);
        })
        .catch(error => {
          console.error('Error fetching all tasks:', error);
          setTaskError('Failed to load tasks. Please try again.');
        })
        .finally(() => {
          setIsLoadingTasks(false);
        });
    }
  }, [selectedChatId, selectedChat, fetchTasksForChat, startPollingChatStatus, chats]);

  // Select the appropriate content based on the chat mode
  const content = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? tasks.filter(task => task.chatId === selectedChatId)
      : messages.filter(msg => msg.chatId === selectedChatId)
    : tasks;

  // Debug content
  // useEffect(() => {
  //   console.log('Filtered content for display:', content);
  //   console.log('Selected chat ID:', selectedChatId);
  //   console.log('All tasks:', tasks);
  // }, [content, selectedChatId, tasks]);

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
            content={content}
            selectedChat={selectedChat}
            isProcessing={isProcessing}
            fetchTasksForChat={fetchTasksForChat}
          />
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