import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from './LoginButton';
import './HomePage.css';

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
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            <span className="telegram-emoji">🤖</span> Your Telegram chats, turned into todos and replies
          </h1>
          <p className="subheadline">
            Never miss a follow-up again. Your AI assistant reads your chats, replies to messages, and turns your Telegram chaos into a clean, synced task list — Notion, Linear, or wherever you work.
          </p>
          {/* TODO: Add login button */}
          {/* <div className="hero-actions">
            <LoginButton variant="primary" className="hero-login-button" />
          </div> */}
        </div>
      </section>

      {/* Mockup Section */}
      <section className="mockup">
        <div className="mockup-content">
          <div className="mockup-container">
            <div className="telegram-mockup">
              <div className="chat-header">
                <span className="chat-title">Telegram Group Chat</span>
              </div>
              <div className="chat-messages">
                <div className="message">
                  <span className="sender">@Sarah</span>
                  <p>Hey team, can you review the product specs by tomorrow?</p>
                </div>
                <div className="message">
                  <span className="sender">@Alex</span>
                  <p>Will do! I'll share my feedback first thing tomorrow 👍</p>
                </div>
              </div>
            </div>
            <div className="arrow">→</div>
            <div className="task-mockup">
              <div className="task-header">
                <span className="task-title">Extracted Tasks</span>
              </div>
              <div className="task-list">
                <div className="task">
                  <span className="task-source">From @Sarah</span>
                  <p>Review product specs</p>
                  <span className="task-due">Due: Tomorrow</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist Section */}
      <section className="waitlist">
        <div className="waitlist-content">
          <h2>Get early access</h2>
          {!authenticated ? (
            <div className="waitlist-form">
              <button 
                onClick={handleSignup}
                className="signup-button"
              >
                Join the waitlist
              </button>
            </div>
          ) : (
            <div className="success-message">
              <p>Welcome! You're now on the waitlist. 🚀</p>
              <p className="subtext">We'll notify you when early access begins.</p>
            </div>
          )}
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="social-proof">
        <div className="social-proof-content">
          <p className="audience">
            Built for founders, ops leads, and Telegram power users who drop too many follow-ups.
          </p>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 