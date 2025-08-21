import React, { useState } from 'react';
import { X, MessageSquare, Zap, Send } from 'lucide-react';
import './GrokConsultModal.css';

interface GrokConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: number;
  leadName: string;
}

interface ConsultationResponse {
  response: string;
  timestamp: string;
}

const GrokConsultModal: React.FC<GrokConsultModalProps> = ({ 
  isOpen, 
  onClose, 
  leadId, 
  leadName 
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
      const apiResponse = await fetch(`/api/leads/${leadId}/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: query.trim(),
          context: {
            timestamp: new Date().toISOString(),
            source: 'lead_consultation'
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="grok-modal-content">
        <div className="modal-header">
          <div className="header-info">
            <div className="header-icon">
              <Zap size={20} />
            </div>
            <div>
              <h2>Consult Grok AI</h2>
              <p>Ask Grok about {leadName}</p>
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
                  What would you like to know about this lead?
                </label>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., What's the best approach to reach out to this lead? What are their potential pain points?"
                  rows={4}
                  disabled={loading}
                />
              </div>

              <div className="quick-questions">
                <p>Quick questions:</p>
                <div className="question-buttons">
                  <button
                    type="button"
                    onClick={() => setQuery("What's the best outreach strategy for this lead?")}
                    className="question-btn"
                  >
                    Outreach Strategy
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("What are this lead's likely pain points?")}
                    className="question-btn"
                  >
                    Pain Points
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuery("How should I personalize my message for this lead?")}
                    className="question-btn"
                  >
                    Personalization
                  </button>
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

export default GrokConsultModal;
