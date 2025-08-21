import React, { useState } from 'react';
import { X, Mail, Phone, Linkedin, Loader2, Copy, Check } from 'lucide-react';
import './OutreachModal.css';

interface OutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: any;
  onMessageSaved?: () => void;
}

interface MessageData {
  subject: string;
  content: string;
  personalization_notes: string[];
  follow_up_suggestions: string[];
}

const OutreachModal: React.FC<OutreachModalProps> = ({ isOpen, onClose, lead, onMessageSaved }) => {
  const [messageType, setMessageType] = useState<'email' | 'linkedin' | 'call_script'>('email');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageData, setMessageData] = useState<MessageData | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const messageTypes = [
    { value: 'email', label: 'Email Outreach', icon: Mail },
    { value: 'linkedin', label: 'LinkedIn Message', icon: Linkedin },
    { value: 'call_script', label: 'Call Script', icon: Phone }
  ];

  const handleGenerateMessage = async () => {
    setLoading(true);
    setError('');
    setMessageData(null);

    try {
      const response = await fetch(`/api/leads/${lead.id}/messages/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: messageType,
          context: {
            company_info: context,
            lead_data: lead
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate message');
      }

      const data = await response.json();
      
      // Enhanced parsing to handle nested JSON responses
      let messageData = data.message_data;
      
      // Check if we need to extract from nested JSON
      if (messageData && typeof messageData.content === 'string' && 
          (messageData.content.includes('"content":') || messageData.content.startsWith('{'))) {
        
        // Try to extract subject first
        let extractedSubject = messageData.subject;
        const subjectMatch = messageData.content.match(/"subject":\s*"([^"]+(?:\\.[^"]*)*)"/);
        if (subjectMatch) {
          extractedSubject = subjectMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
        }
        
        // Try to extract content
        let extractedContent = '';
        const contentMatch = messageData.content.match(/"content":\s*"([^"]+(?:\\.[^"]*)*)"/);
        if (contentMatch) {
          extractedContent = contentMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
        } else {
          // If no content match, try to find any readable text after "content":
          const fallbackMatch = messageData.content.match(/"content":\s*"([^"]*)/);
          if (fallbackMatch) {
            extractedContent = fallbackMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"') + '...';
          } else {
            extractedContent = 'Unable to parse message content. Please try regenerating.';
          }
        }
        
        // Extract personalization notes
        let extractedNotes = messageData.personalization_notes || [];
        const notesMatch = messageData.content.match(/"personalization_notes":\s*\[([\s\S]*?)\]/);
        if (notesMatch) {
          try {
            const notesString = notesMatch[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, ' ');
            const notesArray = JSON.parse(`[${notesString}]`);
            extractedNotes = notesArray;
          } catch (notesParseError) {
            // Keep existing notes
          }
        }
        
        messageData = {
          ...messageData,
          subject: extractedSubject,
          content: extractedContent,
          personalization_notes: extractedNotes
        };
      }
      
      setMessageData(messageData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate message');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!messageData) return;

    try {
      const response = await fetch(`/api/leads/${lead.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: messageType,
          subject: messageData.subject,
          content: messageData.content,
          personalization_data: JSON.stringify(messageData.personalization_notes),
          grok_prompt: `Generated ${messageType} message`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save message');
      }

      setSaved(true);
      if (onMessageSaved) {
        onMessageSaved();
      }
      
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message');
    }
  };

  const handleCopyToClipboard = () => {
    if (!messageData) return;
    
    const textToCopy = messageType === 'email' 
      ? `Subject: ${messageData.subject}\n\n${messageData.content}`
      : messageData.content;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetModal = () => {
    setMessageData(null);
    setError('');
    setSaved(false);
    setCopied(false);
    setContext('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content outreach-modal">
        <div className="modal-header">
          <h2>Generate Outreach Message</h2>
          <button className="modal-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="lead-summary">
            <h3>{lead.first_name} {lead.last_name}</h3>
            <p>{lead.title} at {lead.company}</p>
            <div className="lead-details">
              <span className="detail-item">Industry: {lead.industry}</span>
              <span className="detail-item">Size: {lead.company_size}</span>
              <span className="detail-item">Score: {lead.score}/100</span>
            </div>
          </div>

          <div className="message-type-selector">
            <label>Message Type:</label>
            <div className="type-options">
              {messageTypes.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.value}
                    className={`type-option ${messageType === type.value ? 'active' : ''}`}
                    onClick={() => setMessageType(type.value as any)}
                  >
                    <IconComponent size={16} />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label>Additional Context (optional):</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Add any additional context about the company, recent news, mutual connections, etc."
              rows={3}
            />
          </div>

          <div className="action-buttons">
            <button 
              onClick={handleGenerateMessage} 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  Generating...
                </>
              ) : (
                'Generate Message'
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {messageData && (
            <div className="generated-message">
              <div className="message-header">
                <h4>Generated Message</h4>
                <div className="message-actions">
                  <button 
                    onClick={handleCopyToClipboard}
                    className="btn btn-secondary btn-small"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button 
                    onClick={handleSaveMessage}
                    className="btn btn-primary btn-small"
                  >
                    {saved ? (
                      <>
                        <Check size={16} />
                        Saved!
                      </>
                    ) : (
                      'Save Message'
                    )}
                  </button>
                </div>
              </div>

              {messageType === 'email' && (
                <div className="message-field">
                  <label>Subject:</label>
                  <div className="subject-line">{messageData.subject}</div>
                </div>
              )}

              <div className="message-field">
                <label>Content:</label>
                <div className="message-content">
                  {messageData.content}
                </div>
              </div>

              {messageData.personalization_notes && messageData.personalization_notes.length > 0 && (
                <div className="message-field">
                  <label>Personalization Notes:</label>
                  <ul className="personalization-notes">
                    {messageData.personalization_notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {messageData.follow_up_suggestions && messageData.follow_up_suggestions.length > 0 && (
                <div className="message-field">
                  <label>Follow-up Suggestions:</label>
                  <ul className="follow-up-suggestions">
                    {messageData.follow_up_suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={handleClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutreachModal;
