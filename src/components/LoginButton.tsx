import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import './LoginButton.css';

interface LoginButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  variant = 'primary',
  className = ''
}) => {
  const { login, authenticated } = usePrivy();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login();
      if (authenticated) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  return (
    <button 
      onClick={handleLogin}
      className={`login-button ${variant} ${className}`}
    >
      {authenticated ? 'Go to Dashboard' : 'Login'}
    </button>
  );
};

export default LoginButton; 