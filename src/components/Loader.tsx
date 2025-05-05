import React from 'react';
import styles from './Loader.module.css';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...' }) => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
        <div className={styles.dot}></div>
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
};

export default Loader; 