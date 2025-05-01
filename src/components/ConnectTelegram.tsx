import React, { useState } from 'react';
import { sendTelegramVerificationCode } from '../services/api';
import styles from './ConnectTelegram.module.css';

interface ConnectTelegramProps {
  onConnect: () => void;
}

const ConnectTelegram: React.FC<ConnectTelegramProps> = ({ onConnect }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Format phone number to include + if not present
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      await sendTelegramVerificationCode(formattedNumber);
      setShowOtpInput(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // We'll implement this in the next step when we add the verify code endpoint
    // For now, just log the OTP
    console.log('OTP submitted:', otp);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Connect to Telegram</h2>
      <p className={styles.desc}>
        {!showOtpInput 
          ? 'Enter your Telegram phone number to connect your account.'
          : 'Enter the verification code sent to your Telegram account.'
        }
      </p>

      {!showOtpInput ? (
        <form onSubmit={handlePhoneSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className={styles.input}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading || !phoneNumber}
          >
            {isLoading ? 'Sending...' : 'Send Code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 5))}
              placeholder="Enter 5-digit code"
              className={styles.input}
              maxLength={5}
              pattern="\d{5}"
              required
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={isLoading || otp.length !== 5}
          >
            Verify Code
          </button>
          <button 
            type="button"
            className={styles.secondaryButton}
            onClick={() => {
              setShowOtpInput(false);
              setOtp('');
              setError(null);
            }}
          >
            Change Phone Number
          </button>
        </form>
      )}
    </div>
  );
};

export default ConnectTelegram; 