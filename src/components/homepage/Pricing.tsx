import React from 'react';
import styles from './Pricing.module.css';

interface PricingTier {
  name: string;
  price: string;
  chatLimit: string;
  replyLimit: string;
  features: string[];
  hookLever: string;
  isPopular?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Trial',
    price: '$0',
    chatLimit: '5 chats',
    replyLimit: '200 replies',
    features: [
      '7 days free trial',
      'GPT-4.1 Mini powered',
      'Basic task extraction',
      'Standard support'
    ],
    hookLever: 'Risk-free trial; build habit, show the magic'
  },
  {
    name: 'Starter',
    price: '$9',
    chatLimit: '25 chats',
    replyLimit: '800 replies',
    features: [
      'Everything in Trial, plus:',
      'Extended chat history',
      'Priority support',
      'Custom task templates'
    ],
    hookLever: 'Low friction entry; clear upgrade path',
    isPopular: true
  },
  {
    name: 'Pro',
    price: '$19',
    chatLimit: 'Unlimited',
    replyLimit: '2,000 replies',
    features: [
      'Everything in Starter, plus:',
      'Advanced memory system',
      'Better controls',
      'API access'
    ],
    hookLever: 'For BDs/power users'
  },
  {
    name: 'Team',
    price: '$39',
    chatLimit: 'Unlimited + shared inbox',
    replyLimit: '5,000 replies',
    features: [
      'Everything in Pro, plus:',
      'Shared team inbox',
      'Admin controls',
      'SSO & advanced security',
      'Priority support'
    ],
    hookLever: 'Slack-style admin access'
  }
];

const Pricing: React.FC = () => {
  return (
    <section className={styles.pricing}>
      <div className={styles.header}>
        <h2 className={styles.title}>Simple, transparent pricing</h2>
        <p className={styles.subtitle}>Start with a 7-day trial. No credit card required.</p>
      </div>
      
      <div className={styles.tiersContainer}>
        {pricingTiers.map((tier) => (
          <div 
            key={tier.name} 
            className={`${styles.tier} ${tier.isPopular ? styles.popular : ''}`}
          >
            {tier.isPopular && (
              <div className={styles.popularBadge}>Most Popular</div>
            )}
            
            <div className={styles.tierHeader}>
              <h3 className={styles.tierName}>{tier.name}</h3>
              <div className={styles.priceContainer}>
                <span className={styles.price}>{tier.price}</span>
                {tier.name !== 'Trial' && <span className={styles.period}>/month</span>}
              </div>
            </div>

            <div className={styles.limits}>
              <div className={styles.limit}>
                <span className={styles.limitLabel}>Chat Limit:</span>
                <span className={styles.limitValue}>{tier.chatLimit}</span>
              </div>
              <div className={styles.limit}>
                <span className={styles.limitLabel}>Reply Cap:</span>
                <span className={styles.limitValue}>{tier.replyLimit}</span>
              </div>
            </div>

            <ul className={styles.features}>
              {tier.features.map((feature, index) => (
                <li key={index} className={styles.feature}>
                  <span className={styles.checkmark}>✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className={`${styles.button} ${tier.isPopular ? styles.popularButton : ''}`}>
              {tier.name === 'Trial' ? 'Start Free Trial' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.addon}>
        <div className={styles.addonContent}>
          <h3 className={styles.addonTitle}>Need voice or image replies?</h3>
          <p className={styles.addonDesc}>
            Add GPT-4o capabilities for just $0.04/reply
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing; 