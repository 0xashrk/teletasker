import React from 'react';
import './Waitlist.css';
import { usePrivy } from '@privy-io/react-auth';

const Waitlist: React.FC = () => {
  const { login, authenticated } = usePrivy();

  const handleSignup = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Error during signup:', error);
    }
  };

  return (
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
  );
};

export default Waitlist; 