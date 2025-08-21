const { runQuery } = require('../src/database/init');

const sampleLeads = [
  {
    email: 'sarah.johnson@techcorp.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    company: 'TechCorp Solutions',
    title: 'VP of Engineering',
    industry: 'Technology',
    company_size: 'Enterprise (1000+)',
    phone: '+1-555-0123',
    linkedin_url: 'https://linkedin.com/in/sarahjohnson',
    website: 'https://techcorp.com',
    status: 'qualified',
    score: 87
  },
  {
    email: 'mike.chen@startupco.io',
    first_name: 'Mike',
    last_name: 'Chen',
    company: 'StartupCo',
    title: 'CTO',
    industry: 'SaaS',
    company_size: 'Startup (10-50)',
    phone: '+1-555-0124',
    linkedin_url: 'https://linkedin.com/in/mikechen',
    website: 'https://startupco.io',
    status: 'contacted',
    score: 92
  },
  {
    email: 'emma.rodriguez@financeplus.com',
    first_name: 'Emma',
    last_name: 'Rodriguez',
    company: 'FinancePlus',
    title: 'Head of Operations',
    industry: 'Financial Services',
    company_size: 'Mid-market (500-1000)',
    phone: '+1-555-0125',
    linkedin_url: 'https://linkedin.com/in/emmarodriguez',
    website: 'https://financeplus.com',
    status: 'new',
    score: 78
  },
  {
    email: 'david.kim@healthtech.com',
    first_name: 'David',
    last_name: 'Kim',
    company: 'HealthTech Innovations',
    title: 'Product Manager',
    industry: 'Healthcare',
    company_size: 'Mid-market (500-1000)',
    phone: '+1-555-0126',
    linkedin_url: 'https://linkedin.com/in/davidkim',
    website: 'https://healthtech.com',
    status: 'proposal',
    score: 95
  },
  {
    email: 'lisa.patel@retailcorp.com',
    first_name: 'Lisa',
    last_name: 'Patel',
    company: 'RetailCorp',
    title: 'Director of IT',
    industry: 'Retail',
    company_size: 'Enterprise (1000+)',
    phone: '+1-555-0127',
    linkedin_url: 'https://linkedin.com/in/lisapatel',
    website: 'https://retailcorp.com',
    status: 'won',
    score: 89
  }
];

const sampleActivities = [
  {
    lead_id: 1,
    type: 'email',
    subject: 'Initial Outreach - TechCorp Integration Opportunity',
    content: 'Personalized email about scaling engineering processes',
    status: 'completed',
    completed_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    lead_id: 2,
    type: 'call',
    subject: 'Discovery Call - StartupCo Growth Challenges',
    content: 'Discussed infrastructure scaling and team productivity',
    status: 'completed',
    completed_at: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
  },
  {
    lead_id: 4,
    type: 'meeting',
    subject: 'Product Demo - HealthTech Solutions',
    content: 'Demonstrated platform capabilities for healthcare compliance',
    status: 'scheduled',
    scheduled_at: new Date(Date.now() + 86400000).toISOString() // Tomorrow
  }
];

const sampleMessages = [
  {
    lead_id: 1,
    type: 'initial_outreach',
    subject: 'Scaling Engineering Excellence at TechCorp',
    content: `Hi Sarah,

I noticed TechCorp's recent expansion and thought you might be interested in how other VP Engineering roles have streamlined their development processes while scaling to 1000+ engineers.

We've helped similar companies reduce deployment time by 60% and improve code quality metrics significantly.

Would you be open to a brief 15-minute call next week to discuss your current engineering challenges?

Best regards,
[Your SDR name]`,
    personalization_data: JSON.stringify({
      personalization_notes: ['VP Engineering title', 'Company size scaling challenges', 'Recent expansion context'],
      follow_up_suggestions: ['Technical scaling pain points', 'Team productivity metrics', 'Deployment automation']
    })
  },
  {
    lead_id: 2,
    type: 'follow_up',
    subject: 'Following up on our CTO discussion',
    content: `Hi Mike,

Thanks for the great conversation yesterday about StartupCo's infrastructure challenges.

As promised, here are the case studies showing how we've helped similar SaaS startups handle rapid scaling while maintaining system reliability.

The ROI calculator I mentioned is attached - you can input StartupCo's metrics to see potential impact.

When would be a good time for the technical deep-dive you mentioned?

Best,
[Your SDR name]`,
    personalization_data: JSON.stringify({
      personalization_notes: ['Previous conversation reference', 'SaaS industry specifics', 'Technical focus'],
      follow_up_suggestions: ['Technical deep-dive scheduling', 'ROI discussion', 'Implementation timeline']
    })
  }
];

async function seedDemoData() {
  try {
    console.log('🌱 Seeding demo data...');
    
    // Insert leads
    for (const lead of sampleLeads) {
      await runQuery(`
        INSERT INTO leads (
          email, first_name, last_name, company, title, industry, 
          company_size, phone, linkedin_url, website, status, score
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lead.email, lead.first_name, lead.last_name, lead.company,
        lead.title, lead.industry, lead.company_size, lead.phone,
        lead.linkedin_url, lead.website, lead.status, lead.score
      ]);
    }
    
    // Insert activities
    for (const activity of sampleActivities) {
      await runQuery(`
        INSERT INTO activities (lead_id, type, subject, content, status, completed_at, scheduled_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        activity.lead_id, activity.type, activity.subject, activity.content,
        activity.status, activity.completed_at, activity.scheduled_at
      ]);
    }
    
    // Insert messages
    for (const message of sampleMessages) {
      await runQuery(`
        INSERT INTO messages (lead_id, type, subject, content, personalization_data)
        VALUES (?, ?, ?, ?, ?)
      `, [
        message.lead_id, message.type, message.subject, message.content,
        message.personalization_data
      ]);
    }
    
    console.log('✅ Demo data seeded successfully!');
    console.log(`📊 Inserted ${sampleLeads.length} leads, ${sampleActivities.length} activities, ${sampleMessages.length} messages`);
    
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  const { initializeDatabase } = require('../src/database/init');
  
  initializeDatabase()
    .then(() => seedDemoData())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };
