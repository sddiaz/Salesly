import React, { useState, useEffect } from 'react';
import { X, Plus, Edit3, Trash2, Save, Star } from 'lucide-react';
import './ScoringCriteriaModal.css';

interface ScoringCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCriteriaUpdated?: () => void;
}

interface ScoringCriteria {
  id: number;
  name: string;
  description: string;
  weight: number;
  is_active: boolean;
}

const ScoringCriteriaModal: React.FC<ScoringCriteriaModalProps> = ({ 
  isOpen, 
  onClose, 
  onCriteriaUpdated 
}) => {
  const [criteria, setCriteria] = useState<ScoringCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newCriteria, setNewCriteria] = useState({
    name: '',
    description: '',
    weight: 1.0
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCriteria();
    }
  }, [isOpen]);

  const fetchCriteria = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scoring-criteria');
      
      if (!response.ok) {
        throw new Error('Failed to fetch scoring criteria');
      }
      
      const data = await response.json();
      setCriteria(data.criteria);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch criteria');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCriteria = async () => {
    if (!newCriteria.name.trim()) {
      setError('Criteria name is required');
      return;
    }

    try {
      const response = await fetch('/api/scoring-criteria', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCriteria),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create criteria');
      }

      setNewCriteria({ name: '', description: '', weight: 1.0 });
      setShowAddForm(false);
      setError('');
      await fetchCriteria();
      
      if (onCriteriaUpdated) {
        onCriteriaUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create criteria');
    }
  };

  const handleUpdateCriteria = async (id: number, updates: Partial<ScoringCriteria>) => {
    try {
      const criteriaToUpdate = criteria.find(c => c.id === id);
      if (!criteriaToUpdate) return;

      const response = await fetch(`/api/scoring-criteria/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...criteriaToUpdate, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update criteria');
      }

      setEditingId(null);
      await fetchCriteria();
      
      if (onCriteriaUpdated) {
        onCriteriaUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update criteria');
    }
  };

  const handleDeleteCriteria = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this criteria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/scoring-criteria/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete criteria');
      }

      await fetchCriteria();
      
      if (onCriteriaUpdated) {
        onCriteriaUpdated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete criteria');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scoring-criteria-modal">
        <div className="modal-header">
          <h2>
            <Star size={20} />
            Manage Scoring Criteria
          </h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="criteria-section">
            <div className="section-header">
              <h3>Current Criteria</h3>
              <button 
                onClick={() => setShowAddForm(true)}
                className="btn btn-primary btn-small"
              >
                <Plus size={16} />
                Add Criteria
              </button>
            </div>

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading criteria...</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {showAddForm && (
              <div className="add-criteria-form">
                <h4>Add New Criteria</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={newCriteria.name}
                      onChange={(e) => setNewCriteria({ ...newCriteria, name: e.target.value })}
                      placeholder="e.g., Company Size"
                    />
                  </div>
                  <div className="form-group">
                    <label>Weight (0.1 - 10.0)</label>
                    <input
                      type="number"
                      min="0.1"
                      max="10.0"
                      step="0.1"
                      value={newCriteria.weight}
                      onChange={(e) => setNewCriteria({ ...newCriteria, weight: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={newCriteria.description}
                      onChange={(e) => setNewCriteria({ ...newCriteria, description: e.target.value })}
                      placeholder="Describe how this criteria should be evaluated..."
                      rows={2}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={() => setShowAddForm(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleAddCriteria} className="btn btn-primary">
                    <Save size={16} />
                    Add Criteria
                  </button>
                </div>
              </div>
            )}

            <div className="criteria-list">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="criteria-item">
                  <div className="criteria-content">
                    {editingId === criterion.id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          defaultValue={criterion.name}
                          onBlur={(e) => handleUpdateCriteria(criterion.id, { name: e.target.value })}
                        />
                        <textarea
                          defaultValue={criterion.description}
                          onBlur={(e) => handleUpdateCriteria(criterion.id, { description: e.target.value })}
                          rows={2}
                        />
                        <input
                          type="number"
                          min="0.1"
                          max="10.0"
                          step="0.1"
                          defaultValue={criterion.weight}
                          onBlur={(e) => handleUpdateCriteria(criterion.id, { weight: parseFloat(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <div className="criteria-display">
                        <div className="criteria-header">
                          <h4>{criterion.name}</h4>
                          <div className="weight-badge">
                            Weight: {criterion.weight}
                          </div>
                        </div>
                        <p>{criterion.description}</p>
                        <div className="criteria-status">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={criterion.is_active}
                              onChange={(e) => handleUpdateCriteria(criterion.id, { is_active: e.target.checked })}
                            />
                            <span className="slider"></span>
                          </label>
                          <span>{criterion.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="criteria-actions">
                    <button
                      onClick={() => setEditingId(editingId === criterion.id ? null : criterion.id)}
                      className="btn btn-small btn-outline"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCriteria(criterion.id)}
                      className="btn btn-small btn-danger"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScoringCriteriaModal;
