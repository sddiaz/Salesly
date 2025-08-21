require('dotenv').config();
const OpenAI = require('openai');

// Configuration constants
const CONFIG = {
  MODEL: 'grok-3-mini',
  BASE_URL: 'https://api.x.ai/v1',
  DEFAULT_TEMPERATURE: 0.7,
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
};

// Validate environment variables
function validateEnvironment() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: XAI_API_KEY not set in environment.');
    console.error('💡 Solution: Create a .env file with: XAI_API_KEY=your_key_here');
    process.exit(1);
  }
  return apiKey;
}

// Initialize OpenAI client
function createClient(apiKey) {
  return new OpenAI({
    apiKey,
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    maxRetries: CONFIG.MAX_RETRIES,
  });
}

// Core API interaction function
async function askGrok(client, message, options = {}) {
  const requestParams = {
    model: CONFIG.MODEL,
    messages: [{ role: 'user', content: message }],
    stream: false,
    temperature: options.temperature || CONFIG.DEFAULT_TEMPERATURE,
    ...options,
  };

  console.log(`🤖 Asking Grok: "${message}"`);
  
  try {
    const completion = await client.chat.completions.create(requestParams);
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response received from API');
    }
    
    return {
      content: completion.choices[0].message.content,
      usage: completion.usage,
      model: completion.model,
    };
  } catch (error) {
    // Enhanced error handling
    if (error.status === 401) {
      throw new Error('Authentication failed - check your API key');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    } else if (error.status >= 500) {
      throw new Error('xAI service unavailable - please try again later');
    }
    throw error;
  }
}

// Demo function with multiple examples
async function runDemo(client) {
  const examples = [
    {
      question: "What is the meaning of life, the universe, and everything?",
      temperature: 0.7,
    },
    {
      question: "Explain quantum computing in simple terms",
      temperature: 0.3, // Lower temperature for technical explanations
    },
    {
      question: "Write a haiku about coding",
      temperature: 0.9, // Higher temperature for creative tasks
    }
  ];

  console.log('🚀 Starting xAI Grok API Demo\n');

  for (let i = 0; i < examples.length; i++) {
    const { question, temperature } = examples[i];
    
    try {
      console.log(`\n--- Example ${i + 1} ---`);
      const response = await askGrok(client, question, { temperature });
      
      console.log(`✅ Response:`);
      console.log(response.content);
      console.log(`\n📊 Tokens used: ${response.usage?.total_tokens || 'N/A'}`);
      
      // Add small delay between requests to be API-friendly
      if (i < examples.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Error in example ${i + 1}:`, error.message);
    }
  }
}

// Main execution function
async function main() {
  try {
    console.log('🔧 Initializing xAI client...');
    const apiKey = validateEnvironment();
    const client = createClient(apiKey);
    
    console.log('✅ Client initialized successfully');
    
    // Run the demo
    await runDemo(client);
    
    console.log('\n🎉 Demo completed successfully!');
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Execute only if this file is run directly
if (require.main === module) {
  main();
}

// Export for potential testing or module usage
module.exports = {
  askGrok,
  createClient,
  CONFIG,
};
