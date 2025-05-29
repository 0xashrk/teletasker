import React, { useState, useRef, useEffect } from 'react';
import styles from './SortButton.module.css';

type SortOrder = 'newest' | 'oldest';

interface SortButtonProps {
  value: SortOrder;
  onChange: (sortOrder: SortOrder) => void;
}

// Apple-style icon components
const NewestFirstIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 3v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4 8l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const OldestFirstIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 11V3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M4 6l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SortButton: React.FC<SortButtonProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSortLabel = (sort: SortOrder) => {
    switch (sort) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
    }
  };

  const getSortIcon = (sort: SortOrder) => {
    switch (sort) {
      case 'newest': return <NewestFirstIcon />;
      case 'oldest': return <OldestFirstIcon />;
    }
  };

  const handleSortChange = (sort: SortOrder) => {
    onChange(sort);
    setIsOpen(false);
  };

  return (
    <div className={styles.sortContainer} ref={dropdownRef}>
      <button 
        className={`${styles.sortButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Sort tasks"
      >
        <span className={styles.sortIcon}>{getSortIcon(value)}</span>
        {getSortLabel(value)}
        <span className={styles.dropdownIcon}>⌄</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <button
            className={`${styles.sortOption} ${value === 'newest' ? styles.selected : ''}`}
            onClick={() => handleSortChange('newest')}
          >
            <span className={styles.optionIcon}><NewestFirstIcon /></span>
            Newest First
          </button>
          <button
            className={`${styles.sortOption} ${value === 'oldest' ? styles.selected : ''}`}
            onClick={() => handleSortChange('oldest')}
          >
            <span className={styles.optionIcon}><OldestFirstIcon /></span>
            Oldest First
          </button>
        </div>
      )}
    </div>
  );
};

export default SortButton; 