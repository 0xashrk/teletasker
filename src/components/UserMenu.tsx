import React, { useState, useRef, useEffect } from 'react';
import styles from './UserMenu.module.css';
import UsageModal from './UsageModal';

interface UserMenuProps {
  username: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ username }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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

  return (
    <div className={styles.container} ref={menuRef}>
      <button 
        className={styles.usernameButton} 
        onClick={() => setIsOpen(!isOpen)}
      >
        {username}
      </button>
      
      {isOpen && (
        <div className={styles.menu}>
          <button 
            className={styles.menuItem}
            onClick={handleUsageClick}
          >
            Usage
          </button>
        </div>
      )}

      {showUsageModal && (
        <UsageModal onClose={() => setShowUsageModal(false)} />
      )}
    </div>
  );
};

export default UserMenu; 