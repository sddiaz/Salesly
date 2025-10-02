import React, { useState } from 'react';
import { X, MessageSquare, Zap, Send, Lightbulb, TrendingUp, Target } from 'lucide-react';
import './GeneralGrokModal.css';

interface GeneralGrokModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConsultationResponse {
  response: string;
  timestamp: string;
}

const GeneralGrokModal: React.FC<GeneralGrokModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ConsultationResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      // Check if the query is asking for data we can provide from our system
      const lowerQuery = query.toLowerCase();
      let systemData: any = {};
      
      // Try to fetch relevant system data first
      if (lowerQuery.includes('leads') || lowerQuery.includes('pipeline') || lowerQuery.includes('dashboard')) {
        try {
          const dashboardResponse = await fetch('/api/analytics/dashboard');
          if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            systemData.dashboard = dashboardData.stats;
          }
        } catch (err) {
          console.warn('Could not fetch dashboard data:', err);
        }
      }

      if (lowerQuery.includes('leads')) {
        try {
          const leadsResponse = await fetch('/api/leads?limit=1');
          if (leadsResponse.ok) {
            const leadsData = await leadsResponse.json();
            systemData.totalLeads = leadsData.pagination?.total || 0;
          }
        } catch (err) {
          console.warn('Could not fetch leads data:', err);
        }
      }

      const apiResponse = await fetch('/api/grok/consult', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          context: {
            timestamp: new Date().toISOString(),
            source: 'general_consultation',
            systemData: systemData
          }
        }),
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error?.message || 'Failed to get Grok consultation');
      }

      const data = await apiResponse.json();
      setResponse({
        response: data.response,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to consult Grok');
    } finally {
      setLoading(false);
    }
  };

  const handleNewQuery = () => {
    setQuery('');
    setResponse(null);
    setError('');
  };

  const quickQuestions = [
    {
      icon: TrendingUp,
      text: "What are our pipeline trends?",
    },
    {
      icon: Target,
      text: "How can I improve outreach?",
    },
    {
      icon: Lightbulb,
      text: "Quick insights on our lead quality?",
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="general-grok-modal-content">
        <div className="modal-header">
          <div className="header-info">
            <div className="header-icon">
              <Zap size={20} />
            </div>
            <div>
              <h2>Ask Grok AI</h2>
              <p>Your AI-powered sales assistant</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="consultation-content">
          {!response && (
            <form onSubmit={handleSubmit} className="query-form">
              <div className="form-group">
                <label>
                  What can I help you with today?
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about your sales process, leads, strategies, or performance..."
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="quick-questions">
                <p>Quick questions:</p>
                <div className="question-buttons">
                  {quickQuestions.map((question, index) => {
                    const Icon = question.icon;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setQuery(question.text)}
                        className="question-btn"
                      >
                        <Icon size={14} />
                        {question.text}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={onClose} className="btn btn-secondary">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !query.trim()} 
                  className="btn btn-primary"
                >
                  {loading ? (
                    <>
                      Consulting Grok...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Ask Grok
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {response && (
            <div className="response-container">
              <div className="response-header">
                <div className="response-icon">
                  <Zap size={16} />
                </div>
                <span>Grok AI Response</span>
                <div className="response-time">
                  {new Date(response.timestamp).toLocaleTimeString()}
                </div>
              </div>
              
              <div className="response-content">
                {response.response}
              </div>

              <div className="response-actions">
                <button onClick={handleNewQuery} className="btn btn-secondary">
                  Ask Another Question
                </button>
                <button onClick={onClose} className="btn btn-primary">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralGrokModal;
