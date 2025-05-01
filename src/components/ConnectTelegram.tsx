import React, { useState } from 'react';
import { sendTelegramVerificationCode, verifyTelegramCode } from '../services/api';
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
  const [verificationInProgress, setVerificationInProgress] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      await sendTelegramVerificationCode(formattedNumber);
      setPhoneNumber(formattedNumber); // Store the formatted number
      setShowOtpInput(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVerificationInProgress(true);

    try {
      await verifyTelegramCode(phoneNumber, otp);
      onConnect(); // Notify parent component of successful connection
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify code');
    } finally {
      setVerificationInProgress(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await sendTelegramVerificationCode(phoneNumber);
      setOtp(''); // Clear previous OTP
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Connect to Telegram</h2>
      <p className={styles.desc}>
        {!showOtpInput 
          ? 'Enter your Telegram phone number to connect your account.'
          : `Enter the verification code sent to ${phoneNumber}`
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
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
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
            disabled={verificationInProgress || otp.length !== 5}
          >
            {verificationInProgress ? 'Verifying...' : 'Verify Code'}
          </button>
          <div className={styles.actionButtons}>
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
            <button 
              type="button"
              className={styles.secondaryButton}
              onClick={handleResendCode}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConnectTelegram; 