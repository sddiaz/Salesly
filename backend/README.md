# xAI Assessment Application

A Node.js application demonstrating integration with xAI's Grok API.

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   # Copy the example env file
   cp .env.example .env

   # Edit .env and add your API key
   # XAI_API_KEY=your_actual_key_here
   ```

3. **Run the application:**
   ```bash
   npm start
   ```

## API Configuration

The application uses the following default settings:

- **Model**: `grok-3-mini`
- **Base URL**: `https://api.x.ai/v1`
- **Temperature**: `0.7` (configurable per request)
- **Timeout**: `30 seconds`
- **Max Retries**: `3`

## Environment Variables

| Variable      | Description      | Required |
| ------------- | ---------------- | -------- |
| `XAI_API_KEY` | Your xAI API key | Yes      |

## Project Structure

```
app/
├── index.js          # Main application logic
├── package.json      # Node.js dependencies and scripts
├── .env.example      # Environment variable template
├── .env              # Your actual environment variables (not in git)
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Usage Examples

The demo includes three examples showcasing different use cases:

1. **General Q&A** (temperature: 0.7)
2. **Technical explanations** (temperature: 0.3 for consistency)
3. **Creative tasks** (temperature: 0.9 for variety)

## Error Handling

The application handles common API errors:

- **401**: Authentication issues
- **429**: Rate limiting
- **5xx**: Service unavailability
- **Network**: Timeout and connection issues
