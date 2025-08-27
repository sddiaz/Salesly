import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  Linkedin, 
  MessageSquare, 
  Target, 
  Activity,
  Calendar,
  Star,
  Send,
  ChevronDown,
  Copy,
  Eye
} from 'lucide-react';
import OutreachModal from '../../components/OutreachModal/OutreachModal';
import GrokConsultModal from '../../components/GrokConsultModal/GrokConsultModal';
import './LeadDetail.css';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  title: string;
  industry: string;
  company_size: string;
  phone: string;
  linkedin_url: string;
  website: string;
  status: string;
  score: number;
  created_at: string;
  updated_at: string;
  activities: LeadActivity[];
  messages: Message[];
}

interface LeadActivity {
  id: number;
  type: string;
  subject: string;
  content: string;
  status: string;
  created_at: string;
  completed_at?: string;
}

interface Message {
  id: number;
  type: string;
  subject: string;
  content: string;
  created_at: string;
  sent_at?: string;
}

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOutreachModal, setShowOutreachModal] = useState(false);
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [scoringLead, setScoringLead] = useState(false);
  const [showScoringModal, setShowScoringModal] = useState(false);
  const [customScoringPrompt, setCustomScoringPrompt] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<number | null>(null);

  const pipelineStages = [
    { value: 'new', label: 'New', color: '#6c757d' },
    { value: 'contacted', label: 'Contacted', color: '#007bff' },
    { value: 'qualified', label: 'Qualified', color: '#28a745' },
    { value: 'proposal', label: 'Proposal', color: '#ffc107' },
    { value: 'negotiation', label: 'Negotiation', color: '#fd7e14' },
    { value: 'won', label: 'Won', color: '#28a745' },
    { value: 'lost', label: 'Lost', color: '#dc3545' }
  ];

  const fetchLeadDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch lead details');
      }
      
      const data = await response.json();
      setLead(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lead details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
    }
  }, [id, fetchLeadDetails]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showStatusDropdown && !target.closest('.status-container')) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showStatusDropdown]);

  const handleScoreLead = async (useCustomCriteria = false) => {
    if (!lead) return;
    
    setScoringLead(true);
    try {
      const requestBody: any = {};
      
      if (useCustomCriteria && customScoringPrompt.trim()) {
        // Create custom criteria based on user prompt
        requestBody.custom_criteria = [
          {
            name: "Custom Scoring",
            description: customScoringPrompt.trim(),
            weight: 2.0
          }
        ];
      }
      
      const response = await fetch(`/api/leads/${lead.id}/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to score lead');
      }

      await fetchLeadDetails(); // Refresh lead data
      setShowScoringModal(false);
      setCustomScoringPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to score lead');
    } finally {
      setScoringLead(false);
    }
  };

  const handleStatusChange = async (newStatus: string, notes?: string) => {
    if (!lead || newStatus === lead.status) return;
    
    setUpdatingStatus(true);
    setShowStatusDropdown(false);
    
    try {
      const response = await fetch(`/api/leads/${lead.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || `Status changed from ${lead.status} to ${newStatus}`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }

      await fetchLeadDetails(); // Refresh lead data to show new status and activity
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCopyMessage = (message: Message) => {
    const fullMessage = message.subject 
      ? `Subject: ${message.subject}\n\n${message.content}`
      : message.content;
    
    navigator.clipboard.writeText(fullMessage);
    setCopiedMessageId(message.id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'new': '#6c757d',
      'contacted': '#007bff',
      'qualified': '#28a745',
      'proposal': '#ffc107',
      'negotiation': '#fd7e14',
      'won': '#28a745',
      'lost': '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#ffc107';
    if (score >= 40) return '#fd7e14';
    return '#dc3545';
  };

  if (loading) {
    return (
      <div className="lead-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="lead-detail-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error || 'Lead not found'}</p>
          <button onClick={() => navigate('/leads')} className="btn btn-primary">
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-detail-container">
      <div className="lead-detail-header">
        <button onClick={() => navigate('/leads')} className="back-btn">
          <ArrowLeft size={20} />
          Back to Leads
        </button>
        <div className="lead-actions">
          <button 
            onClick={() => setShowOutreachModal(true)}
            className="btn btn-primary"
          >
            <Send size={16} />
            Generate Outreach
          </button>
          <button 
            onClick={() => setShowGrokModal(true)}
            className="btn btn-secondary"
          >
            <MessageSquare size={16} />
            Ask Grok
          </button>
        </div>
      </div>

      <div className="lead-detail-content">
        <div className="lead-info-card">
          <div className="lead-header">
            <div className="lead-avatar">
              <User size={32} />
            </div>
            <div className="lead-basic-info">
              <h1>{lead.first_name} {lead.last_name}</h1>
              <p className="lead-title">{lead.title}</p>
              <p className="lead-company">
                <Building size={16} />
                {lead.company}
              </p>
            </div>
            <div className="lead-status-score">
              <div className="status-container">
                <div 
                  className="status-badge clickable" 
                  style={{ backgroundColor: getStatusColor(lead.status) }}
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                >
                  {updatingStatus ? 'Updating...' : lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  <ChevronDown size={14} className="status-chevron" />
                </div>
                
                {showStatusDropdown && (
                  <div className="status-dropdown">
                    <div className="status-dropdown-header">
                      <span>Change Status</span>
                      <button 
                        onClick={() => setShowStatusDropdown(false)}
                        className="dropdown-close"
                      >
                        ×
                      </button>
                    </div>
                    <div className="status-options">
                      {pipelineStages.map((stage) => (
                        <button
                          key={stage.value}
                          className={`status-option ${stage.value === lead.status ? 'current' : ''}`}
                          onClick={() => handleStatusChange(stage.value)}
                          disabled={updatingStatus}
                          style={{ 
                            borderLeft: `4px solid ${stage.color}`,
                            opacity: stage.value === lead.status ? 0.6 : 1
                          }}
                        >
                          <span className="status-label">{stage.label}</span>
                          {stage.value === lead.status && (
                            <span className="current-badge">Current</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="score-container">
                <div className="score-circle" style={{ color: getScoreColor(lead.score) }}>
                  <Star size={20} />
                  <span>{lead.score || 0}</span>
                </div>
                <button 
                  onClick={() => setShowScoringModal(true)}
                  className="btn btn-primary btn-small"
                >
                  Score ✨
                </button>
                
                {showScoringModal && (
                  <div className="scoring-modal">
                    <div className="scoring-modal-content">
                      <div className="form-group">
                        <label>Custom Scoring Criteria (optional):</label>
                        <textarea
                          value={customScoringPrompt}
                          onChange={(e) => setCustomScoringPrompt(e.target.value)}
                          placeholder="Describe what's important for scoring this lead (e.g., 'Focus on company growth potential and decision-making authority'). Leave blank to use default AI scoring."
                          rows={3}
                        />
                      </div>
                      <div className="scoring-modal-actions">
                        <button 
                          onClick={() => handleScoreLead(customScoringPrompt.trim() !== '')}
                          disabled={scoringLead}
                          className="btn btn-primary btn-small"
                        >
                          {scoringLead ? 'Scoring...' : 'Confirm'}
                        </button>
                        <button 
                          onClick={() => {
                            setShowScoringModal(false);
                            setCustomScoringPrompt('');
                          }}
                          className="btn btn-secondary btn-small"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lead-details-grid">
            <div className="detail-item">
              <Mail size={16} />
              <div>
                <label>Email</label>
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              </div>
            </div>
            
            {lead.phone && (
              <div className="detail-item">
                <Phone size={16} />
                <div>
                  <label>Phone</label>
                  <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                </div>
              </div>
            )}
            
            <div className="detail-item">
              <Building size={16} />
              <div>
                <label>Industry</label>
                <span>{lead.industry || 'Not specified'}</span>
              </div>
            </div>
            
            <div className="detail-item">
              <Target size={16} />
              <div>
                <label>Company Size</label>
                <span>{lead.company_size || 'Not specified'}</span>
              </div>
            </div>
            
            {lead.website && (
              <div className="detail-item">
                <Globe size={16} />
                <div>
                  <label>Website</label>
                  <a href={lead.website} target="_blank" rel="noopener noreferrer">
                    {lead.website}
                  </a>
                </div>
              </div>
            )}
            
            {lead.linkedin_url && (
              <div className="detail-item">
                <Linkedin size={16} />
                <div>
                  <label>LinkedIn</label>
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer">
                    View Profile
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lead-timeline">
          <div className="timeline-section">
            <h3>
              <MessageSquare size={20} />
              Messages ({lead.messages?.length || 0})
            </h3>
            {lead.messages && lead.messages.length > 0 ? (
              <div className="timeline-items">
                {lead.messages.map((message) => (
                  <div key={message.id} className="timeline-item message-item">
                    <div className="timeline-icon message">
                      <Mail size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="message-summary">
                        <div className="message-info">
                          <h4 className="message-subject">
                            {message.subject || `${message.type.charAt(0).toUpperCase() + message.type.slice(1)} Message`}
                          </h4>
                          <span className="message-date">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                          {message.sent_at && (
                            <span className="sent-badge">Sent</span>
                          )}
                        </div>
                        <div className="message-actions">
                          <button
                            onClick={() => setExpandedMessageId(
                              expandedMessageId === message.id ? null : message.id
                            )}
                            className="btn btn-ghost btn-small"
                            title="View full message"
                          >
                            <Eye size={14} />
                            {expandedMessageId === message.id ? 'Hide' : 'View'}
                          </button>
                          <button
                            onClick={() => handleCopyMessage(message)}
                            className="btn btn-ghost btn-small"
                            title="Copy entire message"
                          >
                            <Copy size={14} />
                            {copiedMessageId === message.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </div>
                      
                      {expandedMessageId === message.id && (
                        <div className="message-full-content">
                          <p>{message.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No messages yet. Generate your first outreach message!</p>
              </div>
            )}
          </div>

          <div className="timeline-section">
            <h3>
              <Activity size={20} />
              Activity Log ({lead.activities?.length || 0})
            </h3>
            {lead.activities && lead.activities.length > 0 ? (
              <div className="timeline-items">
                {lead.activities.map((activity) => (
                  <div key={activity.id} className="timeline-item">
                    <div className="timeline-icon activity">
                      <Calendar size={16} />
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-header">
                        <h4>{activity.subject || activity.type}</h4>
                        <span className="timeline-date">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.content && <p>{activity.content}</p>}
                      <div className="activity-status">
                        Status: <span className={`status-${activity.status}`}>
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No activities recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <OutreachModal
        isOpen={showOutreachModal}
        onClose={() => setShowOutreachModal(false)}
        lead={lead}
        onMessageSaved={() => {
          fetchLeadDetails();
          // Auto-update status to 'contacted' if currently 'new' and message is saved
          if (lead?.status === 'new') {
            handleStatusChange('contacted', 'Automatically updated to contacted after sending outreach message');
          }
        }}
      />

      <GrokConsultModal
        isOpen={showGrokModal}
        onClose={() => setShowGrokModal(false)}
        leadId={lead.id}
        leadName={`${lead.first_name} ${lead.last_name}`}
      />
    </div>
  );
};

export default LeadDetail;
