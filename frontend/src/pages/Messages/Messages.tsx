import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import { 
  Search, 
  Mail, 
  MessageSquare, 
  User, 
  Calendar, 
  Filter,
  X,
  Copy,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import './Messages.css';

interface SearchResult {
  messages: Message[];
  conversations: Conversation[];
  leads: Lead[];
}

interface Message {
  id: number;
  lead_id: number;
  type: string;
  subject: string;
  content: string;
  created_at: string;
  sent_at?: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
}

interface Conversation {
  id: number;
  lead_id: number;
  query: string;
  response: string;
  model_used: string;
  created_at: string;
  first_name: string;
  last_name: string;
  company: string;
  email: string;
}

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  industry: string;
  email: string;
  status: string;
  message_count: number;
  conversation_count: number;
  created_at: string;
}

const Messages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult>({ messages: [], conversations: [], leads: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'messages' | 'conversations' | 'leads'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLead, setSelectedLead] = useState('');
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [totalCounts, setTotalCounts] = useState<{[key: string]: number}>({});
  const [hasSearched, setHasSearched] = useState(false);

  const searchTypes = [
    { value: 'all', label: 'All Results', icon: Search },
    { value: 'messages', label: 'Messages', icon: Mail },
    { value: 'conversations', label: 'Grok Chats', icon: MessageSquare },
    { value: 'leads', label: 'Leads', icon: User }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters long');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type: searchType,
        limit: '50'
      });

      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (selectedLead) params.append('lead_id', selectedLead);

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results);
      setTotalCounts(data.totalCounts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults({ messages: [], conversations: [], leads: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleExpanded = (type: string, id: number) => {
    const key = `${type}-${id}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyToClipboard = (text: string, itemKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemKey);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedLead('');
    setShowFilters(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="search-highlight">{part}</mark> : 
        part
    );
  };

  return (
    <div className="messages-page">
      <div className="messages-header">
        <div className="header-content">
          <h1>Search Messages & Conversations</h1>
          <p>Find previous outreach messages, Grok consultations, and lead information</p>
        </div>
      </div>

      {/* Search Interface */}
      <div className="search-container">
        <div className="search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search messages, conversations, leads... (e.g., 'healthcare', 'proposal', 'Walmart')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="clear-search"
              >
                <X size={16} />
              </button>
            )}
            <button 
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="search-button"
              title={loading ? 'Searching...' : 'Search'}
            >
              <Search size={18} />
            </button>
          </div>
        </div>

        {/* Search Type Selector */}
        <div className="search-types">
          {searchTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setSearchType(type.value as any)}
                className={`search-type-btn ${searchType === type.value ? 'active' : ''}`}
              >
                <Icon size={16} />
                {type.label}
                {totalCounts[type.value] !== undefined && (
                  <span className="result-count">({totalCounts[type.value]})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="filters-section">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="filters-toggle"
          >
            <Filter size={16} />
            Filters
            <ChevronDown size={14} className={`chevron ${showFilters ? 'expanded' : ''}`} />
          </button>

          {showFilters && (
            <div className="filters-panel">
              <div className="filter-group">
                <label>Date Range:</label>
                <div className="date-inputs">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="From"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="To"
                  />
                </div>
              </div>
              
              <div className="filter-actions">
                <button onClick={clearFilters} className="btn btn-secondary btn-small">
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && hasSearched && (
        <div className="search-loading">
          <LoadingSpinner message="Searching..." size="medium" centered={false} />
        </div>
      )}

      {/* Results */}
      {hasSearched && !loading && (
        <div className="search-results">
          {/* Messages Results */}
          {(searchType === 'all' || searchType === 'messages') && searchResults.messages.length > 0 && (
            <div className="results-section">
              <h3 className="results-title">
                <Mail size={18} />
                Messages ({searchResults.messages.length})
              </h3>
              <div className="results-list">
                {searchResults.messages.map((message) => (
                  <div key={`message-${message.id}`} className="result-item message-result">
                    <div className="result-header">
                      <div className="result-info">
                        <h4 className="result-title">
                          {highlightText(message.subject || `${message.type} message`, searchQuery)}
                        </h4>
                        <div className="result-meta">
                          <Link to={`/leads/${message.lead_id}`} className="lead-link">
                            <User size={14} />
                            {message.first_name} {message.last_name} · {message.company}
                          </Link>
                          <span className="result-date">
                            <Calendar size={14} />
                            {formatDate(message.created_at)}
                          </span>
                          <span className={`message-type type-${message.type}`}>
                            {message.type}
                          </span>
                        </div>
                      </div>
                      <div className="result-actions">
                        <button
                          onClick={() => toggleExpanded('message', message.id)}
                          className="btn btn-ghost btn-small"
                        >
                          {expandedItems[`message-${message.id}`] ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(
                            message.subject ? `${message.subject}\n\n${message.content}` : message.content,
                            `message-${message.id}`
                          )}
                          className="btn btn-ghost btn-small"
                        >
                          <Copy size={14} />
                          {copiedItem === `message-${message.id}` ? 'Copied!' : 'Copy'}
                        </button>
                        <Link to={`/leads/${message.lead_id}`} className="btn btn-ghost btn-small">
                          <ExternalLink size={14} />
                          View Lead
                        </Link>
                      </div>
                    </div>
                    
                    {expandedItems[`message-${message.id}`] && (
                      <div className="result-content">
                        <div className="content-text">
                          {highlightText(message.content, searchQuery)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversations Results */}
          {(searchType === 'all' || searchType === 'conversations') && searchResults.conversations.length > 0 && (
            <div className="results-section">
              <h3 className="results-title">
                <MessageSquare size={18} />
                Grok Conversations ({searchResults.conversations.length})
              </h3>
              <div className="results-list">
                {searchResults.conversations.map((conversation) => (
                  <div key={`conversation-${conversation.id}`} className="result-item conversation-result">
                    <div className="result-header">
                      <div className="result-info">
                        <h4 className="result-title">
                          {highlightText(conversation.query, searchQuery)}
                        </h4>
                        <div className="result-meta">
                          <Link to={`/leads/${conversation.lead_id}`} className="lead-link">
                            <User size={14} />
                            {conversation.first_name} {conversation.last_name} · {conversation.company}
                          </Link>
                          <span className="result-date">
                            <Calendar size={14} />
                            {formatDate(conversation.created_at)}
                          </span>
                          <span className="model-used">
                            {conversation.model_used}
                          </span>
                        </div>
                      </div>
                      <div className="result-actions">
                        <button
                          onClick={() => toggleExpanded('conversation', conversation.id)}
                          className="btn btn-ghost btn-small"
                        >
                          {expandedItems[`conversation-${conversation.id}`] ? 'Hide' : 'Show Response'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(
                            `Q: ${conversation.query}\n\nA: ${conversation.response}`,
                            `conversation-${conversation.id}`
                          )}
                          className="btn btn-ghost btn-small"
                        >
                          <Copy size={14} />
                          {copiedItem === `conversation-${conversation.id}` ? 'Copied!' : 'Copy'}
                        </button>
                        <Link to={`/leads/${conversation.lead_id}`} className="btn btn-ghost btn-small">
                          <ExternalLink size={14} />
                          View Lead
                        </Link>
                      </div>
                    </div>
                    
                    {expandedItems[`conversation-${conversation.id}`] && (
                      <div className="result-content">
                        <div className="conversation-content">
                          <div className="grok-response">
                            <strong>Grok Response:</strong>
                            <div className="content-text">
                              {highlightText(conversation.response, searchQuery)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leads Results */}
          {(searchType === 'all' || searchType === 'leads') && searchResults.leads.length > 0 && (
            <div className="results-section">
              <h3 className="results-title">
                <User size={18} />
                Leads ({searchResults.leads.length})
              </h3>
              <div className="results-list">
                {searchResults.leads.map((lead) => (
                  <div key={`lead-${lead.id}`} className="result-item lead-result">
                    <div className="result-header">
                      <div className="result-info">
                        <h4 className="result-title">
                          {highlightText(`${lead.first_name} ${lead.last_name}`, searchQuery)}
                        </h4>
                        <div className="result-meta">
                          <span className="company-info">
                            {highlightText(lead.company, searchQuery)} · {highlightText(lead.title, searchQuery)}
                          </span>
                          <span className="industry">
                            {highlightText(lead.industry, searchQuery)}
                          </span>
                          <span className={`status-badge status-${lead.status}`}>
                            {lead.status}
                          </span>
                        </div>
                        <div className="lead-stats">
                          <span className="stat">
                            <Mail size={12} />
                            {lead.message_count} messages
                          </span>
                          <span className="stat">
                            <MessageSquare size={12} />
                            {lead.conversation_count} conversations
                          </span>
                        </div>
                      </div>
                      <div className="result-actions">
                        <Link to={`/leads/${lead.id}`} className="btn btn-primary btn-small">
                          <ExternalLink size={14} />
                          View Lead
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {hasSearched && !loading && 
           searchResults.messages.length === 0 && 
           searchResults.conversations.length === 0 && 
           searchResults.leads.length === 0 && (
            <div className="no-results">
              <Search size={48} />
              <h3>No results found</h3>
              <p>Try adjusting your search terms or filters</p>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!hasSearched && !loading && (
        <div className="search-placeholder">
          <Search size={64} />
          <h3>Search your messages and conversations</h3>
          <p>Find previous outreach messages, Grok consultations, and lead information across your entire database.</p>
          <div className="search-tips">
            <h4>Search Tips:</h4>
            <ul>
              <li>Search by company names, contact names, or message content</li>
              <li>Use filters to narrow down by date or specific leads</li>
              <li>Click on results to view full details or copy content</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
