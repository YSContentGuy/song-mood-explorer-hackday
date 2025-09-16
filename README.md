# Song Mood Explorer - Hackday Project

A Node.js API for exploring song moods using the Yousician API. This project provides endpoints to search songs by mood, get mood-based recommendations, and analyze mood patterns across multiple songs.

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
   - Add your Yousician API key:
   ```
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

## Project Structure

```
├── src/
│   ├── yousician-client.js    # Yousician API client with real data structure
│   └── mood-explorer.js       # Contextual mood analysis and recommendations
├── index.js                   # Express server with contextual endpoints
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Example Usage

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

## Development

- Uses Express.js for the REST API
- Axios for HTTP requests to Yousician API
- CORS enabled for cross-origin requests
- Environment variables for configuration

## Contributing

This is a hackday project. Feel free to contribute and experiment!