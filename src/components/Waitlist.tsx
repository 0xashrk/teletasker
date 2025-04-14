import React, { useState } from 'react';
import './Waitlist.css';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission
    console.log('Email submitted:', email);
    setIsSubmitted(true);
  };

  return (
    <section className="waitlist">
      <div className="waitlist-content">
        <h2>Join early access beta</h2>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="waitlist-form">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            <button type="submit">Get Early Access</button>
          </form>
        ) : (
          <div className="success-message">
            <p>Thanks for joining! We'll be in touch soon. 🚀</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Waitlist; 