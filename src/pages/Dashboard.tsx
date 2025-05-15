import React, { useState, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTelegramChats } from '../hooks/useTelegramChats';
import { useChatSelection } from '../hooks/useChatSelection';
import ChatList from '../components/ChatList';
import AssistantModeConfig from '../components/AssistantModeConfig';
import Overview from '../components/Overview';
import ConnectTelegram from '../components/ConnectTelegram';
import Loader from '../components/Loader';
import styles from './Dashboard.module.css';
import { removeMonitoredChat, getMonitoredChats } from '../services/api';
import ChatSelectionModal from '../components/ChatSelectionModal';

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

  // Log the full Privy user object for debugging
  useEffect(() => {
    if (user) {
      // console.log('Privy User Object:', user);
      // console.log('JSON.stringify(user):', JSON.stringify(user, null, 2));
    }
  }, [user]);

  // Set the dashboard_user flag when the component mounts
  useEffect(() => {
    localStorage.setItem('dashboard_user', 'true');
  }, []);

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

  // Add a ref to track if this is the initial load
  const initialLoadRef = useRef(true);

  // Modify the existing useEffect
  useEffect(() => {
    const checkExistingConfiguration = async () => {
      // Wait for both chat selection initialization and loading to complete
      if (!chatSelectionInitialized || isLoading || isLoadingChats) return;
      
      try {
        if (isTelegramConnected) {
          // Only auto-navigate to Overview on initial load, not when selectedChats changes during onboarding
          if (initialLoadRef.current && selectedChats.length > 0) {
            setShowModes(true);
            setShowOverview(true);
            initialLoadRef.current = false; // Mark initial load as completed
          }
        }
      } catch (error) {
        console.error('Error checking existing configuration:', error);
      } finally {
        setInitializing(false);
        initialLoadRef.current = false; // Also mark as false after initialization
      }
    };

    checkExistingConfiguration();
  }, [isTelegramConnected, selectedChats, chatSelectionInitialized, isLoading, isLoadingChats]);

  // Separate effect to handle connection state
  useEffect(() => {
    if (isTelegramConnected) {
      setConnected(true);
    }
  }, [isTelegramConnected]);

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
      return <Loader message="Preparing your dashboard..." />;
    }

    if (!connected) {
      return <ConnectTelegram onConnect={handleConnect} />;
    }

    if (!showModes) {
      return (
        <ChatSelectionModal
          chats={chats}
          selectedChats={selectedChats}
          chatLimit={CHAT_LIMIT}
          onToggleChat={handleToggleChat}
          onContinue={handleContinue}
          isLoading={isLoadingChats}
          error={chatError}
          onRetry={() => setConnected(true)}
        />
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
        removeMonitoredChat={removeMonitoredChat}
      />
    );
  };

  return (
    <div className={styles.root}>
      <header className={styles.topbar}>
        <div className={styles.logo}>Teletasker</div>
        <div className={styles.userSection}>
          <span className={styles.userEmail}>
            {(() => {
              // First check for email
              if (user?.email?.address) {
                return user.email.address;
              }
              
              // Then check for Twitter username
              if (user?.twitter?.username) {
                return `@${user.twitter.username}`;
              }
              
              // Finally check linked accounts for Twitter
              const twitterAccount = user?.linkedAccounts?.find(account => account.type === 'twitter_oauth');
              if (twitterAccount?.type === 'twitter_oauth' && 'username' in twitterAccount) {
                return `@${twitterAccount.username}`;
              }
              
              return 'User';
            })()}
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