import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Overview.module.css';
import ChatList from './ChatList';
import { TelegramChat } from '../hooks/useTelegramChats';
import AssistantModeConfig from './AssistantModeConfig';
import { ChatConfig } from '../hooks/useChatSelection';
import Sidebar from './Sidebar';
import ChatSelectionModal from './ChatSelectionModal';

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
  
  // Get the currently selected chat
  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  // Here we would fetch actual tasks and messages based on the selected chat
  // For now, using empty arrays until we integrate with real data API
  const tasks: Task[] = [];
  const messages: Message[] = [];

  // Select the appropriate content based on the chat mode
  const content = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? tasks.filter(task => task.chatId === selectedChatId)
      : messages.filter(msg => msg.chatId === selectedChatId)
    : tasks;

  // Handlers for the chat selection flow
  const handleChatSelectionDone = () => {
    setShowChatSelection(false);
    setShowModeSelection(true);
  };

  const handleModeSelectionDone = () => {
    setShowModeSelection(false);
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
                <>Tasks from {selectedChat.name} <span className={styles.count}>({content.length})</span></>
              ) : (
                <>Messages from {selectedChat.name} <span className={styles.count}>({content.length})</span></>
              )
            ) : (
              <>All Tasks <span className={styles.count}>({tasks.length})</span></>
            )}
          </h3>
        </div>
        
        <div className={styles.contentList}>
          {content.length > 0 ? (
            <div className={selectedChat?.mode === 'observe' || !selectedChat ? styles.taskList : styles.messageList}>
              {(selectedChat?.mode === 'observe' || !selectedChat)
                ? (content as Task[]).map(task => (
                    <div key={task.id} className={styles.taskItem}>
                      <div className={styles.taskHeader}>
                        <span className={styles.taskSource}>{task.source}</span>
                        <span className={styles.taskTime}>{task.time}</span>
                      </div>
                      <div className={styles.taskText}>{task.text}</div>
                      <div className={styles.extractedFrom}>
                        <div className={styles.extractedHeader}>Extracted From:</div>
                        <div className={styles.extractedText}>{task.extractedFrom}</div>
                      </div>
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
              onSaveConfigurations={onSaveConfigurations}
              isLoading={isLoading}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Overview; 