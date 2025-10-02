import React, { useEffect, useRef } from 'react';
import { Upload, Brain, Mail, CheckCircle } from 'lucide-react';
import './HowItWorks.css';

const steps = [
  {
    icon: <Upload size={32} />,
    number: "01",
    title: "Import Your Leads",
    description: "Upload your lead list or integrate with your existing CRM in seconds",
  },
  {
    icon: <Brain size={32} />,
    number: "02",
    title: "AI Analysis",
    description: "Our AI scores and prioritizes leads based on conversion probability",
  },
  {
    icon: <Mail size={32} />,
    number: "03",
    title: "Automated Outreach",
    description: "Send personalized messages crafted by AI for each individual lead",
  },
  {
    icon: <CheckCircle size={32} />,
    number: "04",
    title: "Close Deals",
    description: "Track engagement, optimize your approach, and watch your pipeline grow",
  },
];

export const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
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

    const stepCards = document.querySelectorAll('.step-card');
    const timelineDots = document.querySelectorAll('.timeline-dot');
    const timelineLine = document.querySelector('.timeline-line');
    const sectionTitle = document.querySelector('.how-it-works-header');

    if (sectionTitle) observer.observe(sectionTitle);
    if (timelineLine) observer.observe(timelineLine);
    stepCards.forEach((card) => observer.observe(card));
    timelineDots.forEach((dot) => observer.observe(dot));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="how-it-works-section"
    >
      <div className="container">
        <div className="how-it-works-header">
          <h2 className="how-it-works-title">
            Simple Yet <span className="powerful-text">Powerful</span>
          </h2>
          <p className="how-it-works-subtitle">
            Get started in <b>minutes</b> with our streamlined workflow
          </p>
        </div>

        <div className="steps-container">
          <div className="timeline-line" />
          {steps.map((step, index) => (
            <div key={index} className="step-wrapper">
              <div className="timeline-dot" style={{ animationDelay: `${index * 0.2}s` }} />
              <div className="step-card" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="step-icon-wrapper">
                  <div className="step-icon">
                    {step.icon}
                  </div>
                </div>

                <div className="step-content">
                  <div className="step-header">
                    <span className="step-number">{step.number}</span>
                    <h3 className="step-title">{step.title}</h3>
                  </div>
                  <p className="step-description">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};