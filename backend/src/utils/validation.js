const Joi = require('joi');

function validateEnvironment() {
  const requiredVars = ['XAI_API_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
}

// Validation schemas
const leadSchema = Joi.object({
  email: Joi.string().email().required(),
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  company: Joi.string().max(200),
  title: Joi.string().max(200),
  industry: Joi.string().max(100),
  company_size: Joi.string().valid('1-10', '11-50', '51-200', '201-1000', '1000+').allow('').optional(),
  phone: Joi.string().max(20).allow('').optional(),
  linkedin_url: Joi.string().uri().allow('').optional(),
  website: Joi.string().uri().allow('').optional(),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost').default('new')
});

const messageSchema = Joi.object({
  lead_id: Joi.number().integer().positive().required(),
  type: Joi.string().valid('email', 'linkedin', 'call_script').required(),
  subject: Joi.string().max(500).allow('').optional(),
  content: Joi.string().required(),
  personalization_data: Joi.string().allow('').optional(),
  grok_prompt: Joi.string().allow('').optional()
});

const activitySchema = Joi.object({
  lead_id: Joi.number().integer().positive().required(),
  type: Joi.string().valid('call', 'email', 'meeting', 'demo', 'follow_up').required(),
  subject: Joi.string().max(500),
  content: Joi.string(),
  status: Joi.string().valid('pending', 'completed', 'cancelled').default('pending'),
  scheduled_at: Joi.date().iso()
});

const scoringCriteriaSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500),
  weight: Joi.number().min(0).max(10).default(1.0),
  is_active: Joi.boolean().default(true)
});

function validateLead(leadData) {
  const { error, value } = leadSchema.validate(leadData);
  if (error) {
    throw new Error(`Lead validation error: ${error.details[0].message}`);
  }
  return value;
}

function validateMessage(messageData) {
  const { error, value } = messageSchema.validate(messageData);
  if (error) {
    throw new Error(`Message validation error: ${error.details[0].message}`);
  }
  return value;
}

function validateActivity(activityData) {
  const { error, value } = activitySchema.validate(activityData);
  if (error) {
    throw new Error(`Activity validation error: ${error.details[0].message}`);
  }
  return value;
}

function validateScoringCriteria(criteriaData) {
  const { error, value } = scoringCriteriaSchema.validate(criteriaData);
  if (error) {
    throw new Error(`Scoring criteria validation error: ${error.details[0].message}`);
  }
  return value;
}

module.exports = {
  validateEnvironment,
  validateLead,
  validateMessage,
  validateActivity,
  validateScoringCriteria
};
