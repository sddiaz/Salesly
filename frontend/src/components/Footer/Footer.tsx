import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <div className="logo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.5 2L15.5 8L9.5 14L3.5 8L9.5 2Z" fill="currentColor"/>
                    <path d="M14.5 10L20.5 16L14.5 22L8.5 16L14.5 10Z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="logo-text">Salesly</span>
              </div>
              <p className="footer-description">
                Transform your sales process with AI-powered intelligence. 
                Close more deals, faster.
              </p>
            </div>

            <div className="footer-links">
              <div className="footer-column">
                <h4 className="footer-title">Product</h4>
                <ul className="footer-list">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#join">Join</a></li>
                  <li><a href="#integrations">Integrations</a></li>
                  <li><a href="#api">API</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-title">Company</h4>
                <ul className="footer-list">
                  <li><a href="#about">About Us</a></li>
                  <li><a href="#careers">Careers</a></li>
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-title">Resources</h4>
                <ul className="footer-list">
                  <li><a href="#help">Help Center</a></li>
                  <li><a href="#docs">Documentation</a></li>
                  <li><a href="#community">Community</a></li>
                  <li><a href="#status">Status</a></li>
                </ul>
              </div>

              <div className="footer-column">
                <h4 className="footer-title">Legal</h4>
                <ul className="footer-list">
                  <li><a href="#privacy">Privacy Policy</a></li>
                  <li><a href="#terms">Terms of Service</a></li>
                  <li><a href="#security">Security</a></li>
                  <li><a href="#compliance">Compliance</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p className="footer-copyright">
                © 2024 Salesly. All rights reserved.
              </p>
              <div className="footer-social">
                <a href="https://twitter.com" className="social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 3A10.9 10.9 0 0 1 20.1 4.7A4.5 4.5 0 0 0 22.46 2A9 9 0 0 1 19.36 3.74A4.5 4.5 0 0 0 12.93 8.7A12.8 12.8 0 0 1 1.64 2.25A4.5 4.5 0 0 0 3 8.72A4.47 4.47 0 0 1 .96 8.1V8.3A4.5 4.5 0 0 0 4.58 12.6A4.36 4.36 0 0 1 2.94 13A4.5 4.5 0 0 0 7.14 16.29A9 9 0 0 1 1 18.36A12.73 12.73 0 0 0 7.88 20.5C17.64 20.5 23.11 12.5 23.11 5.5V4.93A9.16 9.16 0 0 0 25 1.85L23 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" className="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 8A6 6 0 0 1 22 14V21H18V14A2 2 0 0 0 14 14V21H10V9H14V11A6 6 0 0 1 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="2" y="9" width="4" height="12" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </a>
                <a href="https://github.com" className="social-link" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19C4 20.5 4 16.5 2 16M22 16V19A2 2 0 0 1 20 21H16A2 2 0 0 1 14 19V18.35A2.18 2.18 0 0 0 13.65 16.04C9.83 16.2 8 14.27 8 9.26A7.15 7.15 0 0 1 10 5.67A6.32 6.32 0 0 1 10.2 2.28C10.2 2.28 11.17 1.99 14 4.1A19.73 19.73 0 0 1 18 4A19.73 19.73 0 0 1 22 4.1C24.83 1.99 25.8 2.28 25.8 2.28A6.32 6.32 0 0 1 26 5.67A7.15 7.15 0 0 1 28 9.26C28 14.27 26.17 16.2 22.35 16.04A2.18 2.18 0 0 0 22 18.35V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};