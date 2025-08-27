import React, { useState } from 'react';
import { Star, Database, Bell, Shield, Settings as SettingsIcon } from 'lucide-react';
import ScoringCriteriaModal from '../../components/ScoringCriteriaModal/ScoringCriteriaModal';
import './Settings.css';

const Settings: React.FC = () => {
  const [showScoringModal, setShowScoringModal] = useState(false);

  const settingsSections = [
    {
      title: 'Lead Scoring',
      description: 'Manage scoring criteria and weights for lead qualification',
      icon: Star,
      action: () => setShowScoringModal(true),
      buttonText: 'Manage Criteria'
    },
    {
      title: 'Database Management',
      description: 'View database statistics and manage data',
      icon: Database,
      action: () => alert('Database management coming soon...'),
      buttonText: 'View Stats'
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and notification preferences',
      icon: Bell,
      action: () => alert('Notification settings coming soon...'),
      buttonText: 'Configure'
    },
    {
      title: 'Security',
      description: 'API keys, authentication, and security settings',
      icon: Shield,
      action: () => alert('Security settings coming soon...'),
      buttonText: 'Manage'
    }
  ];

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="header-content">
          <div className="header-icon">
            <SettingsIcon size={32} />
          </div>
          <div>
            <h1>Settings</h1>
            <p>Configure your Grok SDR system preferences and settings</p>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        {settingsSections.map((section, index) => {
          const IconComponent = section.icon;
          return (
            <div key={index} className="settings-card">
              <div className="card-icon">
                <IconComponent size={24} />
              </div>
              <div className="card-content">
                <h3>{section.title}</h3>
                <p>{section.description}</p>
              </div>
              <div className="card-action">
                <button 
                  onClick={section.action}
                  className="btn btn-outline"
                >
                  {section.buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="system-info">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Version:</label>
            <span>1.0.0</span>
          </div>
          <div className="info-item">
            <label>AI Model:</label>
            <span>Grok-3-Mini</span>
          </div>
          <div className="info-item">
            <label>Database:</label>
            <span>SQLite</span>
          </div>
          <div className="info-item">
            <label>Environment:</label>
            <span>Development</span>
          </div>
        </div>
      </div>

      <ScoringCriteriaModal
        isOpen={showScoringModal}
        onClose={() => setShowScoringModal(false)}
        onCriteriaUpdated={() => {
          // Could refresh any criteria-dependent data here
          console.log('Scoring criteria updated');
        }}
      />
    </div>
  );
};

export default Settings;
