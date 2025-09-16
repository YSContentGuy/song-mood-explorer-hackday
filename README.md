# Song Mood Explorer - Hackday Project

A Node.js API for exploring song moods using the Yousician API. This project provides endpoints to search songs by mood, get mood-based recommendations, and analyze mood patterns across multiple songs.

## Features

- 🎵 Fetch songs from Yousician API
- 🎭 Analyze song moods and patterns
- 🔍 Search songs by mood criteria
- 💡 Get mood-based song recommendations
- 📊 Aggregate mood statistics across multiple songs

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

### Mood Exploration
- `GET /mood/search?mood=happy&limit=10` - Search songs by mood
- `GET /mood/recommendations?currentMood=sad` - Get mood-based recommendations
- `POST /mood/analyze` - Analyze mood patterns (send `{"songIds": ["id1", "id2"]}`)

## Project Structure

```
├── src/
│   ├── yousician-client.js    # Yousician API client
│   └── mood-explorer.js       # Mood analysis logic
├── index.js                   # Express server and routes
├── package.json              # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Example Usage

### Search for happy songs:
```bash
curl "http://localhost:3000/mood/search?mood=happy&limit=5"
```

### Get recommendations for someone feeling sad:
```bash
curl "http://localhost:3000/mood/recommendations?currentMood=sad"
```

### Analyze mood patterns:
```bash
curl -X POST "http://localhost:3000/mood/analyze" \
  -H "Content-Type: application/json" \
  -d '{"songIds": ["song1", "song2", "song3"]}'
```

## Development

- Uses Express.js for the REST API
- Axios for HTTP requests to Yousician API
- CORS enabled for cross-origin requests
- Environment variables for configuration

## Contributing

This is a hackday project. Feel free to contribute and experiment!