import React, { useEffect, useRef } from 'react';
import './Features.css';

const features = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.5 2L15.5 8L9.5 14L3.5 8L9.5 2Z" fill="currentColor"/>
        <path d="M14.5 10L20.5 16L14.5 22L8.5 16L14.5 10Z" fill="currentColor"/>
      </svg>
    ),
    title: "AI Lead Scoring",
    description: "Intelligent qualification assessment that prioritizes your best opportunities automatically",
    color: "from-primary to-accent",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15A2 2 0 0 1 19 17H7A2 2 0 0 1 5 15V9A2 2 0 0 1 7 7H19A2 2 0 0 1 21 9V15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 10L12 13L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Personalized Outreach",
    description: "Generate custom messages tailored to each lead's profile and engagement history",
    color: "from-secondary to-accent",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/>
        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
    title: "Lead Management",
    description: "Comprehensive CRM with full CRUD operations and detailed lead data tracking",
    color: "from-accent to-primary",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3V21L12 17L21 21V3H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 7L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M9 11L15 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Real-time Analytics",
    description: "Live dashboard with pipeline visualization and performance metrics",
    color: "from-success to-secondary",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Activity Tracking",
    description: "Complete interaction history and engagement tracking for every lead",
    color: "from-primary to-secondary",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "AI Consultation",
    description: "Interactive AI assistant providing strategic insights and recommendations",
    color: "from-secondary to-success",
  },
];

export const Features: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simple intersection observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card) => observer.observe(card));

    if (titleRef.current) observer.observe(titleRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="features-section"
    >
      <div className="container">
        <div ref={titleRef} className="features-header">
          <h2 className="features-title">
            Everything You Need to{" "}
            <span className="hero-gradient-text">Close More Deals</span>
          </h2>
          <p className="features-subtitle">
            Powerful features designed to supercharge your sales process
          </p>
        </div>

        <div ref={cardsRef} className="features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`feature-icon gradient-${index % 6}`}>
                {feature.icon}
              </div>
              
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};