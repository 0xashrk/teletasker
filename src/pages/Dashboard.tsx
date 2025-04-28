import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/ChatList';
import AssistantModeConfig from '../components/AssistantModeConfig';
import Overview from '../components/Overview';
import styles from './Dashboard.module.css';

// Mock chat data
const mockChats = [
  { id: '1', name: 'Alice Smith', avatar: '👩', lastMessage: 'Can you review the proposal?', time: '2m', unread: 3 },
  { id: '2', name: 'Product Team', avatar: '🧑‍💻', lastMessage: 'Sprint planning at 2 PM', time: '5m', unread: 0 },
  { id: '3', name: 'John Developer', avatar: '👨‍💻', lastMessage: 'PR is ready for review', time: '15m', unread: 1 },
  { id: '4', name: 'Marketing', avatar: '📢', lastMessage: 'Campaign stats are in!', time: '30m', unread: 0 },
  { id: '5', name: 'Support', avatar: '💡', lastMessage: 'New ticket assigned to you', time: '1h', unread: 2 },
  { id: '6', name: 'Design Team', avatar: '🎨', lastMessage: 'Updated mockups ready', time: '2h', unread: 0 },
  { id: '7', name: 'Engineering', avatar: '⚙️', lastMessage: 'Deployment successful', time: '3h', unread: 0 },
];

// Mock tasks data
const mockTasks = [
  {
    id: '1',
    chatId: '1',
    text: 'Review the Q4 marketing proposal by Friday',
    source: 'Alice Smith',
    time: '2m ago',
    status: 'pending' as const,
    isAutomated: false
  },
  {
    id: '2',
    chatId: '2',
    text: 'Schedule team sync for sprint planning',
    source: 'Product Team',
    time: '5m ago',
    status: 'automated' as const,
    isAutomated: true
  },
  {
    id: '3',
    chatId: '3',
    text: 'Review pull request #42: Add new dashboard features',
    source: 'John Developer',
    time: '15m ago',
    status: 'pending' as const,
    isAutomated: false
  }
];

const CHAT_LIMIT = 5;

interface ChatConfig {
  id: string;
  mode: 'observe' | 'automate';
}

const Dashboard: React.FC = () => {
  const { user, logout } = usePrivy();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [chatConfigs, setChatConfigs] = useState<ChatConfig[]>([]);
  const [showModes, setShowModes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleConnect = () => {
    setConnected(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleToggleChat = (id: string) => {
    if (selectedChats.includes(id)) {
      setSelectedChats(selectedChats.filter(cid => cid !== id));
      setChatConfigs(chatConfigs.filter(config => config.id !== id));
    } else if (selectedChats.length < CHAT_LIMIT) {
      setSelectedChats([...selectedChats, id]);
    }
  };

  const handleContinue = () => {
    setShowModes(true);
  };

  const handleSetMode = (chatId: string, mode: 'observe' | 'automate') => {
    const existingConfig = chatConfigs.find(c => c.id === chatId);
    if (existingConfig) {
      setChatConfigs(chatConfigs.map(c => 
        c.id === chatId ? { ...c, mode } : c
      ));
    } else {
      setChatConfigs([...chatConfigs, { id: chatId, mode }]);
    }
  };

  const handleStart = () => {
    setShowOverview(true);
  };

  const handleSelectChat = (chatId: string | null) => {
    setSelectedChatId(chatId);
  };

  const configuredChats = mockChats
    .filter(chat => chatConfigs.some(c => c.id === chat.id))
    .map(chat => ({
      ...chat,
      mode: chatConfigs.find(c => c.id === chat.id)?.mode || 'observe'
    }));

  const renderContent = () => {
    if (!connected) {
      return (
        <div className={styles.card}>
          <h2 className={styles.title}>Connect to Telegram</h2>
          <p className={styles.desc}>
            Connect your Telegram account to start managing tasks from your chats.
          </p>
          <button className={styles.button} onClick={handleConnect}>
            Continue with Telegram
          </button>
        </div>
      );
    }

    if (!showModes) {
      return (
        <div className={styles.card}>
          <h2 className={styles.title}>Select Chats</h2>
          <p className={styles.desc}>
            Choose up to {CHAT_LIMIT} chats for your AI assistant to manage.
          </p>
          <ChatList
            chats={mockChats}
            selectedChats={selectedChats}
            chatLimit={CHAT_LIMIT}
            onToggleChat={handleToggleChat}
          />
          <button 
            className={styles.button}
            disabled={selectedChats.length === 0}
            onClick={handleContinue}
          >
            {selectedChats.length === 0 ? 'Select chats to continue' : `Continue with ${selectedChats.length} ${selectedChats.length === 1 ? 'chat' : 'chats'}`}
          </button>
        </div>
      );
    }

    if (!showOverview) {
      return (
        <AssistantModeConfig
          selectedChats={mockChats.filter(chat => selectedChats.includes(chat.id))}
          chatConfigs={chatConfigs}
          onSetMode={handleSetMode}
          onStart={handleStart}
        />
      );
    }

    return (
      <Overview
        chats={configuredChats}
        tasks={mockTasks}
        selectedChatId={selectedChatId}
        onSelectChat={handleSelectChat}
      />
    );
  };

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.logo}>Teletasker</div>
        <div className={styles.userSection}>
          <span className={styles.userEmail}>
            {user?.email?.address}
          </span>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className={styles.main}>
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard; 