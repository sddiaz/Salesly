import React from 'react';
import './CTA.css';

export const CTA: React.FC = () => {
  return (
    <section className="cta-section">
      <div className="cta-background">
        <div className="cta-orb cta-orb-1" />
        <div className="cta-orb cta-orb-2" />
      </div>
      
      <div className="container">
        <div className="cta-content">
          <div className="cta-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 2L15.5 8L9.5 14L3.5 8L9.5 2Z" fill="currentColor"/>
              <path d="M14.5 10L20.5 16L14.5 22L8.5 16L14.5 10Z" fill="currentColor"/>
            </svg>
            <span>Ready to Transform Your Sales?</span>
          </div>

          <h2 className="cta-title">
            Start Closing More Deals{" "}
            <span className="hero-gradient-text">Today</span>
          </h2>

          <p className="cta-subtitle">
            Join thousands of sales teams who have already transformed their process with AI-powered intelligence
          </p>

          <div className="cta-actions">
            <button className="btn btn-primary btn-large">
              Get Started Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn btn-secondary btn-large">
              Schedule Demo
            </button>
          </div>

          <div className="cta-features">
            <div className="cta-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="cta-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>14-day free trial</span>
            </div>
            <div className="cta-feature">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Setup in under 5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};