// Load environment variables from .env file
require('dotenv').config();

const { GrokSDRService, createGrokClient } = require('../src/services/grok');
const { OutreachService } = require('../src/services/outreachService');
const { initializeDatabase } = require('../src/database/init');
const fs = require('fs');
const path = require('path');
const { validateEnvironment } = require('../src/utils/validation');

// Enhanced test cases for comprehensive evaluation
const EVALUATION_CASES = {
  lead_scoring: [
    {
      name: "High-value enterprise lead - Fortune 500",
      lead: {
        first_name: "Sarah",
        last_name: "Johnson",
        company: "TechCorp Industries",
        title: "VP of Engineering",
        industry: "Technology",
        company_size: "1000+",
        website: "https://techcorp.com",
        linkedin_url: "https://linkedin.com/in/sarahjohnson"
      },
      criteria: [
        { name: "Company Size", description: "Large enterprise preferred (1000+ employees)", weight: 2.0 },
        { name: "Title Level", description: "VP+ level decision makers", weight: 1.8 },
        { name: "Industry Fit", description: "Technology companies", weight: 1.5 },
        { name: "Decision Authority", description: "Budget and purchasing authority", weight: 2.2 }
      ],
      expected_score_range: [80, 95],
      expected_strengths: ["enterprise", "decision maker", "technology", "budget authority"],
      expected_concerns: []
    },
    {
      name: "Mid-market growth company",
      lead: {
        first_name: "Michael",
        last_name: "Chen",
        company: "GrowthCo",
        title: "Director of Operations",
        industry: "SaaS",
        company_size: "201-1000",
        website: "https://growthco.com"
      },
      criteria: [
        { name: "Company Size", description: "Target mid-market companies", weight: 1.5 },
        { name: "Growth Stage", description: "Companies in expansion phase", weight: 2.0 },
        { name: "Industry Fit", description: "SaaS and tech companies", weight: 1.8 }
      ],
      expected_score_range: [65, 80],
      expected_strengths: ["growth stage", "saas", "director level"],
      expected_concerns: ["mid-market budget"]
    },
    {
      name: "Small startup - high risk",
      lead: {
        first_name: "Alex",
        last_name: "Rodriguez",
        company: "StartupCo",
        title: "Junior Developer",
        industry: "Technology",
        company_size: "1-10"
      },
      criteria: [
        { name: "Company Size", description: "Larger companies preferred", weight: 2.0 },
        { name: "Title Level", description: "Decision maker level", weight: 2.2 },
        { name: "Budget Capacity", description: "Ability to invest", weight: 1.8 }
      ],
      expected_score_range: [15, 35],
      expected_concerns: ["small company", "junior level", "limited budget", "no decision authority"]
    }
  ],
  
  message_generation: [
    {
      name: "Enterprise VP initial outreach",
      lead: {
        first_name: "Sarah",
        last_name: "Johnson",
        company: "TechCorp Industries",
        title: "VP of Engineering",
        industry: "Technology",
        company_size: "1000+"
      },
      message_type: "initial_outreach",
      context: {
        company_info: "Leading enterprise software company, recently announced $50M Series C funding",
        recent_news: "Expanding engineering team by 40%"
      },
      quality_criteria: [
        "executive-level tone",
        "mentions company growth",
        "specific value proposition",
        "references recent news",
        "clear call to action",
        "appropriate length"
      ],
      expected_response_rate_min: 20
    },
    {
      name: "Follow-up after initial contact",
      lead: {
        first_name: "Michael",
        last_name: "Chen",
        company: "GrowthCo",
        title: "Director of Operations",
        industry: "SaaS"
      },
      message_type: "follow_up",
      context: {
        previous_interactions: {
          messages: 1,
          last_message_date: "2024-01-15",
          last_activity: "email_opened"
        }
      },
      quality_criteria: [
        "references previous contact",
        "provides additional value",
        "addresses potential concerns",
        "soft persistence",
        "specific next step"
      ]
    },
    {
      name: "LinkedIn connection request",
      lead: {
        first_name: "Jennifer",
        last_name: "Park",
        company: "InnovateCorp",
        title: "Chief Technology Officer",
        industry: "FinTech"
      },
      message_type: "linkedin_message",
      context: {
        mutual_connections: "Connected through John Smith at TechConf"
      },
      quality_criteria: [
        "under 200 characters",
        "mentions mutual connection",
        "relevant to role",
        "professional tone",
        "clear reason for connecting"
      ]
    }
  ],
  
  conversation_analysis: [
    {
      name: "Interested prospect with budget timeline",
      lead: {
        first_name: "David",
        last_name: "Wilson",
        company: "ScaleCorp",
        title: "VP of Sales"
      },
      conversation: [
        { type: "outreach", content: "Hi David, noticed ScaleCorp's recent expansion..." },
        { type: "response", content: "Thanks for reaching out. We are indeed growing and looking for solutions to help scale our sales operations." },
        { type: "follow_up", content: "I'd love to show you how we've helped similar companies increase sales efficiency by 40%. Would you be available for a brief call?" },
        { type: "response", content: "That sounds interesting. Our budget planning happens in Q2, but I'd like to learn more about your approach." }
      ],
      expected_insights: ["budget planning Q2", "sales efficiency focus", "growth scaling challenges"],
      expected_interest_level: [7, 9],
      expected_urgency: "medium",
      expected_timeline: "Q2 budget cycle"
    },
    {
      name: "Price-sensitive prospect with concerns",
      lead: {
        first_name: "Lisa",
        last_name: "Thompson",
        company: "CostWise Solutions",
        title: "CFO"
      },
      conversation: [
        { type: "outreach", content: "Hi Lisa, I understand cost optimization is crucial for CFOs..." },
        { type: "response", content: "Yes, we're always looking for ways to reduce costs. What's your pricing model?" },
        { type: "follow_up", content: "Our ROI typically shows 3x return within 6 months. Can we discuss your current challenges?" },
        { type: "response", content: "That's a bold claim. We've been burned by vendors before. Need to see concrete proof and competitive pricing." }
      ],
      expected_insights: ["price sensitivity", "ROI focus", "vendor skepticism", "proof requirements"],
      expected_interest_level: [4, 6],
      expected_urgency: "low",
      expected_objections: ["pricing concerns", "vendor skepticism", "proof of ROI"]
    }
  ],

  outreach_sequences: [
    {
      name: "Standard outreach sequence execution",
      lead: {
        first_name: "Robert",
        last_name: "Martinez",
        company: "TechFlow",
        title: "Director of IT",
        industry: "Manufacturing",
        company_size: "201-1000"
      },
      sequence_type: "standard",
      expected_steps: 5,
      expected_completion_time: "14 days",
      success_criteria: [
        "all steps executed",
        "personalized content",
        "appropriate timing",
        "escalation strategy"
      ]
    }
  ],

  competitive_analysis: [
    {
      name: "Enterprise deal with known competitors",
      lead: {
        first_name: "Amanda",
        last_name: "Foster",
        company: "MegaCorp",
        title: "Chief Digital Officer",
        industry: "Financial Services",
        company_size: "1000+"
      },
      competitors: [
        { name: "Salesforce", description: "Market leader in CRM" },
        { name: "HubSpot", description: "Inbound marketing platform" }
      ],
      context: {
        solution_description: "AI-powered sales automation platform",
        unique_advantages: "Real-time lead scoring, Grok AI integration, advanced analytics"
      },
      expected_elements: [
        "competitive positioning",
        "differentiation points",
        "battle cards",
        "discovery questions"
      ]
    }
  ]
};

class GrokEvaluator {
  constructor() {
    this.results = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.performanceMetrics = {
      response_times: [],
      token_usage: [],
      error_rates: {}
    };
  }

  async runAllEvaluations() {
    console.log('🧪 Starting Comprehensive Grok SDR Evaluation Framework');
    console.log('='.repeat(60));
    
    try {
      // Initialize environment and Grok client
      console.log('🔧 Validating environment and initializing Grok client...');
      validateEnvironment();
      createGrokClient();
      
      // Initialize database for outreach sequence testing
      console.log('🗄️ Initializing database...');
      await initializeDatabase();
      
      await this.evaluateLeadScoring();
      await this.evaluateMessageGeneration();
      await this.evaluateConversationAnalysis();
      await this.evaluateOutreachSequences();
      await this.evaluateCompetitiveAnalysis();
      await this.evaluatePerformanceMetrics();
      
      this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Evaluation failed:', error.message);
    }
  }

  async evaluateLeadScoring() {
    console.log('\n📊 Evaluating Lead Scoring with Enhanced Criteria...');
    
    for (const testCase of EVALUATION_CASES.lead_scoring) {
      this.totalTests++;
      console.log(`\n  Testing: ${testCase.name}`);
      
      const startTime = Date.now();
      
      try {
        const result = await GrokSDRService.scoreLeadQualification(
          testCase.lead,
          testCase.criteria
        );
        
        const responseTime = Date.now() - startTime;
        this.performanceMetrics.response_times.push(responseTime);
        
        const evaluation = this.evaluateScoringResult(result, testCase);
        this.results.push({
          category: 'lead_scoring',
          test_name: testCase.name,
          response_time: responseTime,
          ...evaluation
        });
        
        if (evaluation.passed) {
          this.passedTests++;
          console.log(`    ✅ PASSED - Score: ${result.overall_score}, Confidence: ${result.confidence_level || 'N/A'}%`);
        } else {
          console.log(`    ❌ FAILED - ${evaluation.reason}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ERROR - ${error.message}`);
        this.trackError('lead_scoring', error.message);
        this.results.push({
          category: 'lead_scoring',
          test_name: testCase.name,
          passed: false,
          reason: `API Error: ${error.message}`,
          error: true
        });
      }
    }
  }

  async evaluateMessageGeneration() {
    console.log('\n📝 Evaluating Message Generation Quality...');
    
    for (const testCase of EVALUATION_CASES.message_generation) {
      this.totalTests++;
      console.log(`\n  Testing: ${testCase.name}`);
      
      const startTime = Date.now();
      
      try {
        const result = await GrokSDRService.generatePersonalizedMessage(
          testCase.lead,
          testCase.message_type,
          testCase.context || {}
        );
        
        const responseTime = Date.now() - startTime;
        this.performanceMetrics.response_times.push(responseTime);
        
        const evaluation = this.evaluateMessageResult(result, testCase);
        this.results.push({
          category: 'message_generation',
          test_name: testCase.name,
          response_time: responseTime,
          ...evaluation
        });
        
        if (evaluation.passed) {
          this.passedTests++;
          console.log(`    ✅ PASSED - Quality: ${evaluation.quality_score}/${evaluation.max_quality_score}`);
        } else {
          console.log(`    ❌ FAILED - ${evaluation.reason}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ERROR - ${error.message}`);
        this.trackError('message_generation', error.message);
        this.results.push({
          category: 'message_generation',
          test_name: testCase.name,
          passed: false,
          reason: `API Error: ${error.message}`,
          error: true
        });
      }
    }
  }

  async evaluateConversationAnalysis() {
    console.log('\n💬 Evaluating Conversation Analysis...');
    
    for (const testCase of EVALUATION_CASES.conversation_analysis) {
      this.totalTests++;
      console.log(`\n  Testing: ${testCase.name}`);
      
      const startTime = Date.now();
      
      try {
        const result = await GrokSDRService.analyzeConversationAdvanced(
          testCase.conversation,
          testCase.lead,
          {}
        );
        
        const responseTime = Date.now() - startTime;
        this.performanceMetrics.response_times.push(responseTime);
        
        const evaluation = this.evaluateConversationResult(result, testCase);
        this.results.push({
          category: 'conversation_analysis',
          test_name: testCase.name,
          response_time: responseTime,
          ...evaluation
        });
        
        if (evaluation.passed) {
          this.passedTests++;
          console.log(`    ✅ PASSED - Interest: ${evaluation.interest_level}, Urgency: ${evaluation.urgency}`);
        } else {
          console.log(`    ❌ FAILED - ${evaluation.reason}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ERROR - ${error.message}`);
        this.trackError('conversation_analysis', error.message);
        this.results.push({
          category: 'conversation_analysis',
          test_name: testCase.name,
          passed: false,
          reason: `Analysis Error: ${error.message}`,
          error: true
        });
      }
    }
  }

  async evaluateOutreachSequences() {
    console.log('\n📧 Evaluating Outreach Sequence Management...');
    
    for (const testCase of EVALUATION_CASES.outreach_sequences) {
      this.totalTests++;
      console.log(`\n  Testing: ${testCase.name}`);
      
      try {
        // Create sequence
        const sequenceResult = await OutreachService.createOutreachSequence(
          1, // Using test lead ID
          testCase.sequence_type
        );
        
        // Verify sequence creation
        const evaluation = this.evaluateSequenceCreation(sequenceResult, testCase);
        this.results.push({
          category: 'outreach_sequences',
          test_name: testCase.name,
          ...evaluation
        });
        
        if (evaluation.passed) {
          this.passedTests++;
          console.log(`    ✅ PASSED - Created ${evaluation.steps_created} steps`);
        } else {
          console.log(`    ❌ FAILED - ${evaluation.reason}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ERROR - ${error.message}`);
        this.trackError('outreach_sequences', error.message);
        this.results.push({
          category: 'outreach_sequences',
          test_name: testCase.name,
          passed: false,
          reason: `Sequence Error: ${error.message}`,
          error: true
        });
      }
    }
  }

  async evaluateCompetitiveAnalysis() {
    console.log('\n🏆 Evaluating Competitive Analysis Capabilities...');
    
    for (const testCase of EVALUATION_CASES.competitive_analysis) {
      this.totalTests++;
      console.log(`\n  Testing: ${testCase.name}`);
      
      try {
        const result = await GrokSDRService.generateCompetitivePositioning(
          testCase.lead,
          testCase.competitors,
          testCase.context
        );
        
        const evaluation = this.evaluateCompetitiveResult(result, testCase);
        this.results.push({
          category: 'competitive_analysis',
          test_name: testCase.name,
          ...evaluation
        });
        
        if (evaluation.passed) {
          this.passedTests++;
          console.log(`    ✅ PASSED - Found ${result.likely_competitors?.length || 0} competitors`);
        } else {
          console.log(`    ❌ FAILED - ${evaluation.reason}`);
        }
        
      } catch (error) {
        console.log(`    ❌ ERROR - ${error.message}`);
        this.trackError('competitive_analysis', error.message);
        this.results.push({
          category: 'competitive_analysis',
          test_name: testCase.name,
          passed: false,
          reason: `Analysis Error: ${error.message}`,
          error: true
        });
      }
    }
  }

  async evaluatePerformanceMetrics() {
    console.log('\n⚡ Evaluating Performance Metrics...');
    
    const avgResponseTime = this.performanceMetrics.response_times.reduce((a, b) => a + b, 0) / 
                           this.performanceMetrics.response_times.length;
    
    const performanceEval = {
      avg_response_time: avgResponseTime,
      max_response_time: Math.max(...this.performanceMetrics.response_times),
      min_response_time: Math.min(...this.performanceMetrics.response_times),
      total_errors: Object.values(this.performanceMetrics.error_rates).reduce((a, b) => a + b, 0)
    };
    
    console.log(`    Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`    Max Response Time: ${performanceEval.max_response_time}ms`);
    console.log(`    Total Errors: ${performanceEval.total_errors}`);
    
    this.results.push({
      category: 'performance',
      test_name: 'Response Time Analysis',
      passed: avgResponseTime < 5000, // 5 second threshold
      ...performanceEval
    });
  }

  evaluateSequenceCreation(result, testCase) {
    const issues = [];
    let passed = true;

    if (!result.sequence_id) {
      issues.push('No sequence ID returned');
      passed = false;
    }

    if (result.total_steps !== testCase.expected_steps) {
      issues.push(`Expected ${testCase.expected_steps} steps, got ${result.total_steps}`);
      passed = false;
    }

    return {
      passed,
      reason: issues.join('; '),
      steps_created: result.total_steps || 0
    };
  }

  evaluateCompetitiveResult(result, testCase) {
    const issues = [];
    let passed = true;

    if (!result.likely_competitors || result.likely_competitors.length === 0) {
      issues.push('No competitors identified');
      passed = false;
    }

    if (!result.positioning_strategies || result.positioning_strategies.length === 0) {
      issues.push('No positioning strategies provided');
      passed = false;
    }

    if (!result.discovery_questions || result.discovery_questions.length < 3) {
      issues.push('Insufficient discovery questions');
      passed = false;
    }

    return {
      passed,
      reason: issues.join('; '),
      competitors_found: result.likely_competitors?.length || 0,
      strategies_provided: result.positioning_strategies?.length || 0
    };
  }

  trackError(category, error) {
    if (!this.performanceMetrics.error_rates[category]) {
      this.performanceMetrics.error_rates[category] = 0;
    }
    this.performanceMetrics.error_rates[category]++;
  }

  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE EVALUATION REPORT');
    console.log('='.repeat(60));
    
    const passRate = (this.passedTests / this.totalTests * 100).toFixed(1);
    console.log(`\n📊 Overall Results: ${this.passedTests}/${this.totalTests} tests passed (${passRate}%)`);
    
    // Category breakdown
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryTotal = categoryResults.length;
      const categoryRate = (categoryPassed / categoryTotal * 100).toFixed(1);
      
      console.log(`\n${category.replace('_', ' ').toUpperCase()}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      
      categoryResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        const timing = result.response_time ? ` (${result.response_time}ms)` : '';
        console.log(`  ${status} ${result.test_name}${timing}`);
        if (!result.passed && result.reason) {
          console.log(`     ${result.reason}`);
        }
      });
    });

    // Performance analysis
    if (this.performanceMetrics.response_times.length > 0) {
      const avgTime = this.performanceMetrics.response_times.reduce((a, b) => a + b, 0) / 
                     this.performanceMetrics.response_times.length;
      console.log(`\n⚡ Performance: Avg ${avgTime.toFixed(0)}ms response time`);
    }

    // Enhanced recommendations
    console.log('\n🔍 DETAILED RECOMMENDATIONS:');
    this.generateDetailedRecommendations();

    this.saveDetailedResults();
    console.log('\n✅ Comprehensive evaluation complete! Check evaluation/results.json for full details.');
  }

  generateDetailedRecommendations() {
    const recommendations = [];
    
    // Overall performance
    const passRate = (this.passedTests / this.totalTests * 100);
    if (passRate < 80) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Overall Performance',
        issue: `Pass rate ${passRate.toFixed(1)}% below 80% threshold`,
        recommendations: [
          'Review and optimize prompt engineering strategies',
          'Implement more robust error handling and fallback mechanisms',
          'Add comprehensive input validation',
          'Consider model fine-tuning for specific use cases'
        ]
      });
    }

    // Category-specific recommendations
    const categories = ['lead_scoring', 'message_generation', 'conversation_analysis'];
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassRate = categoryResults.filter(r => r.passed).length / categoryResults.length;
      
      if (categoryPassRate < 0.8) {
        recommendations.push({
          priority: categoryPassRate < 0.6 ? 'HIGH' : 'MEDIUM',
          category: category.replace('_', ' ').toUpperCase(),
          issue: `Low success rate: ${(categoryPassRate * 100).toFixed(1)}%`,
          recommendations: this.getCategorySpecificRecommendations(category)
        });
      }
    });

    recommendations.forEach(rec => {
      console.log(`\n${rec.priority} PRIORITY - ${rec.category}:`);
      console.log(`  Issue: ${rec.issue}`);
      rec.recommendations.forEach(r => console.log(`  • ${r}`));
    });
  }

  getCategorySpecificRecommendations(category) {
    const recommendations = {
      lead_scoring: [
        'Enhance scoring criteria with industry-specific weights',
        'Implement confidence scoring validation',
        'Add fallback scoring for edge cases',
        'Create scoring explanation features'
      ],
      message_generation: [
        'Improve personalization depth and accuracy',
        'Add message quality scoring system',
        'Implement A/B testing for message variants',
        'Create industry-specific message templates'
      ],
      conversation_analysis: [
        'Enhance sentiment analysis accuracy',
        'Improve intent detection algorithms',
        'Add conversation context tracking',
        'Implement conversation outcome prediction'
      ],
      outreach_sequences: [
        'Add sequence performance tracking',
        'Implement dynamic sequence optimization',
        'Create sequence A/B testing framework',
        'Add personalized timing optimization'
      ],
      competitive_analysis: [
        'Expand competitive intelligence database',
        'Improve positioning strategy generation',
        'Add competitive landscape visualization',
        'Create dynamic battle card generation'
      ]
    };
    
    return recommendations[category] || [];
  }

  saveDetailedResults() {
    const reportData = {
      timestamp: new Date().toISOString(),
      version: '2.0',
      summary: {
        total_tests: this.totalTests,
        passed_tests: this.passedTests,
        pass_rate: (this.passedTests / this.totalTests * 100).toFixed(1) + '%',
        average_response_time: this.performanceMetrics.response_times.length > 0 
          ? (this.performanceMetrics.response_times.reduce((a, b) => a + b, 0) / this.performanceMetrics.response_times.length).toFixed(0) + 'ms'
          : 'N/A'
      },
      performance_metrics: this.performanceMetrics,
      results: this.results,
      recommendations: this.generateRecommendationsData(),
      evaluation_cases: EVALUATION_CASES
    };

    const resultsPath = path.join(__dirname, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
  }

  generateRecommendationsData() {
    return {
      immediate_actions: [
        'Optimize prompts for consistency',
        'Implement better error handling',
        'Add performance monitoring'
      ],
      medium_term: [
        'Create evaluation automation pipeline',
        'Implement A/B testing framework',
        'Add competitive intelligence features'
      ],
      long_term: [
        'Consider model fine-tuning',
        'Implement predictive analytics',
        'Create self-improving AI systems'
      ]
    };
  }

  // Keep existing evaluation methods
  evaluateScoringResult(result, testCase) {
    const issues = [];
    let passed = true;

    // Check if score is in expected range
    if (result.overall_score < testCase.expected_score_range[0] || 
        result.overall_score > testCase.expected_score_range[1]) {
      issues.push(`Score ${result.overall_score} not in expected range ${testCase.expected_score_range}`);
      passed = false;
    }

    // Check for expected strengths
    if (testCase.expected_strengths) {
      const foundStrengths = (result.strengths || []).join(' ').toLowerCase();
      const missingStrengths = testCase.expected_strengths.filter(
        strength => !foundStrengths.includes(strength.toLowerCase())
      );
      if (missingStrengths.length > 0) {
        issues.push(`Missing expected strengths: ${missingStrengths.join(', ')}`);
      }
    }

    // Check for expected concerns
    if (testCase.expected_concerns) {
      const foundConcerns = (result.concerns || []).join(' ').toLowerCase();
      const missingConcerns = testCase.expected_concerns.filter(
        concern => !foundConcerns.includes(concern.toLowerCase())
      );
      if (missingConcerns.length > 0) {
        issues.push(`Missing expected concerns: ${missingConcerns.join(', ')}`);
      }
    }

    return {
      passed,
      reason: issues.join('; '),
      score_received: result.overall_score,
      score_expected: testCase.expected_score_range
    };
  }

  evaluateMessageResult(result, testCase) {
    const issues = [];
    let qualityScore = 0;
    let passed = true;

    const content = result.content || '';
    const subject = result.subject || '';

    for (const criterion of testCase.quality_criteria) {
      switch (criterion) {
        case 'personalized greeting':
        case 'personalized':
          if (content.includes(testCase.lead.first_name)) {
            qualityScore++;
          } else {
            issues.push('Missing personalized greeting');
          }
          break;
          
        case 'mentions company or role':
        case 'mentions company growth':
          if (content.includes(testCase.lead.company) || content.includes(testCase.lead.title)) {
            qualityScore++;
          } else {
            issues.push('Does not mention company or role');
          }
          break;
          
        case 'clear value proposition':
        case 'specific value proposition':
          if (content.length > 100 && (content.includes('help') || content.includes('benefit') || content.includes('solution'))) {
            qualityScore++;
          } else {
            issues.push('Lacks clear value proposition');
          }
          break;
          
        case 'professional tone':
        case 'executive-level tone':
          if (!content.includes('Hey') && !content.includes('!!!')) {
            qualityScore++;
          } else {
            issues.push('Tone too casual');
          }
          break;
          
        case 'specific call to action':
        case 'clear call to action':
          if (content.includes('call') || content.includes('meeting') || content.includes('demo') || content.includes('discuss')) {
            qualityScore++;
          } else {
            issues.push('Missing call to action');
          }
          break;
          
        case 'under 200 characters':
          if (content.length <= 200) {
            qualityScore++;
          } else {
            issues.push(`Too long: ${content.length} characters`);
          }
          break;
          
        case 'appropriate length':
          if (content.length >= 100 && content.length <= 300) {
            qualityScore++;
          } else {
            issues.push(`Length ${content.length} not appropriate`);
          }
          break;
          
        case 'references recent news':
          if (testCase.context?.recent_news && content.toLowerCase().includes('expand')) {
            qualityScore++;
          }
          break;
          
        default:
          qualityScore++; // Give benefit of doubt for unspecified criteria
      }
    }

    const minQualityScore = Math.ceil(testCase.quality_criteria.length * 0.6);
    if (qualityScore < minQualityScore) {
      passed = false;
    }

    return {
      passed,
      reason: issues.join('; '),
      quality_score: qualityScore,
      max_quality_score: testCase.quality_criteria.length
    };
  }

  evaluateConversationResult(result, testCase) {
    const issues = [];
    let passed = true;

    // Check interest level range
    if (result.interest_level < testCase.expected_interest_level[0] || 
        result.interest_level > testCase.expected_interest_level[1]) {
      issues.push(`Interest level ${result.interest_level} not in expected range ${testCase.expected_interest_level}`);
      passed = false;
    }

    // Check expected urgency
    if (testCase.expected_urgency && result.urgency !== testCase.expected_urgency) {
      issues.push(`Expected urgency ${testCase.expected_urgency}, got ${result.urgency}`);
    }

    // Check for expected insights
    if (testCase.expected_insights) {
      const foundInsights = (result.key_insights || []).join(' ').toLowerCase();
      const missingInsights = testCase.expected_insights.filter(
        insight => !foundInsights.includes(insight.toLowerCase())
      );
      if (missingInsights.length > 0) {
        issues.push(`Missing expected insights: ${missingInsights.join(', ')}`);
      }
    }

    return {
      passed,
      reason: issues.join('; '),
      interest_level: result.interest_level,
      urgency: result.urgency
    };
  }

  evaluateScoringResult(result, testCase) {
    const issues = [];
    let passed = true;

    // Check if score is in expected range
    if (result.overall_score < testCase.expected_score_range[0] || 
        result.overall_score > testCase.expected_score_range[1]) {
      issues.push(`Score ${result.overall_score} not in expected range ${testCase.expected_score_range}`);
      passed = false;
    }

    // Check for expected strengths
    if (testCase.expected_strengths) {
      const foundStrengths = (result.strengths || []).join(' ').toLowerCase();
      const missingStrengths = testCase.expected_strengths.filter(
        strength => !foundStrengths.includes(strength.toLowerCase())
      );
      if (missingStrengths.length > 0) {
        issues.push(`Missing expected strengths: ${missingStrengths.join(', ')}`);
      }
    }

    // Check for expected concerns
    if (testCase.expected_concerns) {
      const foundConcerns = (result.concerns || []).join(' ').toLowerCase();
      const missingConcerns = testCase.expected_concerns.filter(
        concern => !foundConcerns.includes(concern.toLowerCase())
      );
      if (missingConcerns.length > 0) {
        issues.push(`Missing expected concerns: ${missingConcerns.join(', ')}`);
      }
    }

    return {
      passed,
      reason: issues.join('; '),
      score_received: result.overall_score,
      score_expected: testCase.expected_score_range
    };
  }

  evaluateMessageResult(result, testCase) {
    const issues = [];
    let qualityScore = 0;
    let passed = true;

    const content = result.content || '';
    const subject = result.subject || '';

    for (const criterion of testCase.quality_criteria) {
      switch (criterion) {
        case 'personalized greeting':
          if (content.includes(testCase.lead.first_name)) {
            qualityScore++;
          } else {
            issues.push('Missing personalized greeting');
          }
          break;
          
        case 'mentions company or role':
          if (content.includes(testCase.lead.company) || content.includes(testCase.lead.title)) {
            qualityScore++;
          } else {
            issues.push('Does not mention company or role');
          }
          break;
          
        case 'clear value proposition':
          if (content.length > 100 && (content.includes('help') || content.includes('benefit') || content.includes('solution'))) {
            qualityScore++;
          } else {
            issues.push('Lacks clear value proposition');
          }
          break;
          
        case 'professional tone':
          if (!content.includes('Hey') && !content.includes('!!!')) {
            qualityScore++;
          } else {
            issues.push('Tone too casual');
          }
          break;
          
        case 'specific call to action':
          if (content.includes('call') || content.includes('meeting') || content.includes('demo') || content.includes('discuss')) {
            qualityScore++;
          } else {
            issues.push('Missing call to action');
          }
          break;
          
        case 'under 200 characters':
          if (content.length <= 200) {
            qualityScore++;
          } else {
            issues.push(`Too long: ${content.length} characters`);
          }
          break;
      }
    }

    const minQualityScore = Math.ceil(testCase.quality_criteria.length * 0.6);
    if (qualityScore < minQualityScore) {
      passed = false;
    }

    return {
      passed,
      reason: issues.join('; '),
      quality_score: qualityScore,
      max_quality_score: testCase.quality_criteria.length
    };
  }

  evaluateConversationResult(result, testCase) {
    const issues = [];
    let passed = true;

    // Check interest level range
    if (result.interest_level < testCase.expected_interest_level[0] || 
        result.interest_level > testCase.expected_interest_level[1]) {
      issues.push(`Interest level ${result.interest_level} not in expected range ${testCase.expected_interest_level}`);
      passed = false;
    }

    // Check expected urgency
    if (testCase.expected_urgency && result.urgency !== testCase.expected_urgency) {
      issues.push(`Expected urgency ${testCase.expected_urgency}, got ${result.urgency}`);
    }

    // Check for expected insights
    if (testCase.expected_insights) {
      const foundInsights = (result.key_insights || []).join(' ').toLowerCase();
      const missingInsights = testCase.expected_insights.filter(
        insight => !foundInsights.includes(insight.toLowerCase())
      );
      if (missingInsights.length > 0) {
        issues.push(`Missing expected insights: ${missingInsights.join(', ')}`);
      }
    }

    return {
      passed,
      reason: issues.join('; '),
      interest_level: result.interest_level,
      urgency: result.urgency
    };
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 EVALUATION REPORT');
    console.log('='.repeat(50));
    
    const passRate = (this.passedTests / this.totalTests * 100).toFixed(1);
    console.log(`\n📊 Overall Results: ${this.passedTests}/${this.totalTests} tests passed (${passRate}%)`);
    
    // Results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;
      const categoryTotal = categoryResults.length;
      const categoryRate = (categoryPassed / categoryTotal * 100).toFixed(1);
      
      console.log(`\n${category.replace('_', ' ').toUpperCase()}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`);
      
      categoryResults.forEach(result => {
        const status = result.passed ? '✅' : '❌';
        console.log(`  ${status} ${result.test_name}`);
        if (!result.passed && result.reason) {
          console.log(`     Reason: ${result.reason}`);
        }
      });
    });

    // Recommendations
    console.log('\n🔍 RECOMMENDATIONS:');
    
    if (passRate < 70) {
      console.log('❗ Overall pass rate is below 70%. Consider:');
      console.log('  - Refining prompts for better consistency');
      console.log('  - Adding more context to API calls');
      console.log('  - Implementing prompt templates');
    }
    
    const scoringResults = this.results.filter(r => r.category === 'lead_scoring');
    const scoringPassRate = scoringResults.filter(r => r.passed).length / scoringResults.length * 100;
    
    if (scoringPassRate < 80) {
      console.log('📊 Lead scoring needs improvement:');
      console.log('  - Add more detailed scoring criteria descriptions');
      console.log('  - Implement scoring validation rules');
      console.log('  - Consider weighted scoring algorithms');
    }
    
    const messageResults = this.results.filter(r => r.category === 'message_generation');
    const messagePassRate = messageResults.filter(r => r.passed).length / messageResults.length * 100;
    
    if (messagePassRate < 80) {
      console.log('📝 Message generation needs improvement:');
      console.log('  - Enhance personalization prompts');
      console.log('  - Add message quality validation');
      console.log('  - Implement message templates');
    }

    // Save detailed results
    this.saveDetailedResults();
    
    console.log('\n✅ Evaluation complete! Check evaluation/results.json for detailed results.');
  }

  saveDetailedResults() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.totalTests,
        passed_tests: this.passedTests,
        pass_rate: (this.passedTests / this.totalTests * 100).toFixed(1) + '%'
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };

    const resultsPath = path.join(__dirname, 'results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(reportData, null, 2));
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Category-specific recommendations
    const categories = ['lead_scoring', 'message_generation', 'conversation_analysis'];
    
    categories.forEach(category => {
      const categoryResults = this.results.filter(r => r.category === category);
      const passRate = categoryResults.filter(r => r.passed).length / categoryResults.length;
      
      if (passRate < 0.8) {
        recommendations.push({
          category,
          priority: 'high',
          issue: `Low pass rate (${(passRate * 100).toFixed(1)}%)`,
          suggestions: this.getCategorySpecificSuggestions(category)
        });
      }
    });
    
    return recommendations;
  }

  getCategorySpecificSuggestions(category) {
    const suggestions = {
      lead_scoring: [
        'Refine scoring criteria descriptions for clarity',
        'Add industry-specific scoring weights',
        'Implement score validation ranges',
        'Add more contextual information to prompts'
      ],
      message_generation: [
        'Improve personalization prompts',
        'Add message length validation',
        'Implement tone consistency checks',
        'Create message quality scoring system'
      ],
      conversation_analysis: [
        'Enhance conversation context processing',
        'Add sentiment analysis validation',
        'Improve insight extraction accuracy',
        'Implement confidence scoring for analysis'
      ]
    };
    
    return suggestions[category] || [];
  }
}

// Run evaluations if called directly
if (require.main === module) {
  const evaluator = new GrokEvaluator();
  evaluator.runAllEvaluations().catch(console.error);
}

module.exports = { GrokEvaluator, EVALUATION_CASES };
