import React, { useState } from 'react';
import './Dashboard.css';
import { usePrivy } from '@privy-io/react-auth';

// Mock chat data
const mockChats = [
  { id: '1', name: 'Product Team', avatar: '🧑‍💻' },
  { id: '2', name: 'Founders', avatar: '🚀' },
  { id: '3', name: 'Family', avatar: '👨‍👩‍👧‍👦' },
  { id: '4', name: 'Crypto Alpha', avatar: '🦄' },
  { id: '5', name: 'Side Hustle', avatar: '💡' },
  { id: '6', name: 'Web3 Friends', avatar: '🌐' },
  { id: '7', name: 'Investors', avatar: '💰' },
];

const CHAT_LIMIT = 5;

const Dashboard: React.FC = () => {
  const { user } = usePrivy();
  const [connected, setConnected] = useState(false); // mock connection state
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  const handleConnect = () => {
    setConnected(true); // mock connect
  };

  const handleToggleChat = (id: string) => {
    if (selectedChats.includes(id)) {
      setSelectedChats(selectedChats.filter(cid => cid !== id));
    } else if (selectedChats.length < CHAT_LIMIT) {
      setSelectedChats([...selectedChats, id]);
    }
  };

  return (
    <div className="dashboard-root">
      <header className="dashboard-topbar">
        <div className="dashboard-logo">Teletasker</div>
        <div className="dashboard-user">
          {user?.email?.address ? `Hi, ${user.email.address}` : 'Welcome!'}
        </div>
      </header>
      <main className="dashboard-main">
        {!connected ? (
          <div className="onboarding-card">
            <h2>Connect your Telegram</h2>
            <p className="onboarding-desc">To get started, connect your Telegram account. We'll never DM or spam you.</p>
            <button className="connect-btn" onClick={handleConnect}>Connect Telegram</button>
          </div>
        ) : (
          <div className="chat-select-card">
            <h2>Select chats to monitor</h2>
            <p className="chat-select-desc">Pick up to {CHAT_LIMIT} chats to watch for tasks and auto-replies.</p>
            <div className="chat-grid">
              {mockChats.map(chat => {
                const selected = selectedChats.includes(chat.id);
                const disabled = !selected && selectedChats.length >= CHAT_LIMIT;
                return (
                  <div
                    key={chat.id}
                    className={`chat-tile${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                    onClick={() => !disabled && handleToggleChat(chat.id)}
                  >
                    <span className="chat-avatar">{chat.avatar}</span>
                    <span className="chat-name">{chat.name}</span>
                    {selected && <span className="chat-check">✓</span>}
                  </div>
                );
              })}
            </div>
            {selectedChats.length >= CHAT_LIMIT && (
              <div className="upgrade-banner">
                <span>Upgrade for unlimited chat monitoring →</span>
              </div>
            )}
            <button className="save-btn" disabled={selectedChats.length === 0}>Save Selection</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 