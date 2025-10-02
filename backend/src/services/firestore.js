const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    // Check if we're in development or production
    if (process.env.NODE_ENV === 'development' && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      // Development: Use service account file
      const path = require('path');
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(serviceAccountPath);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      console.log('✅ Firebase Admin SDK initialized with service account');
    } else {
      // Production: Use environment variables or default credentials
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
      });
      
      console.log('✅ Firebase Admin SDK initialized with default credentials');
    }
  }
  return getFirestore();
}

class FirestoreService {
  constructor() {
    this.db = initializeFirebaseAdmin();
  }

  // ==================== USERS ====================
  
  async createUser(userData) {
    try {
      const userRef = this.db.collection('users').doc(userData.uid);
      const user = {
        ...userData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await userRef.set(user, { merge: true });
      return { id: userData.uid, ...user };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUser(uid) {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      if (!userDoc.exists) {
        return null;
      }
      return { id: userDoc.id, ...userDoc.data() };
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async updateUser(uid, userData) {
    try {
      const userRef = this.db.collection('users').doc(uid);
      const updatedData = {
        ...userData,
        updatedAt: FieldValue.serverTimestamp()
      };
      await userRef.update(updatedData);
      return { id: uid, ...updatedData };
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(uid) {
    try {
      // Delete user's leads first
      const leadsSnapshot = await this.db.collection('leads')
        .where('userId', '==', uid)
        .get();
      
      const batch = this.db.batch();
      leadsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete user
      const userRef = this.db.collection('users').doc(uid);
      batch.delete(userRef);
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== LEADS ====================
  
  async createLead(userId, leadData) {
    try {
      const leadRef = this.db.collection('leads').doc();
      const lead = {
        ...leadData,
        userId,
        status: leadData.status || 'new',
        score: leadData.score || 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await leadRef.set(lead);
      
      // Log initial activity
      await this.createActivity(leadRef.id, userId, {
        type: 'lead_created',
        subject: 'Lead created',
        content: `Lead ${leadData.first_name} ${leadData.last_name} from ${leadData.company} added to pipeline`,
        status: 'completed'
      });
      
      return { id: leadRef.id, ...lead };
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  async getLeads(userId, filters = {}) {
    try {
      let query = this.db.collection('leads').where('userId', '==', userId);
      
      // Apply single filter to avoid complex indexes
      if (filters.status) {
        query = query.where('status', '==', filters.status);
      } else if (filters.industry) {
        query = query.where('industry', '==', filters.industry);
      }
      
      // Apply limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      const snapshot = await query.get();
      let leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory to avoid complex indexes
      leads = leads.sort((a, b) => {
        const dateA = a.updatedAt?.toDate() || new Date(0);
        const dateB = b.updatedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      
      // Apply additional filters in memory
      if (filters.industry && !filters.status) {
        leads = leads.filter(lead => lead.industry === filters.industry);
      }
      
      return leads;
    } catch (error) {
      console.error('Error getting leads:', error);
      throw error;
    }
  }

  async getLead(leadId, userId) {
    try {
      const leadDoc = await this.db.collection('leads').doc(leadId).get();
      if (!leadDoc.exists) {
        return null;
      }
      
      const leadData = leadDoc.data();
      if (leadData.userId !== userId) {
        throw new Error('Access denied');
      }
      
      return { id: leadDoc.id, ...leadData };
    } catch (error) {
      console.error('Error getting lead:', error);
      throw error;
    }
  }

  async updateLead(leadId, userId, updateData) {
    try {
      const leadRef = this.db.collection('leads').doc(leadId);
      const leadDoc = await leadRef.get();
      
      if (!leadDoc.exists) {
        throw new Error('Lead not found');
      }
      
      const leadData = leadDoc.data();
      if (leadData.userId !== userId) {
        throw new Error('Access denied');
      }
      
      const oldStatus = leadData.status;
      const newStatus = updateData.status;
      
      const updatedData = {
        ...updateData,
        updatedAt: FieldValue.serverTimestamp()
      };
      
      await leadRef.update(updatedData);
      
      // Log status change activity if status changed
      if (newStatus && oldStatus !== newStatus) {
        await this.createActivity(leadId, userId, {
          type: 'status_change',
          subject: `Status changed from ${oldStatus} to ${newStatus}`,
          content: `Lead status updated from ${oldStatus} to ${newStatus}`,
          status: 'completed'
        });
      }
      
      return { id: leadId, ...leadData, ...updatedData };
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  async deleteLead(leadId, userId) {
    try {
      const leadRef = this.db.collection('leads').doc(leadId);
      const leadDoc = await leadRef.get();
      
      if (!leadDoc.exists) {
        return false;
      }
      
      const leadData = leadDoc.data();
      if (leadData.userId !== userId) {
        throw new Error('Access denied');
      }
      
      // Delete associated data in batch
      const batch = this.db.batch();
      
      // Delete activities
      const activitiesSnapshot = await this.db.collection('activities')
        .where('leadId', '==', leadId)
        .get();
      activitiesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete messages
      const messagesSnapshot = await this.db.collection('messages')
        .where('leadId', '==', leadId)
        .get();
      messagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete conversations
      const conversationsSnapshot = await this.db.collection('conversations')
        .where('leadId', '==', leadId)
        .get();
      conversationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete the lead
      batch.delete(leadRef);
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // ==================== ACTIVITIES ====================
  
  async createActivity(leadId, userId, activityData) {
    try {
      const activityRef = this.db.collection('activities').doc();
      const activity = {
        ...activityData,
        leadId,
        userId,
        createdAt: FieldValue.serverTimestamp()
      };
      await activityRef.set(activity);
      return { id: activityRef.id, ...activity };
    } catch (error) {
      console.error('Error creating activity:', error);
      throw error;
    }
  }

  async getActivities(leadId, userId, limit = 50) {
    try {
      // Simplified query to avoid complex index requirements
      const snapshot = await this.db.collection('activities')
        .where('leadId', '==', leadId)
        .where('userId', '==', userId)
        .limit(limit)
        .get();
      
      // Sort in memory to avoid needing an index
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return activities.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting activities:', error);
      throw error;
    }
  }

  async getRecentActivities(userId, limit = 10) {
    try {
      // Simplified query - get by user and sort in memory
      const snapshot = await this.db.collection('activities')
        .where('userId', '==', userId)
        .limit(limit * 2) // Get more to account for sorting
        .get();
      
      // Sort in memory and limit
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return activities
        .sort((a, b) => {
          const dateA = a.createdAt?.toDate() || new Date(0);
          const dateB = b.createdAt?.toDate() || new Date(0);
          return dateB - dateA;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent activities:', error);
      throw error;
    }
  }

  // ==================== MESSAGES ====================
  
  async createMessage(leadId, userId, messageData) {
    try {
      const messageRef = this.db.collection('messages').doc();
      const message = {
        ...messageData,
        leadId,
        userId,
        createdAt: FieldValue.serverTimestamp()
      };
      await messageRef.set(message);
      
      // Log message activity
      await this.createActivity(leadId, userId, {
        type: messageData.type || 'message',
        subject: messageData.subject || 'Message sent',
        content: `${messageData.type} message: ${messageData.subject}`,
        status: 'completed'
      });
      
      return { id: messageRef.id, ...message };
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessages(leadId, userId, limit = 50) {
    try {
      const snapshot = await this.db.collection('messages')
        .where('leadId', '==', leadId)
        .where('userId', '==', userId)
        .limit(limit)
        .get();
      
      // Sort in memory
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return messages.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  // ==================== CONVERSATIONS ====================
  
  async createConversation(leadId, userId, conversationData) {
    try {
      const conversationRef = this.db.collection('conversations').doc();
      const conversation = {
        ...conversationData,
        leadId,
        userId,
        createdAt: FieldValue.serverTimestamp()
      };
      await conversationRef.set(conversation);
      return { id: conversationRef.id, ...conversation };
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  async createGeneralConversation(userId, conversationData) {
    try {
      const conversationRef = this.db.collection('general_conversations').doc();
      const conversation = {
        ...conversationData,
        userId,
        createdAt: FieldValue.serverTimestamp()
      };
      await conversationRef.set(conversation);
      return { id: conversationRef.id, ...conversation };
    } catch (error) {
      console.error('Error creating general conversation:', error);
      throw error;
    }
  }

  // ==================== ANALYTICS ====================
  
  async getDashboardStats(userId) {
    try {
      // Get all leads for the user
      const leadsSnapshot = await this.db.collection('leads')
        .where('userId', '==', userId)
        .get();
      
      const leads = leadsSnapshot.docs.map(doc => doc.data());
      
      // Calculate stats
      const totalLeads = leads.length;
      const leadsByStatus = {};
      let totalScore = 0;
      
      leads.forEach(lead => {
        leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
        totalScore += lead.score || 0;
      });
      
      const averageScore = totalLeads > 0 ? Math.round(totalScore / totalLeads) : 0;
      
      // Convert to array format
      const leadsStatusArray = Object.entries(leadsByStatus).map(([status, count]) => ({
        status,
        count
      }));
      
      // Get recent activities (simplified to avoid index issues)
      let recentActivities = [];
      try {
        recentActivities = await this.getRecentActivities(userId, 5);
      } catch (error) {
        console.warn('Could not fetch recent activities:', error.message);
        // Provide mock activities for demo
        recentActivities = [
          {
            id: 'demo-1',
            type: 'lead_created',
            subject: 'New lead added',
            created_at: new Date().toISOString()
          }
        ];
      }
      
      return {
        total_leads: totalLeads,
        leads_by_status: leadsStatusArray,
        average_score: averageScore,
        recent_activities: recentActivities.map(activity => ({
          id: activity.id,
          type: activity.type,
          subject: activity.subject,
          created_at: activity.createdAt
        }))
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // ==================== COMPANIES (Future) ====================
  
  async createCompany(companyData) {
    try {
      const companyRef = this.db.collection('companies').doc();
      const company = {
        ...companyData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      await companyRef.set(company);
      return { id: companyRef.id, ...company };
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async getCompany(companyId) {
    try {
      const companyDoc = await this.db.collection('companies').doc(companyId).get();
      if (!companyDoc.exists) {
        return null;
      }
      return { id: companyDoc.id, ...companyDoc.data() };
    } catch (error) {
      console.error('Error getting company:', error);
      throw error;
    }
  }
}

module.exports = {
  FirestoreService,
  initializeFirebaseAdmin
};