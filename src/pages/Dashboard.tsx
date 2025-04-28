import React, { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import ChatList from '../components/ChatList';
import AssistantModeConfig from '../components/AssistantModeConfig';
import './Dashboard.css';

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
    // TODO: Implement start functionality
    console.log('Starting with configurations:', chatConfigs);
  };

  return (
    <div className="dashboard-root">
      <header className="dashboard-topbar">
        <div className="dashboard-logo">Teletasker</div>
        <div className="dashboard-user-section">
          <span className="dashboard-user">
            {user?.email?.address}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        {!connected ? (
          <div className="onboarding-card">
            <h2>Connect to Telegram</h2>
            <p className="chat-select-desc">
              Connect your Telegram account to start managing tasks from your chats.
            </p>
            <button className="connect-button" onClick={handleConnect}>
              Continue with Telegram
            </button>
          </div>
        ) : !showModes ? (
          <div className="chat-select-card">
            <h2>Select Chats</h2>
            <p className="chat-select-desc">
              Choose up to {CHAT_LIMIT} chats for your AI assistant to manage.
            </p>
            <ChatList
              chats={mockChats}
              selectedChats={selectedChats}
              chatLimit={CHAT_LIMIT}
              onToggleChat={handleToggleChat}
            />
            <button 
              className="continue-button" 
              disabled={selectedChats.length === 0}
              onClick={handleContinue}
            >
              {selectedChats.length === 0 ? 'Select chats to continue' : `Continue with ${selectedChats.length} ${selectedChats.length === 1 ? 'chat' : 'chats'}`}
            </button>
          </div>
        ) : (
          <AssistantModeConfig
            selectedChats={mockChats.filter(chat => selectedChats.includes(chat.id))}
            chatConfigs={chatConfigs}
            onSetMode={handleSetMode}
            onStart={handleStart}
          />
        )}
      </main>
    </div>
  );
};

export default Dashboard; 