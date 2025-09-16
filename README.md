# Song Mood Explorer - Hackday Project

A Node.js API for exploring song moods using Yousician's song database. This project provides contextual recommendations that go beyond comfort zone algorithms by incorporating variable factors like mood, time, goals, and inspiration. Built as a proof of concept with mock data, ready for integration with Pavel's 100k song dataset.

## Features

- 🎵 Fetch songs from Yousician API with rich metadata (artist, genre, difficulty, style tags)
- 🎭 Contextual recommendations beyond comfort zone based on variable factors
- 🔍 Search songs by mood with intelligent style tag mapping
- 💡 Time-aware recommendations (morning energy vs evening calm)
- 📊 Analyze user mood patterns from playing history
- ⚡ Goal-based filtering (challenge vs relax modes)
- 🕒 Duration-aware suggestions based on available practice time

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd song-mood-explorer-hackday
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - For proof of concept (default): Set `USE_REAL_API=false`
   - For real Yousician data: Set `USE_REAL_API=true` and add your API key
   ```
   USE_REAL_API=false
   YOUSICIAN_API_KEY=your_api_key_here
   YOUSICIAN_BASE_URL=https://api.yousician.com
   PORT=3000
   ```

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Base URL: `http://localhost:3000`

- `GET /` - API documentation and available endpoints
- `GET /health` - Health check endpoint

### Songs
- `GET /songs` - Get all songs (with optional query parameters)
- `GET /songs/:id` - Get specific song by ID
- `GET /songs/:id/mood` - Get mood analysis for a specific song

### Contextual Mood Exploration
- `POST /mood/contextual-recommendations` - Get context-aware recommendations beyond comfort zone
- `GET /mood/search?mood=happy&limit=10` - Search songs by mood with style tag mapping
- `POST /mood/analyze-patterns` - Analyze user mood patterns from play history
- `GET /mood/suggestions` - Get mood suggestions based on time and context

### Demo Endpoints (Proof of Concept)
- `GET /demo/users` - View artificial user profiles for testing
- `GET /demo/contexts` - View context scenarios for mood recommendations
- `GET /demo/dataset-stats` - View mock dataset statistics
- `POST /demo/full-recommendation` - Complete recommendation flow demo

## Project Structure

```
├── src/
│   ├── yousician-client.js    # API client (mock + real data modes)
│   ├── mood-explorer.js       # Contextual mood analysis and recommendations
│   ├── dataset-loader.js      # Dataset management (ready for Pavel's data)
│   └── mock-data.js          # Sample songs and user profiles for PoC
├── index.js                   # Express server with demo endpoints
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Example Usage

### Demo: Full recommendation flow with artificial users:
```bash
curl -X POST "http://localhost:3000/demo/full-recommendation" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_intermediate",
    "contextId": "weekend_challenge"
  }'
```

### View available demo users and contexts:
```bash
curl "http://localhost:3000/demo/users"
curl "http://localhost:3000/demo/contexts"
```

### Get contextual recommendations beyond comfort zone:
```bash
curl -X POST "http://localhost:3000/mood/contextual-recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "userProfile": {
      "skillLevel": 3,
      "genrePreferences": ["rock", "pop"],
      "instrument": "guitar"
    },
    "context": {
      "mood": "energetic",
      "timeOfDay": "afternoon",
      "availableTime": 20,
      "goals": "challenge",
      "exploreNewMoods": true
    }
  }'
```

### Get mood suggestions for current context:
```bash
curl "http://localhost:3000/mood/suggestions?timeOfDay=evening&availableTime=10&goals=relax"
```

### Analyze mood patterns from play history:
```bash
curl -X POST "http://localhost:3000/mood/analyze-patterns" \
  -H "Content-Type: application/json" \
  -d '{
    "playHistory": [
      {
        "song": { "style_tags": ["upbeat", "rock"] },
        "timestamp": "2024-01-01T10:00:00Z"
      }
    ]
  }'
```

## Data Integration

### Current Status: Proof of Concept
- **Mock Data**: 8 sample songs with realistic Yousician metadata structure
- **Artificial Users**: 3 user profiles (beginner, intermediate, advanced)
- **Context Scenarios**: 4 test scenarios for different moods/times/goals

### Next Steps: Pavel's Dataset Integration
- Ready to integrate ~100k songs from Pavel's dataset
- Dataset loader prepared for fast processing of large song collections
- Maintains same API interface for seamless transition

## Development

- Uses Express.js for the REST API
- Mock data mode for immediate testing (no API keys required)
- Real API mode ready for Yousician integration
- CORS enabled for cross-origin requests
- Environment variables for configuration

## Contributing

This is a hackday project focused on contextual music recommendations beyond comfort zones. The proof of concept demonstrates the "mapping model" for how variable factors (mood, time, goals) can enhance existing recommendation algorithms.