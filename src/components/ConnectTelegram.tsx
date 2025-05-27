import React, { useState, useEffect } from 'react';
import { sendTelegramVerificationCode, verifyTelegramCode, verifyTelegramPassword } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styles from './ConnectTelegram.module.css';

interface ConnectTelegramProps {
  onConnect: () => void;
}

const ConnectTelegram: React.FC<ConnectTelegramProps> = ({ onConnect }) => {
  const { 
    isTelegramConnected, 
    telegramPhoneNumber, 
    setTelegramConnected,
    isCheckingTelegramStatus 
  } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(telegramPhoneNumber || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVerificationInProgress, setPasswordVerificationInProgress] = useState(false);

  useEffect(() => {
    if (!isCheckingTelegramStatus && isTelegramConnected) {
      onConnect();
    }
  }, [isCheckingTelegramStatus, isTelegramConnected, onConnect]);

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
      setTelegramConnected(phoneNumber); // Store in AuthContext
      onConnect(); // Notify parent component
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      // Check for both API response and Telethon error patterns
      if (errorDetail === 'TWO_FACTOR_REQUIRED' || 
          (typeof errorDetail === 'string' && errorDetail.includes('Two-steps verification is enabled and a password is required'))) {
        setShowPasswordInput(true);
        setShowOtpInput(false);
        setError(null);
      } else {
        setError(errorDetail || 'Failed to verify code');
      }
    } finally {
      setVerificationInProgress(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordVerificationInProgress(true);

    try {
      await verifyTelegramPassword(phoneNumber, password);
      setTelegramConnected(phoneNumber); // Store in AuthContext
      onConnect(); // Notify parent component
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify password');
    } finally {
      setPasswordVerificationInProgress(false);
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

  if (isCheckingTelegramStatus) {
    return (
      <div className={styles.card}>
        <h2 className={styles.title}>Checking Connection Status</h2>
        <p className={styles.desc}>
          Verifying your Telegram connection...
        </p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Connect to Telegram</h2>
      <p className={styles.desc}>
        {!showOtpInput && !showPasswordInput
          ? 'Enter your Telegram phone number to connect your account.'
          : showOtpInput 
          ? `Enter the verification code sent to ${phoneNumber}`
          : 'Enter your Telegram 2FA password to complete authentication'
        }
      </p>

      {!showOtpInput && !showPasswordInput ? (
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
      ) : showOtpInput ? (
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
      ) : (
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your 2FA password"
              className={styles.input}
              required
            />
            {error && <p className={styles.error}>{error}</p>}
          </div>
          <button 
            type="submit" 
            className={styles.button}
            disabled={passwordVerificationInProgress || !password}
          >
            {passwordVerificationInProgress ? 'Verifying...' : 'Verify Password'}
          </button>
          <div className={styles.actionButtons}>
            <button 
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setShowPasswordInput(false);
                setShowOtpInput(true);
                setPassword('');
                setError(null);
              }}
            >
              Back to Code
            </button>
            <button 
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setShowPasswordInput(false);
                setShowOtpInput(false);
                setPassword('');
                setOtp('');
                setError(null);
              }}
            >
              Change Phone Number
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConnectTelegram; 