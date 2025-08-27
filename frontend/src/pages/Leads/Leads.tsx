import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AddLeadModal from "../../components/AddLeadModal/AddLeadModal";
import "./Leads.css";

interface Lead {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  title: string;
  industry: string;
  status: string;
  score: number;
  created_at: string;
}

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/leads");
      const data = await response.json();
      setLeads(data.leads);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      // Mock data fallback
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 70) return "high";
    if (score >= 40) return "medium";
    return "low";
  };

  if (loading) {
    return (
      <div className="leads loading">
        <div className="spinner"></div>
        <span>Loading leads...</span>
      </div>
    );
  }

  return (
    <div className="leads">
      <div className="leads-header">
        <div>
          <h1>Lead Management</h1>
          <p className="text-muted">Manage and track your sales prospects</p>
        </div>
        <button
          className="btn"
          onClick={() => setShowAddModal(true)}
          style={{ fontWeight: "bold" }}
        >
          Add Lead +
        </button>
      </div>

      <div className="leads-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Title</th>
              <th>Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <div className="lead-name">
                    <div className="name">
                      {lead.first_name} {lead.last_name}
                    </div>
                    <div className="email text-muted">{lead.email}</div>
                  </div>
                </td>
                <td>
                  <div className="company-info">
                    <div className="company">{lead.company}</div>
                    <div className="industry text-muted">{lead.industry}</div>
                  </div>
                </td>
                <td>{lead.title}</td>
                <td>
                  <span className={`tag status-${lead.status}`}>
                    [{lead.status.toUpperCase()}]
                  </span>
                </td>
                <td>
                  <div className="score-container">
                    <div className="score">
                      <span>{lead.score}%</span>
                      <div
                        className={`score-indicator ${getScoreLevel(
                          lead.score
                        )}`}
                      ></div>
                    </div>
                    <div className="score-bar" style={{ width: `${lead.score}%` }}>
                      <div
                        className={`score-fill ${getScoreLevel(lead.score)}`}
                        style={{
                          width: `${getScoreLevel(lead.score)}% !important`,
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="actions">
                    <Link to={`/leads/${lead.id}`} className="btn btn-sm">
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onLeadAdded={fetchLeads}
      />
    </div>
  );
};

export default Leads;
