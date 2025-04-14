import React from 'react';
import './Mockup.css';

const Mockup: React.FC = () => {
  return (
    <section className="mockup">
      <div className="mockup-content">
        <div className="mockup-container">
          <div className="telegram-mockup">
            <div className="chat-header">
              <span className="chat-title">Telegram Group Chat</span>
            </div>
            <div className="chat-messages">
              <div className="message">
                <span className="sender">@Pareen</span>
                <p>Can you send me the pitch deck by EOD?</p>
              </div>
              <div className="message">
                <span className="sender">@Alex</span>
                <p>Sure, I'll get that to you</p>
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
                <span className="task-source">From @Pareen</span>
                <p>Send pitch deck</p>
                <span className="task-due">Due: Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mockup; 