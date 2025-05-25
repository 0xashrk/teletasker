import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUserMetrics, UserMetrics } from '../services/analytics_api';
import styles from './UsageModal.module.css';

interface UsageModalProps {
  onClose: () => void;
}

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

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Usage Metrics</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          {loading && (
            <div className={styles.loading}>Loading metrics...</div>
          )}

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {metrics && (
            <div className={styles.metrics}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Total Requests</span>
                <span className={styles.metricValue}>{metrics.total_requests}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Tasks Extracted</span>
                <span className={styles.metricValue}>{metrics.total_tasks_extracted}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Unique Chats Analyzed</span>
                <span className={styles.metricValue}>{metrics.unique_chats_analyzed}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Messages Analyzed</span>
                <span className={styles.metricValue}>{metrics.total_messages_analyzed}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default UsageModal; 