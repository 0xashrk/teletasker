import React from 'react';
import styles from './Pricing.module.css';

interface PricingTier {
  name: string;
  price: string;
  chatLimit: string;
  features: string[];
  hookLever: string;
  isRecommended?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Try it free',
    price: '$0',
    chatLimit: '5 chats',
    features: [
      'Monitor up to 5 Telegram chats',
      'Full task extraction features',
      '7-day trial'
    ],
    hookLever: 'Risk-free trial; build habit, show the magic'
  },
  {
    name: 'Essential',
    price: '$10',
    chatLimit: '25 chats',
    features: [
      'Monitor up to 25 Telegram chats',
      'Full task extraction features',
      'Notion workspace integration (coming soon)',
      'Everything in Trial'
    ],
    hookLever: 'Low friction entry; clear upgrade path',
    isRecommended: true
  },
  {
    name: 'Pro',
    price: '$20',
    chatLimit: 'Unlimited',
    features: [
      'Monitor unlimited Telegram chats',
      'Full task extraction features',
      'Multiple Notion workspaces (coming soon)',
      'Priority feature requests',
      'Early access to new features',
      'Everything in Essential'
    ],
    hookLever: 'For BDs/power users'
  }
];

const Pricing: React.FC = () => {
  return (
    <section className={styles.pricing}>
      <div className={styles.header}>
        <h2 className={styles.title}>Choose your plan</h2>
        <p className={styles.subtitle}>Try Teletasker free for 7 days</p>
      </div>
      
      <div className={styles.tiersContainer}>
        {pricingTiers.map((tier) => (
          <div 
            key={tier.name} 
            className={`${styles.tier} ${tier.isRecommended ? styles.recommended : ''}`}
          >
            {tier.isRecommended && (
              <div className={styles.recommendedBadge}>Best Value</div>
            )}
            
            <div className={styles.tierHeader}>
              <h3 className={styles.tierName}>{tier.name}</h3>
              <div className={styles.priceContainer}>
                <span className={styles.price}>{tier.price}</span>
                {tier.name !== 'Try it free' && <span className={styles.period}>/mo</span>}
              </div>
            </div>

            <div className={styles.limits}>
              <div className={styles.limit}>
                <span className={styles.limitValue}>{tier.chatLimit}</span>
                <span className={styles.limitLabel}>monitored</span>
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

            <button className={`${styles.button} ${tier.isRecommended ? styles.recommendedButton : ''}`}>
              {tier.name === 'Try it free' ? 'Start your free trial' : 'Get started'}
            </button>
          </div>
        ))}
      </div>

      {/* <div className={styles.addon}>
        <div className={styles.addonContent}>
          <h3 className={styles.addonTitle}>Need more capabilities?</h3>
          <p className={styles.addonDesc}>
            Add voice and image support for $0.04 per reply
          </p>
        </div>
      </div> */}
    </section>
  );
};

export default Pricing; 