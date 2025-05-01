import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './LoginButton.css';

interface LoginButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  variant = 'primary',
  className = ''
}) => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login();
      if (isAuthenticated) {
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
      {isAuthenticated ? 'Go to Dashboard' : 'Login'}
    </button>
  );
};

export default LoginButton; 