import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Overview.module.css';
import ChatList from './ChatList';  // Import existing ChatList
import { TelegramChat } from '../hooks/useTelegramChats';
import AssistantModeConfig from './AssistantModeConfig';
import { ChatConfig } from '../hooks/useChatSelection';

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
}

// Mock data for observe mode (task extraction)
const mockTasks: Task[] = [
  {
    id: '1',
    chatId: '1', // Alice Smith (observe mode)
    text: 'Review the Q4 marketing proposal by Friday',
    source: 'Alice Smith',
    time: '2m ago',
    status: 'pending',
    extractedFrom: "Can you review the proposal? I need feedback on the Q4 marketing plan by Friday."
  },
  {
    id: '2',
    chatId: '2', // Product Team (observe mode)
    text: 'Schedule team sync for sprint planning',
    source: 'Product Team',
    time: '5m ago',
    status: 'pending',
    extractedFrom: "Sprint planning at 2 PM. Everyone please update your tasks in the backlog before the meeting."
  },
  {
    id: '3',
    chatId: '3', // John Developer (observe mode)
    text: 'Review pull request #42: Add new dashboard features',
    source: 'John Developer',
    time: '15m ago',
    status: 'completed',
    extractedFrom: "PR is ready for review. I've added the new dashboard features we discussed. Please check when you have a moment."
  }
];

// Mock data for auto mode (chat replies)
const mockMessages: Message[] = [
  {
    id: '1',
    chatId: '1', // Alice Smith (auto mode)
    text: "Can you review the proposal?",
    sender: "Alice Smith",
    time: "2m ago",
    aiResponse: {
      text: "I've reviewed the Q4 marketing proposal. The campaign objectives are well-defined, but we might want to adjust the budget allocation. I suggest increasing the digital ad spend by 15% based on last quarter's performance. Would you like me to draft a detailed feedback document?",
      reasoning: "Providing specific feedback on the proposal while offering to create a more comprehensive review document."
    }
  },
  {
    id: '2',
    chatId: '1', // Alice Smith (auto mode)
    text: "Also, we need to coordinate with the design team about the new brand assets",
    sender: "Alice Smith",
    time: "1m ago",
    aiResponse: {
      text: "I'll reach out to the design team right away. I see they've recently updated our brand guidelines. I'll schedule a sync meeting for tomorrow at 11 AM when both teams have availability, and I'll prepare an agenda focusing on the Q4 campaign requirements.",
      reasoning: "Taking initiative to coordinate cross-team collaboration, checking schedules, and ensuring productive meeting preparation."
    }
  },
  {
    id: '3',
    chatId: '4', // Marketing (auto mode)
    text: "Campaign stats are in! We're seeing a 25% increase in engagement.",
    sender: "Marketing",
    time: "30m ago",
    aiResponse: {
      text: "Great results! I've analyzed the campaign metrics. The 25% increase in engagement is primarily driven by the new social media strategy. I'll prepare a detailed report highlighting the key success factors and areas for optimization.",
      reasoning: "Acknowledging success, providing analysis, and taking proactive action to document insights for future campaigns."
    }
  },
  {
    id: '4',
    chatId: '5', // Support (auto mode)
    text: "New ticket assigned to you - Customer reporting login issues on mobile app",
    sender: "Support",
    time: "1h ago",
    aiResponse: {
      text: "I'll handle this ticket right away. Based on recent error logs, there's an authentication issue affecting mobile users. I'll guide the customer through the cache clearing process while I investigate the root cause.",
      reasoning: "Immediate response to customer issue, providing quick solution while investigating deeper problem."
    }
  },
  {
    id: '5',
    chatId: '6', // Design Team (auto mode)
    text: "Updated mockups ready for the new feature",
    sender: "Design Team",
    time: "2h ago",
    aiResponse: {
      text: "I've reviewed the mockups and they align well with our design system. I notice the new navigation pattern might improve user flow by 30%. Would you like me to prepare a brief A/B test proposal?",
      reasoning: "Validating design consistency, identifying potential improvements, and suggesting data-driven validation."
    }
  }
];

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
}) => {
  const [showChatSelection, setShowChatSelection] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(false);

  const selectedChat = selectedChatId 
    ? chats.find(chat => chat.id === selectedChatId)
    : null;

  // Filter tasks or messages based on selected chat and its mode
  const filteredContent = selectedChatId && selectedChat
    ? selectedChat.mode === 'observe'
      ? mockTasks.filter(task => task.chatId === selectedChatId)
      : mockMessages.filter(msg => msg.chatId === selectedChatId)
    : mockTasks; // Default to showing all tasks

  // Modify the chat selection flow
  const handleChatSelectionDone = () => {
    setShowChatSelection(false);
    setShowModeSelection(true);
  };

  // Update handler for mode selection done
  const handleModeSelectionDone = () => {
    setShowModeSelection(false);
  };

  return (
    <div className={`${styles.overview} ${styles.fadeIn}`}>
      <div className={styles.sidebar}>
        <div className={styles.navigation}>
          <div 
            className={`${styles.navItem} ${!selectedChatId ? styles.active : ''}`}
            onClick={() => onSelectChat(null)}
          >
            <span className={styles.navIcon}>📋</span>
            All Tasks
            <span className={styles.count}>
              ({mockTasks.length})
            </span>
          </div>
        </div>

        <div className={styles.activeChats}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Active Chats</h3>
            <button 
              className={styles.addButton}
              onClick={() => setShowChatSelection(true)}
              title="Add more chats"
            >
              +
            </button>
          </div>
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`${styles.chatItem} ${chat.id === selectedChatId ? styles.active : ''}`}
            >
              <div 
                className={styles.chatContent}
                onClick={() => onSelectChat(chat.id === selectedChatId ? null : chat.id)}
              >
                <span className={styles.chatAvatar}>{chat.avatar}</span>
                <div className={styles.chatInfo}>
                  <div className={styles.chatName}>{chat.name}</div>
                  <div className={styles.chatMode}>
                    <span className={styles.modeIcon}>
                      {chat.mode === 'observe' ? '📋' : '⚡'}
                    </span>
                    {chat.mode === 'observe' ? 'Task Extraction' : 'Auto Reply'}
                  </div>
                </div>
              </div>
              <button
                className={styles.removeButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveChat(chat.id);
                }}
                title="Remove chat"
              >
                −
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.contentHeader}>
          <h3 className={styles.contentTitle}>
            {selectedChat ? (
              selectedChat.mode === 'observe' ? (
                <>Tasks from {selectedChat.name} <span className={styles.count}>({filteredContent.length})</span></>
              ) : (
                <>Messages from {selectedChat.name} <span className={styles.count}>({filteredContent.length})</span></>
              )
            ) : (
              <>All Tasks <span className={styles.count}>({mockTasks.length})</span></>
            )}
          </h3>
        </div>
        
        <div className={styles.contentList}>
          {filteredContent.length > 0 ? (
            <div className={selectedChat?.mode === 'observe' || !selectedChat ? styles.taskList : styles.messageList}>
              {(selectedChat?.mode === 'observe' || !selectedChat)
                ? (filteredContent as Task[]).map(task => (
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
                : (filteredContent as Message[]).map(message => (
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
      
      {/* Simple modal using existing ChatList */}
      {showChatSelection && createPortal(
        <div className={styles.modalOverlay}>
          <div className={styles.card}>
            <h2 className={styles.title}>Select Chats</h2>
            <p className={styles.desc}>
              Choose up to {chatLimit} chats for your AI assistant to manage.
            </p>
            <ChatList
              chats={availableChats}
              selectedChats={selectedChats}
              chatLimit={chatLimit}
              onToggleChat={onToggleChat}
            />
            <button 
              className={styles.button}
              disabled={selectedChats.length === 0}
              onClick={handleChatSelectionDone}
            >
              {selectedChats.length === 0 ? 'Select chats to continue' : `Continue with ${selectedChats.length} ${selectedChats.length === 1 ? 'chat' : 'chats'}`}
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Update the mode selection modal */}
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