import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from './LoginButton';
import Pricing from './homepage/Pricing';
import styles from './HomePage.module.css';

const HomePage: React.FC = () => {
  const { authenticated } = usePrivy();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showWaitlistSuccess, setShowWaitlistSuccess] = useState(false);
  const [isNewSignup, setIsNewSignup] = useState(false);

  // Only redirect to dashboard if authenticated and not a new waitlist signup
  useEffect(() => {
    // Check if user was previously on the dashboard (not a new signup)
    const wasDashboardUser = localStorage.getItem('dashboard_user') === 'true';
    
    if (authenticated && wasDashboardUser) {
      navigate('/dashboard');
    } else if (authenticated && isNewSignup) {
      // Just show success message for new waitlist signups
      setShowWaitlistSuccess(true);
    } else if (authenticated) {
      // User was authenticated before but we don't know if they're a dashboard user
      // Let's check if they should see the waitlist success or go to dashboard
      const checkExistingUser = async () => {
        try {
          // For now, just show waitlist success by default
          setShowWaitlistSuccess(true);
          // Can add API check here later if needed
        } catch (error) {
          console.error('Error checking user status:', error);
        }
      };
      
      checkExistingUser();
    }
  }, [authenticated, navigate, isNewSignup]);

  const handleSignup = async () => {
    try {
      setIsNewSignup(true);
      console.log('Starting waitlist signup process...');
      const result = await login();
      console.log('Waitlist signup result:', result);
    } catch (error) {
      console.error('Error during signup:', error);
      setIsNewSignup(false);
    }
  };

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>
            <span className={styles.telegramEmoji}>🤖</span> Your Telegram chats, turned into todos and replies
          </h1>
          <p className={styles.subheadline}>
            Never miss a follow-up again. Your AI assistant reads your chats, replies to messages, and turns your Telegram chaos into a clean, synced task list — Notion, Linear, or wherever you work.
          </p>
          {/* TODO: Add login button */}
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

      {/* Waitlist Section */}
      <section className={styles.waitlist}>
        <div className={styles.waitlistContent}>
          <h2>Get early access</h2>
          {!authenticated ? (
            <div className={styles.waitlistForm}>
              <button 
                onClick={handleSignup}
                className={styles.signupButton}
              >
                Join the waitlist
              </button>
            </div>
          ) : (
            <div className={styles.successMessage}>
              <p>Welcome! You're now on the waitlist. 🚀</p>
              <p className={styles.subtext}>We'll notify you when early access begins.</p>
            </div>
          )}
        </div>
      </section>

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