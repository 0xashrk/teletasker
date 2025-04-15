import React from 'react';
import './Hero.css';

const Hero: React.FC = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          <span className="telegram-emoji">🤖</span> Your Telegram chats, turned into todos and replies
        </h1>
        <p className="subheadline">
          Never miss a follow-up again. Your AI assistant reads your chats, replies to messages, and turns your Telegram chaos into a clean, synced task list — Notion, Linear, or wherever you work.
        </p>
      </div>
    </section>
  );
};

export default Hero; 