import React, { useEffect, useState, useCallback } from 'react';
import styles from './Notifications.module.css';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
  timestamp: Date;
}

interface NotificationsProps {
  updates: any[];
}

const Notifications: React.FC<NotificationsProps> = ({ updates }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Handle notification dismissal
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    if (updates.length > 0) {
      const latestUpdate = updates[updates.length - 1];
      
      // Create notification based on update type
      const createNotification = (): Notification | null => {
        const id = Math.random().toString(36).substring(2);
        const timestamp = new Date();
        
        switch (latestUpdate.type) {
          case 'new_task':
            return {
              id,
              message: `New task: ${latestUpdate.data.task.description.substring(0, 50)}...`,
              type: 'success' as const,
              timestamp
            };
          case 'new_tasks':
            return {
              id,
              message: `${latestUpdate.data.new_task_count} new task(s) added`,
              type: 'info' as const,
              timestamp
            };
          case 'polling_update':
            return {
              id,
              message: `Processed ${latestUpdate.data.processed_messages} message(s)`,
              type: 'info' as const,
              timestamp
            };
          default:
            return null;
        }
      };

      const newNotification = createNotification();
      if (newNotification) {
        setNotifications(prev => [...prev, newNotification]);
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          dismissNotification(newNotification.id);
        }, 5000);
      }
    }
  }, [updates, dismissNotification]);

  return (
    <div className={styles.notificationsContainer}>
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`${styles.notification} ${styles[notification.type]}`}
          data-new="true"
          onClick={() => dismissNotification(notification.id)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              dismissNotification(notification.id);
            }
          }}
        >
          <div className={styles.notificationContent}>
            <div className={styles.message}>{notification.message}</div>
            <div className={styles.timestamp}>
              {notification.timestamp.toLocaleTimeString()}
            </div>
          </div>
          <button 
            className={styles.dismissButton}
            onClick={(e) => {
              e.stopPropagation();
              dismissNotification(notification.id);
            }}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notifications; 