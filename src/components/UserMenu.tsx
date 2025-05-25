import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './UserMenu.module.css';
import UsageModal from './UsageModal';

interface UserMenuProps {
  username: string;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ username, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUsageClick = () => {
    setShowUsageModal(true);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  // Get button position for menu placement
  const getMenuPosition = () => {
    if (!buttonRef.current) return { top: 0, right: 0 };
    const rect = buttonRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right
    };
  };

  const { top, right } = getMenuPosition();

  return (
    <>
      <div className={styles.container}>
        <button 
          ref={buttonRef}
          className={styles.usernameButton} 
          onClick={() => setIsOpen(!isOpen)}
        >
          {username}
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className={styles.menu}
          style={{ 
            position: 'fixed',
            top: `${top}px`,
            right: `${right}px`
          }}
        >
          <div className={styles.menuHeader}>
            <span className={styles.menuUsername}>{username}</span>
          </div>
          <div className={styles.menuDivider} />
          <button 
            className={styles.menuItem}
            onClick={handleUsageClick}
          >
            Usage
          </button>
          <div className={styles.menuDivider} />
          <button 
            className={`${styles.menuItem} ${styles.logoutItem}`}
            onClick={handleLogoutClick}
          >
            Log Out
          </button>
        </div>,
        document.body
      )}

      {showUsageModal && (
        <UsageModal onClose={() => setShowUsageModal(false)} />
      )}
    </>
  );
};

export default UserMenu; 