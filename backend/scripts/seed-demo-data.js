require('dotenv').config();
const { FirestoreService } = require('../src/services/firestore');

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

async function seedDemoData() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/seed-demo-data.js <firebase-user-uid>');
    process.exit(1);
  }
  const firestore = new FirestoreService();
  for (const lead of sampleLeads) {
    const created = await firestore.createLead(userId, lead);
    console.log(`Seeded lead ${lead.email} (${created.id})`);
  }
  console.log('Demo data seeded. Activities and messages are created from the app.');
}

seedDemoData().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
