require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Import our modules
const { initializeDatabase } = require('./src/database/init');
const { createGrokClient } = require('./src/services/grok');
const apiRoutes = require('./src/routes/api');
const { errorHandler, notFound } = require('./src/middleware/error');
const { validateEnvironment } = require('./src/utils/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyTimeout: 60 * 1000, // 1 minute
  points: 100, // 100 requests per minute
});

const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: require('./package.json').version
  });
});

// For development: simple API status page
app.get('/', (req, res) => {
  res.json({
    message: 'Grok SDR API Server',
    status: 'running',
    version: require('./package.json').version,
    endpoints: {
      health: '/health',
      api: '/api',
      leads: '/api/leads',
      dashboard: '/api/analytics/dashboard'
    }
  });
});

// Serve static files from React build (commented out for development)
// app.use(express.static(path.join(__dirname, 'client/build')));

// Serve React app for all other routes (commented out for development)
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'client/build/index.html'));
// });

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    console.log('🔧 Validating environment...');
    validateEnvironment();
    
    console.log('🗄️ Initializing database...');
    await initializeDatabase();
    
    console.log('🤖 Initializing Grok client...');
    createGrokClient();
    
    app.listen(PORT, () => {
      console.log(`🚀 Grok SDR System running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('💥 Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
