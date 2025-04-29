import React from 'react';
import styles from './ConnectTelegram.module.css';

interface ConnectTelegramProps {
  onConnect: () => void;
}

const ConnectTelegram: React.FC<ConnectTelegramProps> = ({ onConnect }) => {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Connect to Telegram</h2>
      <p className={styles.desc}>
        Connect your Telegram account to start managing tasks from your chats.
      </p>
      <button className={styles.button} onClick={onConnect}>
        Continue with Telegram
      </button>
    </div>
  );
};

export default ConnectTelegram; 