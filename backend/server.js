require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Import our modules
const { createGrokClient } = require('./src/services/grok');
const { FirestoreService } = require('./src/services/firestore');
const firestoreApiRoutes = require('./src/routes/firestore-api');
const { errorHandler, notFound } = require('./src/middleware/error');
const { validateEnvironment } = require('./src/utils/validation');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  duration: 60, // seconds
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
      scriptSrc: ["'self'", "https://apis.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.googleapis.com", "https://*.firebaseapp.com", "https://*.google.com"],
      frameSrc: ["'self'", "https://*.firebaseapp.com", "https://accounts.google.com"],
    },
  },
}));
app.set('trust proxy', 1);
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimitMiddleware);

// API routes
app.use('/api', firestoreApiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: require('./package.json').version
  });
});

// Serve the React build (copied to ./public in Docker) with SPA fallback
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get(/^\/(?!api\/|health).*/, (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'Salesly API', status: 'running', health: '/health' });
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize and start server
async function startServer() {
  try {
    console.log('🔧 Validating environment...');
    validateEnvironment();
    
    console.log('� Initializing Firestore...');
    const firestoreService = new FirestoreService();
    console.log('✅ Firestore initialized');
    
    console.log('🤖 Initializing Grok client...');
    createGrokClient();
    
    app.listen(PORT, () => {
      console.log(`🚀 Salesly Firestore API running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Frontend: http://localhost:${PORT}`);
      console.log(`🔌 API: http://localhost:${PORT}/api`);
      console.log(`🔥 Database: Firestore`);
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
