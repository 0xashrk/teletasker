import React, { useState, useRef, useEffect } from 'react';
import styles from './FilterButton.module.css';

type TaskFilter = 'all' | 'completed' | 'pending';

interface FilterButtonProps {
  value: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

// Apple-style icon components
const AllTasksIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="2" y="3" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <rect x="2" y="2" width="10" height="1" rx="0.5" fill="currentColor"/>
    <circle cx="4" cy="6" r="0.8" fill="currentColor"/>
    <rect x="6" y="5.5" width="4" height="1" rx="0.5" fill="currentColor"/>
    <circle cx="4" cy="8.5" r="0.8" fill="currentColor"/>
    <rect x="6" y="8" width="4" height="1" rx="0.5" fill="currentColor"/>
  </svg>
);

const PendingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CompletedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
    <path d="M4.5 7l2 2 3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FilterButton: React.FC<FilterButtonProps> = ({ value, onChange }) => {
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

  const getFilterLabel = (filter: TaskFilter) => {
    switch (filter) {
      case 'all': return 'All Tasks';
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
    }
  };

  const getFilterIcon = (filter: TaskFilter) => {
    switch (filter) {
      case 'all': return <AllTasksIcon />;
      case 'pending': return <PendingIcon />;
      case 'completed': return <CompletedIcon />;
    }
  };

  const handleFilterChange = (filter: TaskFilter) => {
    onChange(filter);
    setIsOpen(false);
  };

  return (
    <div className={styles.filterContainer} ref={dropdownRef}>
      <button 
        className={`${styles.filterButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Filter tasks"
      >
        <span className={styles.filterIcon}>{getFilterIcon(value)}</span>
        {getFilterLabel(value)}
        <span className={styles.dropdownIcon}>⌄</span>
      </button>
      
      {isOpen && (
        <div className={styles.dropdown}>
          <button
            className={`${styles.filterOption} ${value === 'all' ? styles.selected : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            <span className={styles.optionIcon}><AllTasksIcon /></span>
            All Tasks
          </button>
          <button
            className={`${styles.filterOption} ${value === 'pending' ? styles.selected : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            <span className={styles.optionIcon}><PendingIcon /></span>
            Pending
          </button>
          <button
            className={`${styles.filterOption} ${value === 'completed' ? styles.selected : ''}`}
            onClick={() => handleFilterChange('completed')}
          >
            <span className={styles.optionIcon}><CompletedIcon /></span>
            Completed
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterButton; 