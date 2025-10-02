import React, { useEffect, useRef } from 'react';
import './Hero.css';

export const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple animation without GSAP - using CSS animations
    const elements = [titleRef.current, subtitleRef.current, ctaRef.current];
    elements.forEach((el, index) => {
      if (el) {
        el.style.animationDelay = `${index * 0.2}s`;
        el.classList.add('hero-animate');
      }
    });
  }, []);

  return (
    <section ref={heroRef} className="hero-section">
      {/* Animated Background */}
      <div className="hero-background">
        <div className="hero-overlay" />
        <div className="floating-orb floating-orb-1" />
        <div className="floating-orb floating-orb-2" />
      </div>

      {/* Content */}
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.5 2L15.5 8L9.5 14L3.5 8L9.5 2Z" fill="currentColor"/>
              <path d="M14.5 10L20.5 16L14.5 22L8.5 16L14.5 10Z" fill="currentColor"/>
            </svg>
            <span>AI-Powered Sales Intelligence</span>
          </div>

          <h1 ref={titleRef} className="hero-title">
            Transform Your Sales with{" "}
            <span className="hero-gradient-text">AI Magic</span>
          </h1>

          <p ref={subtitleRef} className="hero-subtitle">
            Automate lead scoring, generate personalized outreach, and close deals faster with our intelligent sales platform
          </p>

          <div ref={ctaRef} className="hero-cta">
            <button className="btn btn-primary btn-large">
              Get Started Free
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="btn btn-secondary btn-large">
              Watch Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">10K+</span>
              <p className="stat-label">Active Users</p>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">500K+</span>
              <p className="stat-label">Leads Scored</p>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">99.9%</span>
              <p className="stat-label">Uptime</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};