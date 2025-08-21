import React, { useState, useEffect } from 'react';
import {
  Users, Target, Award, Activity, Zap, Brain, Send, CheckCircle,
  RefreshCwIcon
} from 'lucide-react';
import './Analytics.css';

interface AnalyticsData {
  stats: {
    total_leads: number;
    leads_by_status: Array<{status: string, count: number}>;
    average_score: number;
    recent_activities: Array<any>;
    outreach_analytics: {
      total_sequences: number;
      active_sequences: number;
      completed_sequences: number;
      conversion_rate: string;
    };
  };
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsResponse = await fetch('/api/analytics/dashboard');

      if (!analyticsResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analytics = await analyticsResponse.json();
      setAnalyticsData(analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: string, color = 'blue') => (
    <div className={`metric-card metric-card-${color}`}>
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className="metric-trend">
          {trend && <span className={`trend ${trend.startsWith('+') ? 'positive' : 'negative'}`}>{trend}</span>}
        </div>
      </div>
      <div className="metric-content">
        <h3 className="metric-value">{value}</h3>
        <p className="metric-title">{title}</p>
      </div>
    </div>
  );

  const renderLeadStatusDistribution = () => {
    if (!analyticsData?.stats.leads_by_status) return null;

    const statusColors: Record<string, string> = {
      new: '#3B82F6',
      contacted: '#8B5CF6', 
      qualified: '#06B6D4',
      proposal: '#F59E0B',
      negotiation: '#EF4444',
      won: '#10B981',
      lost: '#6B7280'
    };

    const total = analyticsData.stats.leads_by_status.reduce((sum, item) => sum + item.count, 0);

    return (
      <div className="status-distribution">
        <h3>Lead Distribution by Status</h3>
        <div className="status-bars">
          {analyticsData.stats.leads_by_status.map((item, index) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <div key={index} className="status-bar-item">
                <div className="status-info">
                  <span className="status-name">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
                  <span className="status-count">{item.count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="status-bar">
                  <div 
                    className="status-fill" 
                    style={{ 
                      width: `${percentage}%`, 
                      backgroundColor: statusColors[item.status] || '#6B7280' 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderOutreachAnalytics = () => {
    if (!analyticsData?.stats.outreach_analytics) return null;

    const outreach = analyticsData.stats.outreach_analytics;
    
    return (
      <div className="outreach-analytics">
        <h3>Outreach Performance</h3>
        <div className="outreach-metrics">
          <div className="metric-item">
            <Send size={20} />
            <div>
              <span className="metric-value">{outreach.total_sequences}</span>
              <span className="metric-label">Total Sequences</span>
            </div>
          </div>
          <div className="metric-item">
            <Activity size={20} />
            <div>
              <span className="metric-value">{outreach.active_sequences}</span>
              <span className="metric-label">Active</span>
            </div>
          </div>
          <div className="metric-item">
            <CheckCircle size={20} />
            <div>
              <span className="metric-value">{outreach.completed_sequences}</span>
              <span className="metric-label">Completed</span>
            </div>
          </div>
          <div className="metric-item">
            <Target size={20} />
            <div>
              <span className="metric-value">{outreach.conversion_rate}%</span>
              <span className="metric-label">Conversion Rate</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-state">
          <p>Error loading analytics: {error}</p>
          <button onClick={fetchAnalytics} className="btn btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Sales Analytics Dashboard</h1>
        <div className="analytics-controls">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button onClick={fetchAnalytics} className="btn btn-secondary">
            <RefreshCwIcon size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        {renderMetricCard(
          'Total Leads',
          analyticsData?.stats.total_leads || 0,
          <Users size={24} />,
          '+12%',
          'blue'
        )}
        {renderMetricCard(
          'Average Score',
          analyticsData?.stats.average_score || 0,
          <Award size={24} />,
          '+8%',
          'green'
        )}
        {renderMetricCard(
          'Active Sequences',
          analyticsData?.stats.outreach_analytics?.active_sequences || 0,
          <Send size={24} />,
          '+5%',
          'purple'
        )}
        {renderMetricCard(
          'Conversion Rate',
          `${analyticsData?.stats.outreach_analytics?.conversion_rate || 0}%`,
          <Target size={24} />,
          '+3%',
          'orange'
        )}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="charts-row">
          {renderLeadStatusDistribution()}
          {renderOutreachAnalytics()}
        </div>
      </div>

      {/* AI Insights */}
      <div className="ai-insights">
        <h3><Brain size={20} /> AI-Powered Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Lead Quality Trend</h4>
            <p>Average lead score has increased by 12% this month. Focus on enterprise prospects is paying off.</p>
          </div>
          <div className="insight-card">
            <h4>Outreach Optimization</h4>
            <p>LinkedIn messages have 3x higher response rate than emails for VP+ contacts. Consider shifting strategy.</p>
          </div>
          <div className="insight-card">
            <h4>Pipeline Velocity</h4>
            <p>Leads with scores above 80 convert 40% faster. Prioritize high-scoring prospects for immediate outreach.</p>
          </div>
          <div className="insight-card">
            <h4>Competitive Intelligence</h4>
            <p>HubSpot mentioned in 60% of conversations. Prepare competitive positioning materials.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
