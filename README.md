# Grok-Powered SDR System

An intelligent Sales Development Representative (SDR) system leveraging Grok AI to enhance and automate the sales prospecting process.

## 🚀 Features

### Core Features

- **Lead Management**: CRUD operations with comprehensive lead data
- **AI-Powered Lead Scoring**: Grok-based qualification assessment with customizable criteria
- **Personalized Messaging**: AI-generated outreach messages tailored to lead profiles
- **Grok Consultation**: Interactive AI assistant for lead strategy and insights
- **Real-time Dashboard**: Analytics and pipeline visualization
- **Activity Tracking**: Comprehensive lead interaction history

### Technical Highlights

- **Grok API Integration**: Advanced prompt engineering for sales use cases
- **Evaluation Framework**: Systematic testing and optimization of AI performance
- **Production-Ready**: Error handling, rate limiting, validation, and security
- **Modern UI**: React TypeScript frontend with professional design
- **RESTful API**: Comprehensive backend with SQLite database

## 🏗️ Architecture

```
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── services/       # Grok AI service layer
│   │   ├── routes/         # API endpoints
│   │   ├── database/       # SQLite database layer
│   │   ├── middleware/     # Error handling, validation
│   │   └── utils/          # Utilities and validation
│   ├── evaluation/         # AI evaluation framework
│   ├── scripts/           # Database seeding
│   └── data/              # SQLite database file
│
├── client/                 # React TypeScript frontend
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/         # Main application pages
│       └── styles/        # CSS styling
│
├── docker-compose.yml      # Container orchestration
└── Dockerfile             # Multi-stage production build
```

## 🛠️ Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Quick Start

1. **Clone and Setup**

   ```bash
   git clone <repository-url>
   cd xai-assessment
   ```

2. **Backend Setup**

   ```bash
   cd backend
   yarn

   # Create environment file
   cp .env.example .env
   # Add your XAI_API_KEY to .env

   # Start backend server
   yarn run start
   ```

3. **Frontend Setup** (new terminal)

   ```bash
   cd client
   yarn
   yarn run start
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/health

### Environment Variables

```env
# Required
XAI_API_KEY=your_grok_api_key_here

# Optional
NODE_ENV=development
PORT=3001
DATABASE_PATH=./data/sdr_system.db
```

## 🐳 Docker Deployment

### Quick Deploy

```bash
# Set your API key
export XAI_API_KEY=your_grok_api_key_here

# Build and run
docker-compose up --build
```

### Production Deploy

```bash
# Build production image
docker build -t grok-sdr:latest .

# Run with environment
docker run -d \
  -p 3001:3001 \
  -e XAI_API_KEY=your_key \
  -v grok_data:/app/data \
  grok-sdr:latest
```

## 📚 API Documentation

### Core Endpoints

#### Leads Management

- `GET /api/leads` - List leads with filtering/pagination
- `POST /api/leads` - Create new lead
- `GET /api/leads/:id` - Get lead details with activities
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead

#### AI Features

- `POST /api/leads/:id/score` - Score lead qualification
- `POST /api/leads/:id/messages/generate` - Generate personalized message
- `POST /api/leads/:id/consult` - Consult Grok about lead strategy

#### Analytics

- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/health` - System health check

### Example API Calls

**Create Lead:**

```bash
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "company": "Tech Corp",
    "title": "VP Engineering",
    "industry": "Technology"
  }'
```

**Score Lead:**

```bash
curl -X POST http://localhost:3001/api/leads/1/score \
  -H "Content-Type: application/json" \
  -d '{
    "criteria_ids": [1, 2, 3]
  }'
```

**Consult Grok:**

```bash
curl -X POST http://localhost:3001/api/leads/1/consult \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the best outreach strategy for this lead?"
  }'
```

## 🧪 Evaluation Framework

The system includes a comprehensive evaluation framework for testing and optimizing Grok performance:

```bash
cd backend
node evaluation/run-evals.js
```

**Evaluation Categories:**

- Lead scoring accuracy and consistency
- Message personalization quality
- Response relevance and helpfulness
- Error handling and edge cases

## 🎯 Demo Features

### Dashboard Analytics

- Total leads and pipeline overview
- Lead status distribution
- Average scoring metrics
- Recent activity feed
- AI-powered insights

### Lead Management

- Create/edit leads with comprehensive data
- Advanced filtering and search
- Lead scoring with custom criteria
- Activity and message history

### Grok AI Integration

- Real-time lead consultation
- Personalized message generation
- Strategic outreach recommendations
- Context-aware responses

## 🔧 Troubleshooting

### Common Issues

**Backend won't start:**

```bash
# Check if port 3001 is in use
netstat -an | findstr :3001

# Kill existing process and restart
```

**Frontend can't connect to API:**

- Verify backend is running on port 3001
- Check proxy setting in client/package.json
- Ensure no firewall blocking connections

**Grok API errors:**

- Verify XAI_API_KEY is set correctly
- Check API key has sufficient credits
- Review rate limiting in logs

**Database issues:**

```bash
# Reset database
rm backend/data/sdr_system.db
npm start  # Will recreate with seed data
```

## 🔐 Security Features

- Rate limiting (100 requests/minute per IP)
- Input validation and sanitization
- SQL injection prevention
- Content Security Policy headers
- CORS configuration
- Error handling without information leakage

## 📈 Performance Optimizations

- Database indexing on frequently queried fields
- Response caching for dashboard stats
- Efficient pagination for large datasets
- Connection pooling and query optimization
- Frontend component memoization

## 🚦 Production Considerations

- **Monitoring**: Health checks and logging
- **Scaling**: Horizontal scaling with load balancer
- **Security**: HTTPS, authentication, API rate limiting
- **Database**: PostgreSQL for production workloads
- **Caching**: Redis for session and response caching
- **CI/CD**: Automated testing and deployment pipelines

## 🧑‍💻 Development

### Project Structure

```
backend/src/
├── services/grok.js       # Core Grok AI integration
├── routes/api.js          # REST API endpoints
├── database/init.js       # Database schema & operations
├── middleware/error.js    # Error handling
└── utils/validation.js    # Input validation

client/src/
├── pages/                 # Main application screens
├── components/            # Reusable UI components
└── styles/               # CSS and styling
```

### Key Technologies

- **Backend**: Node.js, Express, SQLite, Grok API
- **Frontend**: React, TypeScript, CSS3
- **DevOps**: Docker, Docker Compose
- **AI**: Grok-3-mini model with custom prompts

## 📝 License

This project is created for the xAI assessment and demonstrates production-ready SDR automation capabilities.

---

**Built with ❤️ for xAI Engineering Assessment**
