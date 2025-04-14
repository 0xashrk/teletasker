import React from 'react';
import './SocialProof.css';

const SocialProof: React.FC = () => {
  return (
    <section className="social-proof">
      <div className="social-proof-content">
        <p className="audience">
          Built for founders, ops leads, and Telegram power users who drop too many follow-ups.
        </p>
        <p className="credibility">
          Inspired by a tweet from <a href="https://twitter.com/PareenL" target="_blank" rel="noopener noreferrer">@PareenL</a>
        </p>
      </div>
    </section>
  );
};

export default SocialProof; 