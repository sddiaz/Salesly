const { GrokSDRService } = require('./grok');
const { runQuery, getQuery, allQuery } = require('../database/init');

class OutreachService {
  
  // Advanced outreach sequence management
  static async createOutreachSequence(leadId, sequenceType = 'standard') {
    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [leadId]);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const sequences = {
      standard: [
        { step: 1, type: 'email', delay_days: 0, template: 'initial_outreach' },
        { step: 2, type: 'follow_up', delay_days: 3, template: 'follow_up_1' },
        { step: 3, type: 'linkedin', delay_days: 7, template: 'linkedin_connection' },
        { step: 4, type: 'call', delay_days: 10, template: 'call_script' },
        { step: 5, type: 'final_follow_up', delay_days: 14, template: 'final_email' }
      ],
      enterprise: [
        { step: 1, type: 'research', delay_days: 0, template: 'company_research' },
        { step: 2, type: 'email', delay_days: 1, template: 'enterprise_initial' },
        { step: 3, type: 'call', delay_days: 4, template: 'discovery_call' },
        { step: 4, type: 'follow_up', delay_days: 7, template: 'proposal_follow_up' },
        { step: 5, type: 'meeting', delay_days: 14, template: 'demo_request' }
      ],
      quick_touch: [
        { step: 1, type: 'email', delay_days: 0, template: 'quick_intro' },
        { step: 2, type: 'linkedin', delay_days: 2, template: 'linkedin_touch' },
        { step: 3, type: 'final_follow_up', delay_days: 5, template: 'final_touch' }
      ]
    };

    const sequence = sequences[sequenceType] || sequences.standard;
    
    // Create sequence record
    const sequenceResult = await runQuery(`
      INSERT INTO outreach_sequences (lead_id, sequence_type, status, current_step, total_steps)
      VALUES (?, ?, ?, ?, ?)
    `, [leadId, sequenceType, 'active', 1, sequence.length]);

    // Create individual outreach steps
    for (const step of sequence) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + step.delay_days);
      
      await runQuery(`
        INSERT INTO outreach_steps (sequence_id, step_number, type, template, status, scheduled_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        sequenceResult.id,
        step.step,
        step.type,
        step.template,
        step.step === 1 ? 'ready' : 'pending',
        scheduledDate.toISOString()
      ]);
    }

    return { sequence_id: sequenceResult.id, total_steps: sequence.length };
  }

  // Execute next step in outreach sequence
  static async executeNextStep(sequenceId) {
    const sequence = await getQuery('SELECT * FROM outreach_sequences WHERE id = ?', [sequenceId]);
    if (!sequence || sequence.status !== 'active') {
      throw new Error('Invalid or inactive sequence');
    }

    const nextStep = await getQuery(`
      SELECT * FROM outreach_steps 
      WHERE sequence_id = ? AND step_number = ? AND status = 'ready'
    `, [sequenceId, sequence.current_step]);

    if (!nextStep) {
      // Check if sequence is complete
      const remainingSteps = await getQuery(`
        SELECT COUNT(*) as count FROM outreach_steps 
        WHERE sequence_id = ? AND status IN ('pending', 'ready')
      `, [sequenceId]);

      if (remainingSteps.count === 0) {
        await runQuery('UPDATE outreach_sequences SET status = ? WHERE id = ?', ['completed', sequenceId]);
        return { status: 'sequence_completed' };
      }
      
      return { status: 'no_ready_steps' };
    }

    const lead = await getQuery('SELECT * FROM leads WHERE id = ?', [sequence.lead_id]);
    
    let result;
    switch (nextStep.type) {
      case 'email':
      case 'follow_up':
      case 'final_follow_up':
        result = await this.generateAndSendEmail(lead, nextStep.template);
        break;
      case 'linkedin':
        result = await this.generateLinkedInMessage(lead, nextStep.template);
        break;
      case 'call':
        result = await this.generateCallScript(lead, nextStep.template);
        break;
      case 'research':
        result = await this.conductLeadResearch(lead);
        break;
      default:
        throw new Error(`Unknown step type: ${nextStep.type}`);
    }

    // Update step status
    await runQuery(`
      UPDATE outreach_steps 
      SET status = ?, completed_at = ?, result_data = ?
      WHERE id = ?
    `, ['completed', new Date().toISOString(), JSON.stringify(result), nextStep.id]);

    // Update sequence progress
    const nextStepNumber = sequence.current_step + 1;
    if (nextStepNumber <= sequence.total_steps) {
      await runQuery(`
        UPDATE outreach_sequences SET current_step = ? WHERE id = ?
      `, [nextStepNumber, sequenceId]);

      // Activate next step if ready
      await runQuery(`
        UPDATE outreach_steps 
        SET status = 'ready' 
        WHERE sequence_id = ? AND step_number = ? AND scheduled_at <= ?
      `, [sequenceId, nextStepNumber, new Date().toISOString()]);
    }

    return { status: 'step_completed', result };
  }

  // Generate personalized email with advanced context
  static async generateAndSendEmail(lead, template) {
    const context = await this.enrichLeadContext(lead);
    
    const messageData = await GrokSDRService.generatePersonalizedMessage(
      lead,
      template,
      context
    );

    // Save message to database
    await runQuery(`
      INSERT INTO messages (lead_id, type, subject, content, personalization_data, grok_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      lead.id,
      'email',
      messageData.subject,
      messageData.content,
      JSON.stringify(messageData.personalization_notes || []),
      `Generated ${template} message`
    ]);

    // Log activity
    await runQuery(`
      INSERT INTO activities (lead_id, type, subject, content, status, completed_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      lead.id,
      'email',
      `Outreach: ${messageData.subject}`,
      messageData.content,
      'completed',
      new Date().toISOString()
    ]);

    return messageData;
  }

  // Generate LinkedIn message
  static async generateLinkedInMessage(lead, template) {
    const context = await this.enrichLeadContext(lead);
    
    const messageData = await GrokSDRService.generatePersonalizedMessage(
      lead,
      'linkedin_message',
      { ...context, template }
    );

    await runQuery(`
      INSERT INTO messages (lead_id, type, subject, content, personalization_data, grok_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      lead.id,
      'linkedin',
      'LinkedIn Connection Request',
      messageData.content,
      JSON.stringify(messageData.personalization_notes || []),
      `Generated ${template} LinkedIn message`
    ]);

    return messageData;
  }

  // Generate call script
  static async generateCallScript(lead, template) {
    const context = await this.enrichLeadContext(lead);
    
    const scriptData = await GrokSDRService.generatePersonalizedMessage(
      lead,
      'call_script',
      { ...context, template }
    );

    await runQuery(`
      INSERT INTO messages (lead_id, type, subject, content, personalization_data, grok_prompt)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      lead.id,
      'call_script',
      'Call Script',
      scriptData.content,
      JSON.stringify(scriptData.personalization_notes || []),
      `Generated ${template} call script`
    ]);

    return scriptData;
  }

  // Conduct AI-powered lead research
  static async conductLeadResearch(lead) {
    const researchData = await GrokSDRService.enrichLeadData(lead);
    
    // Save research findings
    await runQuery(`
      INSERT INTO lead_research (lead_id, research_data, pain_points, decision_process, outreach_strategy)
      VALUES (?, ?, ?, ?, ?)
    `, [
      lead.id,
      JSON.stringify(researchData),
      JSON.stringify(researchData.pain_points || []),
      JSON.stringify(researchData.decision_process || {}),
      JSON.stringify(researchData.outreach_strategy || {})
    ]);

    return researchData;
  }

  // Enrich lead context for better personalization
  static async enrichLeadContext(lead) {
    // Get previous messages and activities
    const [messages, activities, research] = await Promise.all([
      allQuery('SELECT * FROM messages WHERE lead_id = ? ORDER BY created_at DESC LIMIT 5', [lead.id]),
      allQuery('SELECT * FROM activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 5', [lead.id]),
      getQuery('SELECT * FROM lead_research WHERE lead_id = ? ORDER BY created_at DESC LIMIT 1', [lead.id])
    ]);

    return {
      previous_interactions: {
        messages: messages.length,
        last_message_date: messages[0]?.created_at,
        last_activity: activities[0]?.type
      },
      research_insights: research ? JSON.parse(research.research_data || '{}') : {},
      lead_history: {
        status_changes: activities.filter(a => a.type === 'status_change'),
        engagement_level: this.calculateEngagementLevel(messages, activities)
      }
    };
  }

  // Calculate engagement level based on interactions
  static calculateEngagementLevel(messages, activities) {
    const totalInteractions = messages.length + activities.length;
    const recentInteractions = [...messages, ...activities]
      .filter(item => {
        const itemDate = new Date(item.created_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate > weekAgo;
      }).length;

    if (recentInteractions >= 3) return 'high';
    if (recentInteractions >= 1) return 'medium';
    return 'low';
  }

  // Get active outreach sequences
  static async getActiveSequences() {
    return await allQuery(`
      SELECT os.*, l.first_name, l.last_name, l.company, l.title,
             COUNT(ost.id) as total_steps,
             SUM(CASE WHEN ost.status = 'completed' THEN 1 ELSE 0 END) as completed_steps
      FROM outreach_sequences os
      JOIN leads l ON os.lead_id = l.id
      LEFT JOIN outreach_steps ost ON os.id = ost.sequence_id
      WHERE os.status = 'active'
      GROUP BY os.id
      ORDER BY os.created_at DESC
    `);
  }

  // Get sequence analytics
  static async getSequenceAnalytics() {
    const [totalSequences, activeSequences, completedSequences, conversionRate] = await Promise.all([
      getQuery('SELECT COUNT(*) as count FROM outreach_sequences'),
      getQuery('SELECT COUNT(*) as count FROM outreach_sequences WHERE status = "active"'),
      getQuery('SELECT COUNT(*) as count FROM outreach_sequences WHERE status = "completed"'),
      getQuery(`
        SELECT 
          COUNT(CASE WHEN l.status IN ('qualified', 'proposal', 'won') THEN 1 END) as converted,
          COUNT(*) as total
        FROM outreach_sequences os
        JOIN leads l ON os.lead_id = l.id
        WHERE os.status = 'completed'
      `)
    ]);

    return {
      total_sequences: totalSequences.count,
      active_sequences: activeSequences.count,
      completed_sequences: completedSequences.count,
      conversion_rate: conversionRate.total > 0 
        ? ((conversionRate.converted / conversionRate.total) * 100).toFixed(1)
        : 0
    };
  }
}

module.exports = { OutreachService };
