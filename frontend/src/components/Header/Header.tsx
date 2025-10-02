import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="landing-header">
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.5 2L15.5 8L9.5 14L3.5 8L9.5 2Z" fill="currentColor"/>
                <path d="M14.5 10L20.5 16L14.5 22L8.5 16L14.5 10Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="logo-text">Salesly</span>
          </div>
          
          <nav className="main-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#join" className="nav-link">Join</a>
          </nav>

          <div className="header-actions">
            <button className="btn btn-secondary">
              Log In
            </button>
            <button className="btn btn-primary">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};