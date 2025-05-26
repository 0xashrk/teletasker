import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import LoginButton from './LoginButton';
import Pricing from './homepage/Pricing';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { authenticated } = usePrivy();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (authenticated) {
      // Set flag to indicate user should go to dashboard
      localStorage.setItem('dashboard_user', 'true');
      navigate('/dashboard');
    }
  }, [authenticated, navigate]);

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            Your Telegram chats, turned into todos and replies
          </h1>
                      <p className={styles.subheadline}>
              Never miss a follow-up again. Your AI assistant reads your chats and turns your Telegram chaos into a clean task list, with Notion integration coming soon.
            </p>
          <div className={styles.heroActions}>
            <LoginButton variant="primary" className={styles.heroLoginButton} />
          </div>
        </div>
      </section>

      {/* Mockup Section */}
      <section className={styles.mockup}>
        <div className={styles.mockupContent}>
          <div className={styles.mockupContainer}>
            <div className={styles.telegramMockup}>
              <div className={styles.chatHeader}>
                <span className={styles.chatTitle}>Telegram Group Chat</span>
              </div>
              <div className={styles.chatMessages}>
                <div className={styles.message}>
                  <span className={styles.sender}>@Sarah</span>
                  <p>Hey team, can you review the product specs by tomorrow?</p>
                </div>
                <div className={styles.message}>
                  <span className={styles.sender}>@Alex</span>
                  <p>Will do! I'll share my feedback first thing tomorrow 👍</p>
                </div>
              </div>
            </div>
            <div className={styles.arrow}>→</div>
            <div className={styles.taskMockup}>
              <div className={styles.taskHeader}>
                <span className={styles.taskTitle}>Extracted Tasks</span>
              </div>
              <div className={styles.taskList}>
                <div className={styles.task}>
                  <span className={styles.taskSource}>From @Sarah</span>
                  <p>Review product specs</p>
                  <span className={styles.taskDue}>Due: Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <Pricing />

      {/* Social Proof Section */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofContent}>
          <p className={styles.audience}>
            Built for founders, ops leads, and Telegram power users who drop too many follow-ups.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 