import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUserMetrics, UserMetrics } from '../services/analytics_api';
import styles from './UsageModal.module.css';

interface UsageModalProps {
  onClose: () => void;
}

// Average time savings estimates (in seconds)
const TIME_SAVINGS = {
  TASK_EXTRACTION: 30, // 30 seconds saved per task extraction
  CHAT_SETUP: 120, // 2 minutes saved per chat setup
  MESSAGE_PROCESSING: 2, // 2 seconds saved per message processed
};

const formatTimeSaved = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  return `${Math.round(seconds / 86400)} days`;
};

const UsageModal: React.FC<UsageModalProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getUserMetrics();
        setMetrics(data);
      } catch (err) {
        setError('Failed to load usage metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const calculateTimeSaved = (metrics: UserMetrics) => {
    const taskTime = metrics.total_tasks_extracted * TIME_SAVINGS.TASK_EXTRACTION;
    const chatTime = metrics.unique_chats_analyzed * TIME_SAVINGS.CHAT_SETUP;
    const messageTime = metrics.total_messages_analyzed * TIME_SAVINGS.MESSAGE_PROCESSING;
    return taskTime + chatTime + messageTime;
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Productivity Impact</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>Calculating your time savings...</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {metrics && (
            <>
              <div className={styles.timeSaved}>
                <div className={styles.timeSavedValue}>
                  {formatTimeSaved(calculateTimeSaved(metrics))}
                </div>
                <div className={styles.timeSavedLabel}>
                  saved with Teletasker
                </div>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>{metrics.total_tasks_extracted}</span>
                  <span className={styles.metricLabel}>Tasks Auto-Extracted</span>
                  <span className={styles.metricSaving}>
                    saved {formatTimeSaved(metrics.total_tasks_extracted * TIME_SAVINGS.TASK_EXTRACTION)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>{metrics.unique_chats_analyzed}</span>
                  <span className={styles.metricLabel}>Chats Monitored</span>
                  <span className={styles.metricSaving}>
                    saved {formatTimeSaved(metrics.unique_chats_analyzed * TIME_SAVINGS.CHAT_SETUP)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>{metrics.total_messages_analyzed}</span>
                  <span className={styles.metricLabel}>Messages Processed</span>
                  <span className={styles.metricSaving}>
                    saved {formatTimeSaved(metrics.total_messages_analyzed * TIME_SAVINGS.MESSAGE_PROCESSING)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricValue}>{metrics.total_requests}</span>
                  <span className={styles.metricLabel}>Total Requests</span>
                  <span className={styles.metricTier}>{metrics.user_tier} Plan</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UsageModal; 