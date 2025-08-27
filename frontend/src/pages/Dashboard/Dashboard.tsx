import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, TrendingUp, Target, Plus, Zap } from 'lucide-react';
import GrokConsultModal from '../../components/GrokConsultModal/GrokConsultModal';
import './Dashboard.css';

interface DashboardStats {
  total_leads: number;
  leads_by_status: Array<{ status: string; count: number }>;
  average_score: number;
  recent_activities: Array<{
    id: number;
    type: string;
    subject: string;
    first_name: string;
    last_name: string;
    company: string;
    created_at: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Mock data fallback for demo
      setStats({
        total_leads: 0,
        leads_by_status: [],
        average_score: 0,
        recent_activities: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard loading">
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      new: 'var(--text-muted)',
      contacted: 'var(--accent-blue)',
      qualified: 'var(--success)',
      proposal: 'var(--accent-orange)',
      won: 'var(--success)',
      lost: 'var(--error)'
    };
    return colors[status] || 'var(--text-muted)';
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Sales Command Center</h1>
          <p className="text-muted">
            Powered by Grok AI • Real-time SDR insights and automation
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <Users size={20} />
            </div>
            <span className="tag">[LEADS]</span>
          </div>
          <div className="stat-value">{stats?.total_leads || 0}</div>
          <div className="stat-label">Total Leads</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <Target size={20} />
            </div>
            <span className="tag status-qualified">[QUALIFIED]</span>
          </div>
          <div className="stat-value">
            {stats?.leads_by_status?.find(s => s.status === 'qualified')?.count || 0}
          </div>
          <div className="stat-label">Qualified Leads</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <TrendingUp size={20} />
            </div>
            <span className="tag">[SCORE]</span>
          </div>
          <div className="stat-value">{stats?.average_score || 0}%</div>
          <div className="stat-label">Avg Lead Score</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon">
              <MessageSquare size={20} />
            </div>
            <span className="tag">[ACTIVITIES]</span>
          </div>
          <div className="stat-value">
            {stats?.recent_activities?.length || 0}
          </div>
          <div className="stat-label">Recent Activities</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Lead Pipeline */}
        <div className="card pipeline-card">
          <div className="card-header">
            <h3 className="card-title">Lead Pipeline</h3>
            <span className="tag">[STATUS]</span>
          </div>
          <div className="pipeline-chart">
            {stats?.leads_by_status?.map((statusData) => (
              <div key={statusData.status} className="pipeline-stage">
                <div className="stage-header">
                  <span className="stage-name">{statusData.status.toUpperCase()}</span>
                  <span className="stage-count">{statusData.count}</span>
                </div>
                <div className="stage-bar">
                  <div 
                    className="stage-fill" 
                    style={{ 
                      width: `${(statusData.count / (stats?.total_leads || 1)) * 100}%`,
                      backgroundColor: getStatusColor(statusData.status)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card activities-card">
          <div className="card-header">
            <h3 className="card-title">Recent Activities</h3>
            <span className="tag">[LIVE]</span>
          </div>
          <div className="activities-list">
            {stats?.recent_activities?.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  <MessageSquare size={16} />
                </div>
                <div className="activity-content">
                  <div className="activity-title">
                    {activity.subject}
                  </div>
                  <div className="activity-meta">
                    <span className="contact-name">
                      {activity.first_name} {activity.last_name}
                    </span>
                    <span className="company-name">
                      @ {activity.company}
                    </span>
                  </div>
                </div>
                <div className="activity-time">
                  <span className="tag">[{activity.type.toUpperCase()}]</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showGrokModal && selectedLeadId && (
        <GrokConsultModal
          isOpen={showGrokModal}
          onClose={() => {
            setShowGrokModal(false);
            setSelectedLeadId(null);
          }}
          leadId={selectedLeadId}
          leadName="Selected Lead"
        />
      )}
    </div>
  );
};

export default Dashboard;
