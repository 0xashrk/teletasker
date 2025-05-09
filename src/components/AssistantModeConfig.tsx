import React, { useState } from 'react';
import styles from './AssistantModeConfig.module.css';

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
  onSaveConfigurations: () => Promise<void>;
  isLoading?: boolean;
}

const AssistantModeConfig: React.FC<AssistantModeConfigProps> = ({
  selectedChats,
  chatConfigs,
  onSetMode,
  onStart,
  onSaveConfigurations,
  isLoading = false,
}) => {
  // Local state to track saving progress 
  const [isSaving, setIsSaving] = useState(false);

  const handleStart = () => {
    if (chatConfigs.length !== selectedChats.length) {
      return; // Do nothing if not all chats are configured
    }

    // Proceed immediately to the dashboard
    onStart();
    
    // Then start the saving process in the background
    setIsSaving(true);
    
    // Fire and forget - don't wait for completion
    onSaveConfigurations()
      .catch(error => {
        console.error('Error saving chat configurations:', error);
        // In a real app, you'd want to show a toast or notification here
        // that the configurations couldn't be saved
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Configure AI Assistant</h2>
        <p className={styles.subtitle}>
          Set behavior for {selectedChats.length} selected chats
        </p>
      </div>
      
      <div className={styles.list}>
        {selectedChats.map(chat => {
          const config = chatConfigs.find(c => c.id === chat.id);
          return (
            <div key={chat.id} className={styles.item}>
              <span className={styles.avatar}>{chat.avatar}</span>
              <span className={styles.name}>{chat.name}</span>
              <div className={styles.modes}>
                <button
                  className={`${styles.modeBtn} ${config?.mode === 'observe' ? styles.active : ''}`}
                  onClick={() => onSetMode(chat.id, 'observe')}
                >
                  <span className={styles.icon}>◎</span>
                  Track
                </button>
                <button
                  className={`${styles.modeBtn} ${config?.mode === 'automate' ? styles.active : ''}`}
                  onClick={() => onSetMode(chat.id, 'automate')}
                >
                  <span className={styles.icon}>⬡</span>
                  Auto
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button 
        className={styles.startBtn}
        disabled={isLoading || isSaving || chatConfigs.length !== selectedChats.length}
        onClick={handleStart}
      >
        {isLoading || isSaving ? (
          "Setting up your assistant..."
        ) : chatConfigs.length === selectedChats.length ? (
          "Start AI Assistant"
        ) : (
          `${selectedChats.length - chatConfigs.length} chats left to configure`
        )}
      </button>
    </div>
  );
};

export default AssistantModeConfig; 