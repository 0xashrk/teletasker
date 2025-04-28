import React from 'react';
import './AssistantModeConfig.css';

interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
}

interface ChatConfig {
  id: string;
  mode: 'observe' | 'automate';
}

interface AssistantModeConfigProps {
  selectedChats: Chat[];
  chatConfigs: ChatConfig[];
  onSetMode: (chatId: string, mode: 'observe' | 'automate') => void;
  onStart: () => void;
}

const AssistantModeConfig: React.FC<AssistantModeConfigProps> = ({
  selectedChats,
  chatConfigs,
  onSetMode,
  onStart,
}) => {
  return (
    <div className="chat-modes-card">
      <h2>Configure AI Assistant</h2>
      <p className="modes-desc">
        Choose how you want your AI chief of staff to handle each chat.
      </p>
      
      <div className="selected-chats-list">
        {selectedChats.map(chat => {
          const config = chatConfigs.find(c => c.id === chat.id);
          return (
            <div key={chat.id} className="chat-mode-item">
              <div className="chat-info">
                <span className="chat-avatar">{chat.avatar}</span>
                <span className="chat-name">{chat.name}</span>
              </div>
              <div className="mode-toggles">
                <button
                  className={`mode-button ${config?.mode === 'observe' ? 'active' : ''}`}
                  onClick={() => onSetMode(chat.id, 'observe')}
                >
                  🔍 Observer
                  <span className="mode-desc">Extract tasks only</span>
                </button>
                <button
                  className={`mode-button ${config?.mode === 'automate' ? 'active' : ''}`}
                  onClick={() => onSetMode(chat.id, 'automate')}
                >
                  🤖 Autopilot
                  <span className="mode-desc">Full task automation</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className="start-button"
        disabled={chatConfigs.length !== selectedChats.length}
        onClick={onStart}
      >
        {chatConfigs.length === selectedChats.length 
          ? "Start AI Assistant" 
          : `Configure ${selectedChats.length - chatConfigs.length} more ${selectedChats.length - chatConfigs.length === 1 ? 'chat' : 'chats'}`
        }
      </button>
    </div>
  );
};

export default AssistantModeConfig; 