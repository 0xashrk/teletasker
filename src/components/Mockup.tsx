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
                <span className="sender">@Sarah</span>
                <p>Hey team, can you review the product specs by tomorrow?</p>
              </div>
              <div className="message">
                <span className="sender">@Alex</span>
                <p>Will do! I'll share my feedback first thing tomorrow 👍</p>
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
                <span className="task-source">From @Sarah</span>
                <p>Review product specs</p>
                <span className="task-due">Due: Tomorrow</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Mockup; 