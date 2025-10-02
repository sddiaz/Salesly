const { FirestoreService } = require('./src/services/firestore');

async function seedDemoData() {
  console.log('🌱 Starting data seeding...');
  
  try {
    const firestoreService = new FirestoreService();
    const userId = 'dev-user-123'; // Our development user ID
    
    console.log(`📝 Creating demo leads for user: ${userId}`);
    
    // Create demo leads
    const demoLeads = [
      {
        email: 'john.doe@techcorp.com',
        first_name: 'John',
        last_name: 'Doe',
        company: 'TechCorp',
        title: 'VP of Engineering',
        industry: 'Technology',
        company_size: '201-1000',
        phone: '+1-555-0123',
        linkedin_url: 'https://linkedin.com/in/johndoe',
        website: 'https://techcorp.com',
        status: 'new',
        score: 85
      },
      {
        email: 'jane.smith@innovate.io',
        first_name: 'Jane',
        last_name: 'Smith',
        company: 'Innovate.io',
        title: 'Chief Technology Officer',
        industry: 'Software',
        company_size: '51-200',
        phone: '+1-555-0124',
        linkedin_url: 'https://linkedin.com/in/janesmith',
        website: 'https://innovate.io',
        status: 'contacted',
        score: 92
      },
      {
        email: 'mike.johnson@startupxyz.com',
        first_name: 'Mike',
        last_name: 'Johnson',
        company: 'StartupXYZ',
        title: 'Founder & CEO',
        industry: 'Fintech',
        company_size: '11-50',
        phone: '+1-555-0125',
        linkedin_url: 'https://linkedin.com/in/mikejohnson',
        website: 'https://startupxyz.com',
        status: 'qualified',
        score: 78
      },
      {
        email: 'sarah.wilson@megacorp.com',
        first_name: 'Sarah',
        last_name: 'Wilson',
        company: 'MegaCorp',
        title: 'Director of IT',
        industry: 'Enterprise',
        company_size: '1000+',
        phone: '+1-555-0126',
        linkedin_url: 'https://linkedin.com/in/sarahwilson',
        website: 'https://megacorp.com',
        status: 'proposal',
        score: 95
      },
      {
        email: 'david.brown@greentech.org',
        first_name: 'David',
        last_name: 'Brown',
        company: 'GreenTech Solutions',
        title: 'Head of Operations',
        industry: 'Clean Energy',
        company_size: '101-500',
        phone: '+1-555-0127',
        linkedin_url: 'https://linkedin.com/in/davidbrown',
        website: 'https://greentech.org',
        status: 'won',
        score: 88
      }
    ];
    
    const createdLeads = [];
    
    for (const leadData of demoLeads) {
      console.log(`  ➕ Creating lead: ${leadData.first_name} ${leadData.last_name} (${leadData.company})`);
      const lead = await firestoreService.createLead(userId, leadData);
      createdLeads.push(lead);
      
      // Add some demo messages for each lead
      await firestoreService.createMessage(lead.id, userId, {
        type: 'email',
        subject: `Initial outreach to ${leadData.first_name}`,
        content: `Hi ${leadData.first_name}, I hope this email finds you well. I wanted to reach out regarding...`,
        personalization_data: JSON.stringify({
          company: leadData.company,
          title: leadData.title
        })
      });
      
      console.log(`    📧 Added demo message for ${leadData.first_name}`);
    }
    
    console.log('✅ Demo data seeding completed!');
    console.log(`📊 Created ${createdLeads.length} leads with messages and activities`);
    console.log('🎉 Your app is ready to test!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDemoData };