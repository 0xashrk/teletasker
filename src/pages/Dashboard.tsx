import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTelegramChats } from '../hooks/useTelegramChats';
import { useChatSelection } from '../hooks/useChatSelection';
import ChatList from '../components/ChatList';
import AssistantModeConfig from '../components/AssistantModeConfig';
import Overview from '../components/Overview';
import ConnectTelegram from '../components/ConnectTelegram';
import styles from './Dashboard.module.css';

const CHAT_LIMIT = 5;

const Dashboard: React.FC = () => {
  const { user, logout } = usePrivy();
  const navigate = useNavigate();
  const { isTelegramConnected } = useAuth();
  const [connected, setConnected] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const {
    chats,
    isLoadingChats,
    chatError,
    refetchChats
  } = useTelegramChats(connected, isTelegramConnected);

  const {
    selectedChats,
    chatConfigs,
    configuredChats,
    handleToggleChat,
    handleSetMode,
    saveChatConfigurations,
    isLoading,
    error,
    initialized: chatSelectionInitialized
  } = useChatSelection(chats, CHAT_LIMIT);

  // Check for existing monitored chats on component mount
  useEffect(() => {
    const checkExistingConfiguration = async () => {
      // Wait for chat selection to be initialized
      if (!chatSelectionInitialized) return;
      
      try {
        if (isTelegramConnected) {
          setConnected(true);
          
          // If we have monitored chats, skip to overview
          if (selectedChats.length > 0) {
            setShowModes(true);
            setShowOverview(true);
          }
        }
      } catch (error) {
        console.error('Error checking existing configuration:', error);
      } finally {
        setInitializing(false);
      }
    };

    checkExistingConfiguration();
  }, [isTelegramConnected, selectedChats, chatSelectionInitialized]);

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

  const handleContinue = () => {
    setShowModes(true);
  };

  const handleStart = () => {
    setShowOverview(true);
  };

  const renderContent = () => {
    // Show loading state until initialization is complete
    if (initializing || !chatSelectionInitialized) {
      return <div className={styles.loading}>Loading your dashboard...</div>;
    }

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
          onSaveConfigurations={saveChatConfigurations}
          isLoading={isLoading}
        />
      );
    }

    return (
      <Overview
        chats={configuredChats}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onRemoveChat={handleToggleChat}
        availableChats={chats}
        selectedChats={selectedChats}
        chatLimit={CHAT_LIMIT}
        onToggleChat={handleToggleChat}
        chatConfigs={chatConfigs}
        onSetMode={handleSetMode}
        onSaveConfigurations={saveChatConfigurations}
        isLoading={isLoading}
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