import React from 'react';
import { useAuth } from '../firebase/AuthContext';

class ApiService {
  constructor() {
    this.baseURL = '/api';
  }

  // Get current user ID (to be used as X-User-ID header)
  getCurrentUserId() {
    // This will be set by the component using the service
    return this.currentUserId;
  }

  setCurrentUser(userId) {
    this.currentUserId = userId;
  }

  // Generic fetch wrapper with authentication
  async fetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Add user ID header if available
    if (this.currentUserId) {
      headers['X-User-ID'] = this.currentUserId;
    }

    const config = {
      ...options,
      headers
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Request failed' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== LEADS =====
  
  async getLeads(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    const queryString = params.toString();
    const endpoint = queryString ? `/leads?${queryString}` : '/leads';
    
    return this.fetch(endpoint);
  }

  async getLead(id) {
    return this.fetch(`/leads/${id}`);
  }

  async createLead(leadData) {
    return this.fetch('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async updateLead(id, leadData) {
    return this.fetch(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData)
    });
  }

  async deleteLead(id) {
    return this.fetch(`/leads/${id}`, {
      method: 'DELETE'
    });
  }

  async updateLeadStatus(id, status, notes) {
    return this.fetch(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes })
    });
  }

  // ===== SCORING =====
  
  async scoreLead(id, customCriteria = []) {
    return this.fetch(`/leads/${id}/score`, {
      method: 'POST',
      body: JSON.stringify({ custom_criteria: customCriteria })
    });
  }

  // ===== MESSAGING =====
  
  async generateMessage(leadId, type, context = {}) {
    return this.fetch(`/leads/${leadId}/messages/generate`, {
      method: 'POST',
      body: JSON.stringify({ type, context })
    });
  }

  async saveMessage(leadId, messageData) {
    return this.fetch(`/leads/${leadId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData)
    });
  }

  // ===== ACTIVITIES =====
  
  async createActivity(leadId, activityData) {
    return this.fetch(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  }

  // ===== GROK CONSULTATION =====
  
  async consultGeneral(query, context = {}) {
    return this.fetch('/grok/consult', {
      method: 'POST',
      body: JSON.stringify({ query, context })
    });
  }

  async consultOnLead(leadId, query, context = {}) {
    return this.fetch(`/leads/${leadId}/consult`, {
      method: 'POST',
      body: JSON.stringify({ query, context })
    });
  }

  // ===== ANALYTICS =====
  
  async getDashboardStats() {
    return this.fetch('/analytics/dashboard');
  }

  // ===== USER MANAGEMENT =====
  
  async getUserProfile() {
    return this.fetch('/user/profile');
  }

  async updateUserProfile(userData) {
    return this.fetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async deleteUserAccount() {
    return this.fetch('/user/account', {
      method: 'DELETE'
    });
  }

  // ===== HEALTH CHECK =====
  
  async healthCheck() {
    return this.fetch('/health');
  }
}

// Create singleton instance
const apiService = new ApiService();

// Custom hook to use API service with authentication
export const useApiService = () => {
  const { currentUser } = useAuth();
  
  // Set current user ID when it changes
  React.useEffect(() => {
    if (currentUser?.uid) {
      apiService.setCurrentUser(currentUser.uid);
    } else {
      apiService.setCurrentUser(null);
    }
  }, [currentUser]);

  return apiService;
};

export default apiService;