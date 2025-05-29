import React, { useState, useRef, useEffect } from 'react';
import styles from './FilterButton.module.css';

type TaskFilter = 'all' | 'completed' | 'pending';

interface FilterButtonProps {
  value: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

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
      case 'all': return '📋';
      case 'pending': return '⏳';
      case 'completed': return '✅';
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
            <span className={styles.optionIcon}>📋</span>
            All Tasks
          </button>
          <button
            className={`${styles.filterOption} ${value === 'pending' ? styles.selected : ''}`}
            onClick={() => handleFilterChange('pending')}
          >
            <span className={styles.optionIcon}>⏳</span>
            Pending
          </button>
          <button
            className={`${styles.filterOption} ${value === 'completed' ? styles.selected : ''}`}
            onClick={() => handleFilterChange('completed')}
          >
            <span className={styles.optionIcon}>✅</span>
            Completed
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterButton; 