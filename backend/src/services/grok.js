const OpenAI = require('openai');

// Configuration constants
const CONFIG = {
  MODEL: 'grok-3-mini',
  BASE_URL: 'https://api.x.ai/v1',
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
};

let grokClient = null;

function createGrokClient() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set in environment');
  }

  grokClient = new OpenAI({
    apiKey,
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    maxRetries: CONFIG.MAX_RETRIES,
  });

  console.log('✅ Grok client initialized');
  return grokClient;
}

function getGrokClient() {
  if (!grokClient) {
    throw new Error('Grok client not initialized. Call createGrokClient() first.');
  }
  return grokClient;
}

// Core Grok interaction function
async function askGrok(message, options = {}) {
  const client = getGrokClient();
  
  const requestParams = {
    model: CONFIG.MODEL,
    messages: Array.isArray(message) ? message : [{ role: 'user', content: message }],
    stream: false,
    temperature: options.temperature || CONFIG.DEFAULT_TEMPERATURE,
    max_tokens: options.max_tokens || 1000,
    ...options,
  };

  try {
    const completion = await client.chat.completions.create(requestParams);
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response received from Grok API');
    }
    
    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: completion.model,
      finish_reason: completion.choices[0].finish_reason
    };
  } catch (error) {
    // Enhanced error handling
    if (error.status === 401) {
      throw new Error('Authentication failed - check your XAI API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    } else if (error.status >= 500) {
      throw new Error('xAI service unavailable - please try again later');
    }
    throw error;
  }
}

// Specialized SDR functions
class GrokSDRService {
  
  // Lead qualification scoring with enhanced prompts
  static async scoreLeadQualification(leadData, scoringCriteria) {
    const prompt = `You are an expert Sales Development Representative AI with deep experience in B2B lead qualification. Your job is to analyze this lead comprehensively and provide accurate, actionable scoring.

LEAD PROFILE:
Name: ${leadData.first_name} ${leadData.last_name}
Company: ${leadData.company}
Title: ${leadData.title}
Industry: ${leadData.industry}
Company Size: ${leadData.company_size}
Website: ${leadData.website || 'Not provided'}
LinkedIn: ${leadData.linkedin_url || 'Not provided'}
Current Status: ${leadData.status}

SCORING CRITERIA:
${scoringCriteria.map(c => `• ${c.name} (Weight: ${c.weight}x): ${c.description}`).join('\n')}

ANALYSIS REQUIREMENTS:
1. Score each criterion 0-10 based on available data
2. Apply weighted scoring for overall result (0-100)
3. Identify 3-5 key strengths that make this lead valuable
4. Identify 3-5 potential concerns or challenges
5. Recommend specific next actions based on the profile
6. Assess urgency level (low/medium/high)

Consider these factors in your analysis:
- Company size often correlates with budget and decision complexity
- Title indicates decision-making authority and influence
- Industry alignment affects solution fit and sales cycle
- Digital presence suggests company maturity and engagement

Respond in valid JSON format:
{
  "overall_score": <number 0-100>,
  "criterion_scores": {
    "<criterion_name>": {
      "score": <number 0-10>,
      "reasoning": "<specific reasoning for this score>"
    }
  },
  "strengths": ["<specific strength>", ...],
  "concerns": ["<specific concern>", ...],
  "recommended_actions": ["<actionable next step>", ...],
  "urgency": "<low|medium|high>",
  "confidence_level": <number 0-100>
}`;

    const response = await askGrok(prompt, { 
      temperature: 0.3,
      max_tokens: 1500 
    });
    
    try {
      const result = JSON.parse(response.content);
      
      // Validate and ensure all required fields
      return {
        overall_score: Math.max(0, Math.min(100, result.overall_score || 50)),
        criterion_scores: result.criterion_scores || {},
        strengths: result.strengths || [],
        concerns: result.concerns || [],
        recommended_actions: result.recommended_actions || [],
        urgency: result.urgency || 'medium',
        confidence_level: result.confidence_level || 80,
        model_used: 'grok-3-mini',
        tokens_used: response.usage?.total_tokens || 0
      };
    } catch (parseError) {
      // Enhanced fallback scoring
      const fallbackScore = this.calculateFallbackScore(leadData, scoringCriteria);
      return {
        overall_score: fallbackScore,
        raw_response: response.content,
        error: 'JSON parsing failed - used fallback scoring',
        fallback_used: true,
        strengths: ['Requires manual review'],
        concerns: ['AI analysis failed'],
        recommended_actions: ['Manual lead review recommended']
      };
    }
  }

  // Enhanced message generation with better personalization
  static async generatePersonalizedMessage(leadData, messageType, context = {}) {
    const messageTypeMap = {
      initial_outreach: {
        description: 'Professional initial outreach email that establishes credibility and provides clear value',
        maxLength: 200,
        tone: 'professional, conversational, and genuinely helpful'
      },
      email: {
        description: 'Professional email outreach message',
        maxLength: 200,
        tone: 'professional, conversational, and genuinely helpful'
      },
      follow_up: {
        description: 'Follow-up email that references previous interaction and adds new value',
        maxLength: 180,
        tone: 'persistent but respectful and helpful'
      },
      linkedin: {
        description: 'LinkedIn connection request or message',
        maxLength: 150,
        tone: 'professional, personal, and authentic'
      },
      linkedin_message: {
        description: 'LinkedIn connection request or message',
        maxLength: 150,
        tone: 'professional, personal, and authentic'
      },
      call_script: {
        description: 'Phone call opening script (30-45 seconds)',
        maxLength: 120,
        tone: 'conversational, confident, and natural'
      }
    };

    const typeConfig = messageTypeMap[messageType] || messageTypeMap.initial_outreach;

    const prompt = `You are writing a professional business outreach message. Write naturally as a business professional who has done research on the prospect and wants to start a genuine business conversation.

PROSPECT INFORMATION:
Name: ${leadData.first_name} ${leadData.last_name}
Company: ${leadData.company}
Title: ${leadData.title}
Industry: ${leadData.industry}
Company Size: ${leadData.company_size}

RESEARCH INSIGHTS (use selectively and naturally):
${context.company_info || 'No additional context provided'}
${context.recent_news || ''}
${context.mutual_connections || ''}
${context.previous_interactions ? `Previous interactions: ${JSON.stringify(context.previous_interactions)}` : ''}

MESSAGE REQUIREMENTS:
- Tone: ${typeConfig.tone}
- Maximum length: ${typeConfig.maxLength} words
- Write as yourself reaching out person-to-person (not as "an expert" or service provider)
- SUBTLY reference insights from your research - don't dump all the context
- Pick 1-2 most relevant details and weave them naturally into conversation
- Focus on THEIR challenges/opportunities, not what you offer
- Ask a thoughtful question that shows you understand their world
- Be genuinely curious about their perspective
- Avoid mentioning specific dollar amounts, statistics, or obvious public information
- Sound like you're reaching out because you have a genuine reason, not just to sell
- Make it feel like the beginning of a real business conversation

EXAMPLES OF GOOD VS BAD CONTEXT USAGE:
❌ BAD: "I saw you recently invested $3.2 billion in healthcare technology..."
✅ GOOD: "I imagine the healthcare expansion at Walmart brings interesting challenges around..."

❌ BAD: "As an expert in B2B solutions, I help companies like yours..."
✅ GOOD: "I've been thinking about how retail companies navigate..."

❌ BAD: "Your company just announced..." (stating obvious news)
✅ GOOD: "I'm curious how you're thinking about..." (showing genuine interest)
- Specific, actionable call-to-action
- Avoid generic sales language
- Reference something specific about their company/role

${messageType === 'linkedin_message' ? 'IMPORTANT: Keep connection requests under 200 characters total.' : ''}
${messageType === 'call_script' ? 'IMPORTANT: Structure as a natural conversation opener with pause points.' : ''}

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no additional text
2. The "content" field must contain plain text, not nested JSON
3. Keep response concise to avoid truncation
4. Ensure proper JSON escaping for newlines and quotes

{
  "subject": "${messageType.includes('email') || messageType === 'initial_outreach' || messageType === 'follow_up' ? 'Add compelling subject here' : 'N/A'}",
  "content": "Write the actual message content here with proper line breaks",
  "personalization_notes": ["First personalization point", "Second personalization point"],
  "follow_up_suggestions": ["First follow-up suggestion", "Second follow-up suggestion"],
  "estimated_response_rate": 25,
  "key_hooks": ["First psychological hook", "Second hook"]
}`;

    const response = await askGrok(prompt, { 
      temperature: 0.7,
      max_tokens: 800 
    });
    
    try {
      let responseText = response.content.trim();
      
      // First, try to parse the response directly
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (firstParseError) {
        // If that fails, try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch (matchParseError) {
            throw firstParseError;
          }
        } else {
          throw firstParseError;
        }
      }
      
      // Handle case where content might be nested JSON string
      let finalContent = result.content;
      let finalSubject = result.subject;
      let finalPersonalizationNotes = result.personalization_notes || [];
      let finalFollowUpSuggestions = result.follow_up_suggestions || [];
      let finalEstimatedResponseRate = result.estimated_response_rate || 15;
      let finalKeyHooks = result.key_hooks || [];
      
      // Check if content is nested JSON and try to parse it
      if (typeof finalContent === 'string' && finalContent.trim().startsWith('{')) {
        try {
          const nestedResult = JSON.parse(finalContent);
          if (nestedResult.content && typeof nestedResult.content === 'string') {
            finalContent = nestedResult.content;
            finalSubject = nestedResult.subject || finalSubject;
            finalPersonalizationNotes = nestedResult.personalization_notes || finalPersonalizationNotes;
            finalFollowUpSuggestions = nestedResult.follow_up_suggestions || finalFollowUpSuggestions;
            finalEstimatedResponseRate = nestedResult.estimated_response_rate || finalEstimatedResponseRate;
            finalKeyHooks = nestedResult.key_hooks || finalKeyHooks;
          }
        } catch (nestedParseError) {
          // Try to extract content manually from malformed JSON
          const contentMatch = finalContent.match(/"content":\s*"([^"]+(?:\\.[^"]*)*)"/);
          const subjectMatch = finalContent.match(/"subject":\s*"([^"]+(?:\\.[^"]*)*)"/);
          
          if (contentMatch) {
            finalContent = contentMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
          }
          
          if (subjectMatch) {
            finalSubject = subjectMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\t/g, '\t')
              .replace(/\\\\/g, '\\');
          }
          
          // Try to extract personalization notes
          const notesMatch = finalContent.match(/"personalization_notes":\s*\[(.*?)\]/s);
          if (notesMatch) {
            try {
              const notesArray = JSON.parse(`[${notesMatch[1]}]`);
              finalPersonalizationNotes = notesArray;
            } catch (notesParseError) {
              // Keep existing notes
            }
          }
        }
      }
      
      return {
        subject: finalSubject || `Following up on ${leadData.company}`,
        content: finalContent || responseText,
        personalization_notes: Array.isArray(finalPersonalizationNotes) ? finalPersonalizationNotes : [],
        follow_up_suggestions: Array.isArray(finalFollowUpSuggestions) ? finalFollowUpSuggestions : [],
        estimated_response_rate: typeof finalEstimatedResponseRate === 'number' ? finalEstimatedResponseRate : 15,
        key_hooks: Array.isArray(finalKeyHooks) ? finalKeyHooks : [],
        message_type: messageType,
        model_used: 'grok-3-mini',
        tokens_used: response.usage?.total_tokens || 0
      };
    } catch (parseError) {
      // Enhanced fallback - try to extract readable content from raw response
      let fallbackContent = response.content;
      let fallbackSubject = `Following up on ${leadData.company}`;
      
      // Try to extract content and subject from malformed response
      const contentMatch = response.content.match(/"content":\s*"([^"]+(?:\\.[^"]*)*)"/);
      const subjectMatch = response.content.match(/"subject":\s*"([^"]+(?:\\.[^"]*)*)"/);
      
      if (contentMatch) {
        fallbackContent = contentMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
      }
      
      if (subjectMatch) {
        fallbackSubject = subjectMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\');
      }
      
      return {
        subject: fallbackSubject,
        content: fallbackContent,
        error: 'JSON parsing failed - using enhanced content extraction',
        message_type: messageType,
        personalization_notes: ['Message generated successfully but with parsing challenges']
      };
    }
  }

  // Lead research and enrichment
  static async enrichLeadData(basicLeadData) {
    const prompt = `You are a research specialist helping to enrich lead data. Based on the basic information provided, suggest additional data points that would be valuable for sales outreach and provide educated insights.

Basic Lead Data:
- Name: ${basicLeadData.first_name} ${basicLeadData.last_name}
- Company: ${basicLeadData.company}
- Title: ${basicLeadData.title}
- Industry: ${basicLeadData.industry}

Please provide:
1. Likely pain points based on role and industry
2. Common challenges for companies of this type
3. Potential decision-making process
4. Best times/methods for outreach
5. Key topics that would likely interest them
6. Questions to ask during discovery calls

Format as JSON:
{
  "pain_points": ["<pain point>", ...],
  "company_challenges": ["<challenge>", ...],
  "decision_process": {
    "likely_stakeholders": ["<role>", ...],
    "typical_timeline": "<timeline>",
    "key_factors": ["<factor>", ...]
  },
  "outreach_strategy": {
    "best_times": ["<time>", ...],
    "preferred_channels": ["<channel>", ...],
    "topics_of_interest": ["<topic>", ...]
  },
  "discovery_questions": ["<question>", ...]
}`;

    const response = await askGrok(prompt, { temperature: 0.6 });
    
    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      return {
        pain_points: ['Budget constraints', 'Operational efficiency', 'Technology adoption'],
        raw_response: response.content,
        error: 'Failed to parse JSON response'
      };
    }
  }

  // Conversation analysis and next steps
  static async analyzeConversation(conversationHistory, leadData) {
    const prompt = `You are an expert sales coach analyzing a conversation with a lead. Provide insights and recommend next steps.

Lead Information:
- Name: ${leadData.first_name} ${leadData.last_name}
- Company: ${leadData.company}
- Title: ${leadData.title}

Conversation History:
${conversationHistory.map(msg => `${msg.type}: ${msg.content}`).join('\n\n')}

Please analyze:
1. Lead's interest level (1-10)
2. Key information revealed
3. Objections or concerns raised
4. Buying signals detected
5. Recommended next steps
6. Urgency level
7. Suggested follow-up timeline

Format as JSON:
{
  "interest_level": <number>,
  "key_insights": ["<insight>", ...],
  "objections": ["<objection>", ...],
  "buying_signals": ["<signal>", ...],
  "next_steps": ["<action>", ...],
  "urgency": "<low|medium|high>",
  "follow_up_timeline": "<timeline>",
  "recommended_approach": "<strategy>"
}`;

    const response = await askGrok(prompt, { temperature: 0.4 });
    
    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      return {
        interest_level: 5,
        raw_response: response.content,
        error: 'Failed to parse JSON response'
      };
    }
  }

  // General consultation (not tied to specific lead)
  static async generalConsultation(query, context = {}) {
    let systemDataPrompt = '';
    
    // If system data is provided, include it in the prompt
    if (context.systemData) {
      systemDataPrompt = `
CURRENT SYSTEM DATA:
${JSON.stringify(context.systemData, null, 2)}

Please use this actual data from the user's system when answering their question. If they ask about leads, use the real numbers provided above.
`;
    }

    const prompt = `You are an expert Sales Development Representative consultant. Give a SHORT, DIRECT answer to this question.

${systemDataPrompt}

Question: ${query}

IMPORTANT INSTRUCTIONS:
- Keep your response under 100 words
- Be direct and concise
- If asking about numbers/data, just give the number and brief context
- Skip long explanations unless specifically asked for detailed analysis
- Focus on the essential answer only

Example good responses:
- "You have 6 total leads: 2 contacted, 1 new, 1 proposal, 1 qualified, 1 won."
- "Your average lead score is 81/100, which is strong."
- "Try focusing on LinkedIn outreach during 9-11 AM for better response rates."`;

    const response = await askGrok(prompt, { 
      temperature: 0.3,
      max_tokens: 300 
    });
    return response.content;
  }

  // General lead consultation
  static async consultOnLead(query, leadData, context = {}) {
    const prompt = `You are an expert Sales Development Representative consultant. Answer the specific question about this lead with a clear, direct response.

Lead Information:
- Name: ${leadData.first_name} ${leadData.last_name}
- Company: ${leadData.company}
- Title: ${leadData.title}
- Industry: ${leadData.industry}
- Current Status: ${leadData.status}
- Score: ${leadData.score}/100

Question: ${query}

Additional Context:
${JSON.stringify(context, null, 2)}

IMPORTANT FORMATTING RULES:
- Use plain text only (no markdown, asterisks, or special formatting)
- Keep response under 300 words
- Be direct and actionable
- Use simple paragraphs separated by line breaks
- Avoid using headers, bullet points, or bold formatting
- Write in a conversational, professional tone

Provide a practical response based on your SDR expertise.`;

    const response = await askGrok(prompt, { 
      temperature: 0.7,
      max_tokens: 800 
    });
    return response.content;
  }

  // Fallback scoring calculation when AI fails
  static calculateFallbackScore(leadData, scoringCriteria) {
    let totalScore = 0;
    let totalWeight = 0;

    scoringCriteria.forEach(criteria => {
      let score = 5; // Default middle score
      
      // Basic scoring logic based on available data
      if (criteria.name.toLowerCase().includes('size')) {
        const sizeMap = { '1-10': 3, '11-50': 5, '51-200': 7, '201-1000': 8, '1000+': 9 };
        score = sizeMap[leadData.company_size] || 5;
      } else if (criteria.name.toLowerCase().includes('title')) {
        const titleValue = leadData.title?.toLowerCase() || '';
        if (titleValue.includes('ceo') || titleValue.includes('founder')) score = 10;
        else if (titleValue.includes('vp') || titleValue.includes('director')) score = 8;
        else if (titleValue.includes('manager')) score = 6;
        else if (titleValue.includes('senior')) score = 5;
        else score = 3;
      } else if (criteria.name.toLowerCase().includes('industry')) {
        score = leadData.industry ? 7 : 3;
      }
      
      totalScore += score * criteria.weight;
      totalWeight += criteria.weight;
    });

    return Math.round((totalScore / totalWeight) * 10); // Scale to 0-100
  }

  // Advanced conversation analysis with sentiment and intent detection
  static async analyzeConversationAdvanced(conversationHistory, leadData, context = {}) {
    const prompt = `You are an expert sales conversation analyst with deep psychology and communication training. Analyze this conversation thread comprehensively.

LEAD PROFILE:
Name: ${leadData.first_name} ${leadData.last_name}
Company: ${leadData.company}
Title: ${leadData.title}
Industry: ${leadData.industry}

CONVERSATION HISTORY:
${conversationHistory.map((msg, i) => `${i+1}. ${msg.type.toUpperCase()}: ${msg.content}`).join('\n')}

ANALYSIS FRAMEWORK:
Provide a comprehensive analysis covering:

1. ENGAGEMENT LEVEL (1-10): How engaged is the prospect?
2. SENTIMENT ANALYSIS: Overall emotional tone and shifts
3. INTENT SIGNALS: Buying intent, information gathering, or rejection signals
4. PAIN POINT IDENTIFICATION: What challenges are they facing?
5. OBJECTION ANALYSIS: What concerns or barriers exist?
6. DECISION-MAKING STAGE: Where are they in the buying process?
7. STAKEHOLDER MAPPING: Who else might be involved?
8. TIMING ASSESSMENT: Urgency and timeline indicators
9. BUDGET SIGNALS: Any indication of budget or investment capacity
10. NEXT BEST ACTIONS: Specific tactical recommendations

Consider these psychological factors:
- Language patterns that indicate commitment level
- Questions that reveal buying intent vs information gathering
- Emotional undertones and stress indicators
- Authority and decision-making power signals

Respond in valid JSON format:
{
  "engagement_level": <number 1-10>,
  "sentiment_analysis": {
    "overall_sentiment": "<positive|neutral|negative>",
    "sentiment_trend": "<improving|stable|declining>",
    "emotional_indicators": ["<indicator>", ...]
  },
  "intent_signals": {
    "buying_intent": <number 1-10>,
    "information_gathering": <number 1-10>,
    "rejection_risk": <number 1-10>
  },
  "pain_points": ["<specific pain point>", ...],
  "objections": [
    {
      "objection": "<objection>",
      "type": "<budget|timing|authority|need>",
      "strength": <number 1-10>,
      "response_strategy": "<strategy>"
    }
  ],
  "decision_stage": "<awareness|consideration|evaluation|decision>",
  "stakeholders": {
    "identified": ["<role>", ...],
    "likely_influencers": ["<role>", ...],
    "decision_maker_probability": <number 1-10>
  },
  "timing": {
    "urgency_level": "<low|medium|high>",
    "timeline_indicators": ["<indicator>", ...],
    "implementation_timeframe": "<immediate|3-6months|6-12months|12+months>"
  },
  "budget_signals": {
    "budget_mentioned": <boolean>,
    "price_sensitivity": "<low|medium|high>",
    "investment_capacity": "<startup|growth|enterprise>"
  },
  "recommended_actions": [
    {
      "action": "<specific action>",
      "priority": "<high|medium|low>",
      "timeline": "<immediate|this-week|next-week>",
      "expected_outcome": "<outcome>"
    }
  ],
  "risk_assessment": {
    "deal_probability": <number 1-100>,
    "risk_factors": ["<risk>", ...],
    "mitigation_strategies": ["<strategy>", ...]
  }
}`;

    const response = await askGrok(prompt, { 
      temperature: 0.4,
      max_tokens: 2000 
    });
    
    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      return {
        engagement_level: 5,
        sentiment_analysis: { overall_sentiment: 'neutral' },
        raw_response: response.content,
        error: 'Failed to parse comprehensive analysis'
      };
    }
  }

  // Competitive analysis and positioning
  static async generateCompetitivePositioning(leadData, competitors = [], context = {}) {
    const prompt = `You are a competitive intelligence expert helping to position our solution against competitors for this specific lead.

LEAD PROFILE:
Name: ${leadData.first_name} ${leadData.last_name}
Company: ${leadData.company}
Title: ${leadData.title}
Industry: ${leadData.industry}
Company Size: ${leadData.company_size}

KNOWN COMPETITORS:
${competitors.length > 0 ? competitors.map(c => `- ${c.name}: ${c.description || 'Known competitor'}`).join('\n') : 'No specific competitors identified'}

CONTEXT:
${context.solution_description || 'Our solution provides innovative business automation'}
${context.unique_advantages || ''}

ANALYSIS REQUIREMENTS:
1. Identify likely competitors this lead might be considering
2. Develop positioning strategies for each competitor
3. Create talking points that highlight our advantages
4. Identify potential weaknesses and how to address them
5. Suggest discovery questions to uncover competitive landscape

Respond in valid JSON format:
{
  "likely_competitors": [
    {
      "name": "<competitor>",
      "probability": <number 1-10>,
      "reasoning": "<why they might consider this>"
    }
  ],
  "positioning_strategies": [
    {
      "competitor": "<competitor name>",
      "our_advantages": ["<advantage>", ...],
      "their_strengths": ["<strength>", ...],
      "differentiation_points": ["<point>", ...],
      "battle_cards": ["<talking point>", ...]
    }
  ],
  "discovery_questions": ["<question to uncover competition>", ...],
  "risk_mitigation": {
    "price_competition": ["<strategy>", ...],
    "feature_gaps": ["<mitigation>", ...],
    "incumbent_advantage": ["<approach>", ...]
  }
}`;

    const response = await askGrok(prompt, { 
      temperature: 0.6,
      max_tokens: 1500 
    });
    
    try {
      return JSON.parse(response.content);
    } catch (parseError) {
      return {
        likely_competitors: [],
        positioning_strategies: [],
        raw_response: response.content,
        error: 'Failed to parse competitive analysis'
      };
    }
  }
}

module.exports = {
  createGrokClient,
  getGrokClient,
  askGrok,
  GrokSDRService,
  CONFIG
};
