import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { PrivyProvider } from '@privy-io/react-auth';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

root.render(
  isDevelopment ? (
    <React.StrictMode>
      <PrivyProvider
        appId={process.env.REACT_APP_PRIVY_APP_ID!}
        config={{
          loginMethods: ['twitter'],
          appearance: {
            theme: 'light',
            accentColor: '#007AFF',
          },
          embeddedWallets: {
            createOnLogin: 'off',
          },
        }}
      >
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <App />
        </div>
      </PrivyProvider>
    </React.StrictMode>
  ) : (
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID!}
      config={{
        loginMethods: ['twitter'],
        appearance: {
          theme: 'light',
          accentColor: '#007AFF',
        },
        embeddedWallets: {
          createOnLogin: 'off',
        },
      }}
    >
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <App />
      </div>
    </PrivyProvider>
  )
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
