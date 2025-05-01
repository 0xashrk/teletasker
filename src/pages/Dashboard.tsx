import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/ChatList';
import AssistantModeConfig from '../components/AssistantModeConfig';
import Overview from '../components/Overview';
import ConnectTelegram from '../components/ConnectTelegram';
import { getTelegramChats } from '../services/api';
import styles from './Dashboard.module.css';
import { useAuth } from '../contexts/AuthContext';

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
  const [chats, setChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const { isTelegramConnected } = useAuth();

  // Fetch chats when connected
  useEffect(() => {
    const fetchChats = async () => {
      if (!connected || !isTelegramConnected) return;
      
      setIsLoadingChats(true);
      setChatError(null);
      
      try {
        const telegramChats = await getTelegramChats();
        // Transform Telegram chat format to our app's format
        const formattedChats = telegramChats.map(chat => ({
          id: chat.id.toString(),
          name: chat.title,
          avatar: chat.type === 'user' ? '👤' : '👥', // Default avatars based on type
          lastMessage: chat.last_message.text || 'No messages',
          time: new Date(chat.last_message.date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          unread: chat.unread_count
        }));
        setChats(formattedChats);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setChatError('Failed to load chats. Please try again.');
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, [connected, isTelegramConnected]);

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

  const configuredChats = chats
    .filter(chat => chatConfigs.some(c => c.id === chat.id))
    .map(chat => ({
      ...chat,
      mode: chatConfigs.find(c => c.id === chat.id)?.mode || 'observe'
    })) as Array<{
      id: string;
      name: string;
      avatar: string;
      mode: 'observe' | 'automate';
      lastMessage: string;
      time: string;
      unread: number;
    }>;

  const renderContent = () => {
    if (!connected) {
      return <ConnectTelegram onConnect={handleConnect} />;
    }

    if (!showModes) {
      return (
        <div className={styles.card}>
          <h2 className={styles.title}>Select Chats</h2>
          <p className={styles.desc}>
            Choose up to {CHAT_LIMIT} chats for your AI assistant to manage.
          </p>
          {isLoadingChats ? (
            <div className={styles.loading}>Loading your chats...</div>
          ) : chatError ? (
            <div className={styles.error}>
              {chatError}
              <button 
                className={styles.retryButton}
                onClick={() => setConnected(true)} // This will trigger a re-fetch
              >
                Retry
              </button>
            </div>
          ) : (
            <ChatList
              chats={chats}
              selectedChats={selectedChats}
              chatLimit={CHAT_LIMIT}
              onToggleChat={handleToggleChat}
            />
          )}
          <button 
            className={styles.button}
            disabled={selectedChats.length === 0 || isLoadingChats}
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
          selectedChats={chats.filter(chat => selectedChats.includes(chat.id))}
          chatConfigs={chatConfigs}
          onSetMode={handleSetMode}
          onStart={handleStart}
        />
      );
    }

    return (
      <Overview
        chats={configuredChats}
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
          {/* <div className={styles.apiTest}>
            <button className={styles.testButton} onClick={handleTestApi}>
              Test API
            </button>
            {testResult && <p className={styles.testResult}>{testResult}</p>}
          </div> */}
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