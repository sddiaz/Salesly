const express = require('express');
const { FirestoreService } = require('../services/firestore');
const { GrokSDRService } = require('../services/grok');
const { 
  validateLead, 
  validateMessage, 
  validateActivity, 
  validateScoringCriteria 
} = require('../utils/validation');

const router = express.Router();
const firestoreService = new FirestoreService();

// Middleware to extract user ID from Firebase Auth token
const authenticateUser = async (req, res, next) => {
  try {
    // In a real app, you'd verify the Firebase token here
    // For development, we'll use a header or create a default user
    let userId = req.headers['x-user-id'] || req.user?.uid;
    
    // For development only - create a default user if none provided
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'dev-user-123'; // Default development user ID
    }
    
    if (!userId) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
    
    req.userId = userId;
    next();
  } catch (error) {
    res.status(401).json({ error: { message: 'Invalid authentication' } });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateUser);

// ===== HEALTH CHECK ENDPOINT =====

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'salesly-firestore-api',
    version: '1.0.0',
    database: 'firestore'
  });
});

// ===== LEADS ENDPOINTS =====

// Get all leads with filtering
router.get('/leads', async (req, res, next) => {
  try {
    const { 
      status, 
      industry, 
      company_size,
      min_score,
      limit = 50
    } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (industry) filters.industry = industry;
    if (company_size) filters.company_size = company_size;
    if (limit) filters.limit = parseInt(limit);
    
    const leads = await firestoreService.getLeads(req.userId, filters);
    
    // Apply min_score filter (Firestore doesn't support >= on multiple fields efficiently)
    let filteredLeads = leads;
    if (min_score) {
      filteredLeads = leads.filter(lead => (lead.score || 0) >= parseInt(min_score));
    }
    
    res.json({
      leads: filteredLeads,
      total: filteredLeads.length
    });
  } catch (error) {
    next(error);
  }
});

// Get single lead with activities and messages
router.get('/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [lead, activities, messages] = await Promise.all([
      firestoreService.getLead(id, req.userId),
      firestoreService.getActivities(id, req.userId),
      firestoreService.getMessages(id, req.userId)
    ]);
    
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    res.json({
      lead: {
        ...lead,
        activities,
        messages
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create new lead
router.post('/leads', async (req, res, next) => {
  try {
    const leadData = validateLead(req.body);
    const newLead = await firestoreService.createLead(req.userId, leadData);
    
    res.status(201).json({ lead: newLead });
  } catch (error) {
    next(error);
  }
});

// Update lead
router.put('/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const leadData = validateLead(req.body);
    
    const updatedLead = await firestoreService.updateLead(id, req.userId, leadData);
    
    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});

// Delete lead
router.delete('/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const deleted = await firestoreService.deleteLead(id, req.userId);
    
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ===== SCORING ENDPOINTS =====

// Score a lead
router.post('/leads/:id/score', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { custom_criteria } = req.body;
    
    const lead = await firestoreService.getLead(id, req.userId);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    // Default scoring criteria (you can move this to Firestore later)
    const defaultCriteria = [
      { name: 'Company Size', description: 'Larger companies get higher scores', weight: 1.5 },
      { name: 'Industry Match', description: 'Target industry alignment', weight: 2.0 },
      { name: 'Title Relevance', description: 'Decision-maker potential', weight: 1.8 },
      { name: 'LinkedIn Activity', description: 'Professional engagement level', weight: 1.2 },
      { name: 'Website Quality', description: 'Company maturity indicator', weight: 1.0 }
    ];
    
    const criteria = custom_criteria ? [...defaultCriteria, ...custom_criteria] : defaultCriteria;
    
    // Use Grok to score the lead
    const scoringResult = await GrokSDRService.scoreLeadQualification(lead, criteria);
    
    // Update lead score
    await firestoreService.updateLead(id, req.userId, {
      score: scoringResult.overall_score,
      scoring_criteria: JSON.stringify(criteria)
    });
    
    // Log the scoring activity
    await firestoreService.createActivity(id, req.userId, {
      type: 'scoring',
      subject: 'Lead Qualification Scoring',
      content: JSON.stringify(scoringResult),
      status: 'completed'
    });
    
    res.json({ scoring_result: scoringResult });
  } catch (error) {
    next(error);
  }
});

// ===== MESSAGING ENDPOINTS =====

// Generate personalized message
router.post('/leads/:id/messages/generate', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type, context } = req.body;
    
    const lead = await firestoreService.getLead(id, req.userId);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    const messageData = await GrokSDRService.generatePersonalizedMessage(
      lead, 
      type || 'initial_outreach',
      context || {}
    );
    
    res.json({ message_data: messageData });
  } catch (error) {
    next(error);
  }
});

// Save generated message
router.post('/leads/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params;
    const messageData = validateMessage(req.body);
    
    const newMessage = await firestoreService.createMessage(id, req.userId, messageData);
    
    res.status(201).json({ message: newMessage });
  } catch (error) {
    next(error);
  }
});

// ===== ACTIVITIES ENDPOINTS =====

// Create activity
router.post('/leads/:id/activities', async (req, res, next) => {
  try {
    const { id } = req.params;
    const activityData = validateActivity(req.body);
    
    const newActivity = await firestoreService.createActivity(id, req.userId, activityData);
    
    res.status(201).json({ activity: newActivity });
  } catch (error) {
    next(error);
  }
});

// ===== GROK CONSULTATION ENDPOINTS =====

// General Grok consultation (not tied to a specific lead)
router.post('/grok/consult', async (req, res, next) => {
  try {
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: { message: 'Query is required' } });
    }
    
    // Add system data to context for better responses
    let systemContext = { ...context };
    
    try {
      const dashboardStats = await firestoreService.getDashboardStats(req.userId);
      systemContext.systemData = dashboardStats;
    } catch (statsError) {
      console.warn('Could not load system data for Grok consultation:', statsError);
    }
    
    const response = await GrokSDRService.generalConsultation(query, systemContext);
    
    // Save the general conversation
    await firestoreService.createGeneralConversation(req.userId, {
      query,
      response,
      context: systemContext,
      model_used: 'grok-3-mini'
    });
    
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

// Ask Grok about a lead
router.post('/leads/:id/consult', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: { message: 'Query is required' } });
    }
    
    const lead = await firestoreService.getLead(id, req.userId);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    const response = await GrokSDRService.consultOnLead(query, lead, context || {});
    
    // Save the conversation
    await firestoreService.createConversation(id, req.userId, {
      query,
      response,
      context: context || {},
      model_used: 'grok-3-mini'
    });
    
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

// ===== ANALYTICS ENDPOINTS =====

// Dashboard stats
router.get('/analytics/dashboard', async (req, res, next) => {
  try {
    const stats = await firestoreService.getDashboardStats(req.userId);
    
    res.json({ stats });
  } catch (error) {
    next(error);
  }
});

// ===== PIPELINE ENDPOINTS =====

// Update lead status with pipeline tracking
router.put('/leads/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const lead = await firestoreService.getLead(id, req.userId);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    const oldStatus = lead.status;
    
    // Update lead status
    const updatedLead = await firestoreService.updateLead(id, req.userId, { status });
    
    // Log activity (this is automatically done in updateLead if status changes)
    if (notes) {
      await firestoreService.createActivity(id, req.userId, {
        type: 'note',
        subject: 'Status change note',
        content: notes,
        status: 'completed'
      });
    }
    
    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});

// ===== USER MANAGEMENT ENDPOINTS =====

// Get current user profile
router.get('/user/profile', async (req, res, next) => {
  try {
    const user = await firestoreService.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/user/profile', async (req, res, next) => {
  try {
    const { firstName, lastName, companyName, role } = req.body;
    
    const updatedUser = await firestoreService.updateUser(req.userId, {
      firstName,
      lastName,
      companyName,
      role
    });
    
    res.json({ user: updatedUser });
  } catch (error) {
    next(error);
  }
});

// Delete user account
router.delete('/user/account', async (req, res, next) => {
  try {
    await firestoreService.deleteUser(req.userId);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;