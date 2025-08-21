import React, { useState } from "react";
import { X, User, Building, Mail, Phone, Globe } from "lucide-react";
import "./AddLeadModal.css";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: () => void;
}

interface LeadFormData {
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
}

const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onLeadAdded,
}) => {
  const [formData, setFormData] = useState<LeadFormData>({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    title: "",
    industry: "",
    company_size: "",
    phone: "",
    linkedin_url: "",
    website: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to create lead");
      }

      // Reset form and close modal
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        company: "",
        title: "",
        industry: "",
        company_size: "",
        phone: "",
        linkedin_url: "",
        website: "",
      });
      onLeadAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add New Lead</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <User size={16} />
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                required
                placeholder="Enter first name"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <User size={16} />
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
                placeholder="Enter last name"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <Mail size={16} />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter email address"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <Building size={16} />
                Company *
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
                placeholder="Enter company name"
              />
            </div>

            <div className="form-group">
              <label>Job Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter job title"
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <Phone size={16} />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>LinkedIn URL</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <Globe size={16} />
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://company.com"
              />
            </div>

            <div className="form-group">
              <label>Company Size</label>
              <select
                name="company_size"
                value={formData.company_size}
                onChange={handleInputChange}
              >
                <option value="">Select company size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-1000">201-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <div className="form-group">
              <label>Industry *</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
              >
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Consulting">Consulting</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLeadModal;
