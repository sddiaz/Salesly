const express = require('express');
const { runQuery, getQuery, allQuery } = require('../database/init');
const { GrokSDRService } = require('../services/grok');
const { OutreachService } = require('../services/outreachService');
const { 
  validateLead, 
  validateMessage, 
  validateActivity, 
  validateScoringCriteria 
} = require('../utils/validation');

const router = express.Router();

// ===== HEALTH CHECK ENDPOINT =====

// Health check endpoint for Docker
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'grok-sdr-api',
    version: '1.0.0'
  });
});

// ===== LEADS ENDPOINTS =====

// Get all leads with pagination and filtering
router.get('/leads', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      industry, 
      company_size,
      min_score,
      search 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    
    if (industry) {
      whereClause += ' AND industry = ?';
      params.push(industry);
    }
    
    if (company_size) {
      whereClause += ' AND company_size = ?';
      params.push(company_size);
    }
    
    if (min_score) {
      whereClause += ' AND score >= ?';
      params.push(parseInt(min_score));
    }
    
    if (search) {
      whereClause += ' AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR email LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM leads WHERE ${whereClause}`;
    const leadsQuery = `
      SELECT * FROM leads 
      WHERE ${whereClause}
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [totalResult, leads] = await Promise.all([
      getQuery(countQuery, params),
      allQuery(leadsQuery, [...params, parseInt(limit), offset])
    ]);
    
    res.json({
      leads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult.total,
        pages: Math.ceil(totalResult.total / limit)
      }
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
      getQuery('SELECT * FROM leads WHERE id = ?', [id]),
      allQuery('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC', [id]),
      allQuery('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at DESC', [id])
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
    
    const result = await runQuery(`
      INSERT INTO leads (
        email, first_name, last_name, company, title, industry, 
        company_size, phone, linkedin_url, website, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      leadData.email,
      leadData.first_name,
      leadData.last_name,
      leadData.company,
      leadData.title,
      leadData.industry,
      leadData.company_size,
      leadData.phone,
      leadData.linkedin_url,
      leadData.website,
      leadData.status || 'new'
    ]);
    
    const newLead = await getQuery('SELECT * FROM leads WHERE id = ?', [result.id]);
    
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
    
    const updateFields = Object.keys(leadData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(leadData);
    values.push(new Date().toISOString(), id);
    
    await runQuery(`
      UPDATE leads 
      SET ${updateFields}, updated_at = ?
      WHERE id = ?
    `, values);
    
    const updatedLead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
    
    if (!updatedLead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});

// Delete lead
router.delete('/leads/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await runQuery('DELETE FROM leads WHERE id = ?', [id]);
    
    if (result.changes === 0) {
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
    const { criteria_ids, custom_criteria } = req.body;
    
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    // Get scoring criteria
    let criteria;
    if (criteria_ids && criteria_ids.length > 0) {
      const placeholders = criteria_ids.map(() => '?').join(',');
      criteria = await allQuery(
        `SELECT * FROM scoring_criteria WHERE id IN (${placeholders}) AND is_active = TRUE`,
        criteria_ids
      );
    } else {
      criteria = await allQuery('SELECT * FROM scoring_criteria WHERE is_active = TRUE');
    }
    
    // Add any custom criteria
    if (custom_criteria && custom_criteria.length > 0) {
      criteria = [...criteria, ...custom_criteria];
    }
    
    // Use Grok to score the lead
    const scoringResult = await GrokSDRService.scoreLeadQualification(lead, criteria);
    
    // Update lead score
    await runQuery(
      'UPDATE leads SET score = ?, scoring_criteria = ?, updated_at = ? WHERE id = ?',
      [
        scoringResult.overall_score,
        JSON.stringify(criteria),
        new Date().toISOString(),
        id
      ]
    );
    
    // Log the scoring activity
    await runQuery(`
      INSERT INTO activities (lead_id, type, subject, content, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      'scoring',
      'Lead Qualification Scoring',
      JSON.stringify(scoringResult),
      'completed',
      new Date().toISOString()
    ]);
    
    res.json({ scoring_result: scoringResult });
  } catch (error) {
    next(error);
  }
});

// Get scoring criteria
router.get('/scoring-criteria', async (req, res, next) => {
  try {
    const criteria = await allQuery('SELECT * FROM scoring_criteria ORDER BY name');
    res.json({ criteria });
  } catch (error) {
    next(error);
  }
});

// Create scoring criteria
router.post('/scoring-criteria', async (req, res, next) => {
  try {
    const criteriaData = validateScoringCriteria(req.body);
    
    const result = await runQuery(`
      INSERT INTO scoring_criteria (name, description, weight, is_active)
      VALUES (?, ?, ?, ?)
    `, [
      criteriaData.name,
      criteriaData.description,
      criteriaData.weight,
      criteriaData.is_active
    ]);
    
    const newCriteria = await getQuery('SELECT * FROM scoring_criteria WHERE id = ?', [result.id]);
    
    res.status(201).json({ criteria: newCriteria });
  } catch (error) {
    next(error);
  }
});

// Update scoring criteria
router.put('/scoring-criteria/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const criteriaData = validateScoringCriteria(req.body);
    
    const updateFields = Object.keys(criteriaData)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.values(criteriaData);
    values.push(id);
    
    await runQuery(`
      UPDATE scoring_criteria 
      SET ${updateFields}
      WHERE id = ?
    `, values);
    
    const updatedCriteria = await getQuery('SELECT * FROM scoring_criteria WHERE id = ?', [id]);
    
    if (!updatedCriteria) {
      return res.status(404).json({ error: { message: 'Scoring criteria not found' } });
    }
    
    res.json({ criteria: updatedCriteria });
  } catch (error) {
    next(error);
  }
});

// Delete scoring criteria
router.delete('/scoring-criteria/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await runQuery('DELETE FROM scoring_criteria WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: { message: 'Scoring criteria not found' } });
    }
    
    res.json({ message: 'Scoring criteria deleted successfully' });
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
    
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
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
    const messageData = validateMessage({ ...req.body, lead_id: parseInt(id) });
    
    const result = await runQuery(`
      INSERT INTO messages (lead_id, type, subject, content, personalization_data, grok_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      messageData.lead_id,
      messageData.type,
      messageData.subject,
      messageData.content,
      messageData.personalization_data,
      messageData.grok_prompt
    ]);
    
    const newMessage = await getQuery('SELECT * FROM messages WHERE id = ?', [result.id]);
    
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
    const activityData = validateActivity({ ...req.body, lead_id: parseInt(id) });
    
    const result = await runQuery(`
      INSERT INTO activities (lead_id, type, subject, content, status, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      activityData.lead_id,
      activityData.type,
      activityData.subject,
      activityData.content,
      activityData.status,
      activityData.scheduled_at
    ]);
    
    const newActivity = await getQuery('SELECT * FROM activities WHERE id = ?', [result.id]);
    
    res.status(201).json({ activity: newActivity });
  } catch (error) {
    next(error);
  }
});

// Update activity status
router.put('/activities/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, content } = req.body;
    
    const updates = [];
    const values = [];
    
    if (status) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'completed') {
        updates.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }
    
    if (content) {
      updates.push('content = ?');
      values.push(content);
    }
    
    values.push(id);
    
    await runQuery(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`, values);
    
    const updatedActivity = await getQuery('SELECT * FROM activities WHERE id = ?', [id]);
    
    if (!updatedActivity) {
      return res.status(404).json({ error: { message: 'Activity not found' } });
    }
    
    res.json({ activity: updatedActivity });
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
    
    const response = await GrokSDRService.generalConsultation(query, context || {});
    
    // Save the general conversation
    await runQuery(`
      INSERT INTO general_conversations (query, response, context, model_used)
      VALUES (?, ?, ?, ?)
    `, [
      query,
      response,
      JSON.stringify(context || {}),
      'grok-3-mini'
    ]);
    
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
    
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    const response = await GrokSDRService.consultOnLead(query, lead, context || {});
    
    // Save the conversation
    await runQuery(`
      INSERT INTO conversations (lead_id, query, response, context, model_used)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      query,
      response,
      JSON.stringify(context || {}),
      'grok-3-mini'
    ]);
    
    res.json({ response });
  } catch (error) {
    next(error);
  }
});

// Get conversation history
router.get('/leads/:id/conversations', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const conversations = await allQuery(
      'SELECT * FROM conversations WHERE lead_id = ? ORDER BY created_at DESC',
      [id]
    );
    
    res.json({ conversations });
  } catch (error) {
    next(error);
  }
});

// ===== SEARCH ENDPOINTS =====

// Search all messages and conversations
router.get('/search', async (req, res, next) => {
  try {
    const { 
      q, 
      type = 'all', 
      limit = 50, 
      offset = 0,
      lead_id,
      date_from,
      date_to 
    } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        error: { message: 'Search query must be at least 2 characters long' } 
      });
    }

    const searchTerm = `%${q.trim()}%`;
    let results = { messages: [], conversations: [], leads: [] };

    // Search messages
    if (type === 'all' || type === 'messages') {
      let messageQuery = `
        SELECT m.*, l.first_name, l.last_name, l.company, l.email 
        FROM messages m 
        JOIN leads l ON m.lead_id = l.id 
        WHERE (m.subject LIKE ? OR m.content LIKE ? OR m.grok_prompt LIKE ?)
      `;
      let messageParams = [searchTerm, searchTerm, searchTerm];

      if (lead_id) {
        messageQuery += ' AND m.lead_id = ?';
        messageParams.push(lead_id);
      }
      if (date_from) {
        messageQuery += ' AND m.created_at >= ?';
        messageParams.push(date_from);
      }
      if (date_to) {
        messageQuery += ' AND m.created_at <= ?';
        messageParams.push(date_to);
      }

      messageQuery += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
      messageParams.push(parseInt(limit), parseInt(offset));

      results.messages = await allQuery(messageQuery, messageParams);
    }

    // Search conversations (Grok consultations)
    if (type === 'all' || type === 'conversations') {
      let conversationQuery = `
        SELECT c.*, l.first_name, l.last_name, l.company, l.email 
        FROM conversations c 
        JOIN leads l ON c.lead_id = l.id 
        WHERE (c.query LIKE ? OR c.response LIKE ? OR c.context LIKE ?)
      `;
      let conversationParams = [searchTerm, searchTerm, searchTerm];

      if (lead_id) {
        conversationQuery += ' AND c.lead_id = ?';
        conversationParams.push(lead_id);
      }
      if (date_from) {
        conversationQuery += ' AND c.created_at >= ?';
        conversationParams.push(date_from);
      }
      if (date_to) {
        conversationQuery += ' AND c.created_at <= ?';
        conversationParams.push(date_to);
      }

      conversationQuery += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
      conversationParams.push(parseInt(limit), parseInt(offset));

      results.conversations = await allQuery(conversationQuery, conversationParams);
    }

    // Search leads by company metadata
    if (type === 'all' || type === 'leads') {
      let leadQuery = `
        SELECT l.*, 
               (SELECT COUNT(*) FROM messages WHERE lead_id = l.id) as message_count,
               (SELECT COUNT(*) FROM conversations WHERE lead_id = l.id) as conversation_count
        FROM leads l 
        WHERE (l.first_name LIKE ? OR l.last_name LIKE ? OR l.company LIKE ? 
               OR l.title LIKE ? OR l.industry LIKE ? OR l.email LIKE ?)
      `;
      let leadParams = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];

      if (date_from) {
        leadQuery += ' AND l.created_at >= ?';
        leadParams.push(date_from);
      }
      if (date_to) {
        leadQuery += ' AND l.created_at <= ?';
        leadParams.push(date_to);
      }

      leadQuery += ' ORDER BY l.updated_at DESC LIMIT ? OFFSET ?';
      leadParams.push(parseInt(limit), parseInt(offset));

      results.leads = await allQuery(leadQuery, leadParams);
    }

    // Get total counts for pagination
    const totalCounts = {};
    if (type === 'all' || type === 'messages') {
      const messageCountQuery = `
        SELECT COUNT(*) as total FROM messages m 
        JOIN leads l ON m.lead_id = l.id 
        WHERE (m.subject LIKE ? OR m.content LIKE ? OR m.grok_prompt LIKE ?)
        ${lead_id ? 'AND m.lead_id = ?' : ''}
        ${date_from ? 'AND m.created_at >= ?' : ''}
        ${date_to ? 'AND m.created_at <= ?' : ''}
      `;
      let countParams = [searchTerm, searchTerm, searchTerm];
      if (lead_id) countParams.push(lead_id);
      if (date_from) countParams.push(date_from);
      if (date_to) countParams.push(date_to);
      
      const messageCount = await getQuery(messageCountQuery, countParams);
      totalCounts.messages = messageCount.total;
    }

    res.json({
      results,
      totalCounts,
      query: q,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===== ANALYTICS ENDPOINTS =====

// Dashboard stats
router.get('/analytics/dashboard', async (req, res, next) => {
  try {
    const [
      totalLeads,
      leadsByStatus,
      averageScore,
      recentActivities,
      outreachStats
    ] = await Promise.all([
      getQuery('SELECT COUNT(*) as count FROM leads'),
      allQuery('SELECT status, COUNT(*) as count FROM leads GROUP BY status'),
      getQuery('SELECT AVG(score) as avg_score FROM leads WHERE score > 0'),
      allQuery(`
        SELECT a.*, l.first_name, l.last_name, l.company 
        FROM activities a 
        JOIN leads l ON a.lead_id = l.id 
        ORDER BY a.created_at DESC 
        LIMIT 10
      `),
      OutreachService.getSequenceAnalytics()
    ]);
    
    res.json({
      stats: {
        total_leads: totalLeads.count,
        leads_by_status: leadsByStatus,
        average_score: Math.round(averageScore.avg_score || 0),
        recent_activities: recentActivities,
        outreach_analytics: outreachStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// ===== OUTREACH ENDPOINTS =====

// Create outreach sequence
router.post('/leads/:id/outreach/sequence', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sequence_type = 'standard' } = req.body;
    
    const result = await OutreachService.createOutreachSequence(id, sequence_type);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Execute next outreach step
router.post('/outreach/sequences/:id/execute', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await OutreachService.executeNextStep(id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get active outreach sequences
router.get('/outreach/sequences', async (req, res, next) => {
  try {
    const sequences = await OutreachService.getActiveSequences();
    res.json({ sequences });
  } catch (error) {
    next(error);
  }
});

// Get outreach sequence details
router.get('/outreach/sequences/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const [sequence, steps] = await Promise.all([
      getQuery(`
        SELECT os.*, l.first_name, l.last_name, l.company, l.title
        FROM outreach_sequences os
        JOIN leads l ON os.lead_id = l.id
        WHERE os.id = ?
      `, [id]),
      allQuery('SELECT * FROM outreach_steps WHERE sequence_id = ? ORDER BY step_number', [id])
    ]);
    
    if (!sequence) {
      return res.status(404).json({ error: { message: 'Sequence not found' } });
    }
    
    res.json({ sequence: { ...sequence, steps } });
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
    
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ error: { message: 'Lead not found' } });
    }
    
    // Update lead status
    await runQuery('UPDATE leads SET status = ?, updated_at = ? WHERE id = ?', [
      status,
      new Date().toISOString(),
      id
    ]);
    
    // Record stage history
    await runQuery(`
      INSERT INTO lead_stage_history (lead_id, from_stage, to_stage, notes)
      VALUES (?, ?, ?, ?)
    `, [id, lead.status, status, notes || '']);
    
    // Log activity
    await runQuery(`
      INSERT INTO activities (lead_id, type, subject, content, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id,
      'status_change',
      `Status changed from ${lead.status} to ${status}`,
      notes || '',
      'completed',
      new Date().toISOString()
    ]);
    
    const updatedLead = await getQuery('SELECT * FROM leads WHERE id = ?', [id]);
    res.json({ lead: updatedLead });
  } catch (error) {
    next(error);
  }
});

// Get pipeline stages
router.get('/pipeline/stages', async (req, res, next) => {
  try {
    const stages = await allQuery('SELECT * FROM pipeline_stages WHERE is_active = TRUE ORDER BY order_index');
    res.json({ stages });
  } catch (error) {
    next(error);
  }
});

// Get pipeline analytics
router.get('/analytics/pipeline', async (req, res, next) => {
  try {
    const [stageDistribution, conversionRates, averageTimeInStage] = await Promise.all([
      allQuery(`
        SELECT ps.name, ps.color, COUNT(l.id) as count
        FROM pipeline_stages ps
        LEFT JOIN leads l ON ps.name = l.status
        WHERE ps.is_active = TRUE
        GROUP BY ps.id, ps.name, ps.color
        ORDER BY ps.order_index
      `),
      allQuery(`
        SELECT 
          from_stage,
          to_stage,
          COUNT(*) as transitions
        FROM lead_stage_history
        GROUP BY from_stage, to_stage
      `),
      allQuery(`
        SELECT 
          status,
          AVG(julianday('now') - julianday(updated_at)) as avg_days
        FROM leads
        WHERE status != 'new'
        GROUP BY status
      `)
    ]);
    
    res.json({
      stage_distribution: stageDistribution,
      conversion_rates: conversionRates,
      average_time_in_stage: averageTimeInStage
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
