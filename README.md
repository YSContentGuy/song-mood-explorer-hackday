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

## Quick Demo

Run the server and open the one-page demo.

1) Install + run
```
npm install
npm run dev
```

2) Open the demo
```
http://localhost:3000/basic-demo.html
```
What it does: three user buttons → click one to see a short blurb (level + tastes), an inferred mood, and a single song recommendation with a score.

API docs: `http://localhost:3000/api`  •  Health: `http://localhost:3000/health`

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

## Example API Calls

```bash
# Users overview (blurbs + inferred moods + top suggestion)
curl http://localhost:3000/api/demo/users-overview | jq

# Single-user suggestion (use inferred mood from the overview)
curl "http://localhost:3000/api/demo/user-suggestion?userId=user_intermediate&mood=relaxed&timeOfDay=evening&availableTime=20&goals=relax" | jq

# Import your CSV
curl -X POST http://localhost:3000/api/import/local-csv \
  -H 'Content-Type: application/json' \
  -d '{"path":"song metadata (2).csv"}' | jq
```

## Offline Static Demo (No Server)

Build a self-contained HTML you can open directly in a browser.

- Use your CSV:
```
npm run build:story:csv
open public/story-static.html         # macOS
# or: start "" public\story-static.html   # Windows
```

- Use the bundled YS dataset:
```
npm run build:story
open public/story-static.html
```

This generates `public/story-static.html`, which shows the three users, their inferred mood/time/goal, and one suggested song each with a “Why this song” line.

## Scripts

- `npm run dev` — start server at `http://localhost:3000`
- `npm run build:story` — build static demo using bundled YS dataset
- `npm run build:story:csv` — build static demo using `song metadata (2).csv`

## Enable Real LLM Tagging (optional)

By default, LLM mood tags are simulated for reliability in a hackday setting. To call a real LLM:

1) Set env vars in `.env` (or your runtime environment):
```
OPENAI_API_KEY=sk-...
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
```
2) Start the server and enhance a subset of songs:
```
npm run dev
curl -X POST http://localhost:3000/api/llm/enhance \
  -H 'Content-Type: application/json' \
  -d '{"maxSongs": 15, "onlySparseTags": true}' | jq
```
3) Inspect results / fusion:
```
curl http://localhost:3000/api/llm/enhanced-songs | jq
curl -X POST http://localhost:3000/api/mood/unified-profiles \
  -H 'Content-Type: application/json' \
  -d '{"maxSongs": 15, "useEnhancedSongs": true}' | jq
```
If the env keys aren’t set, the system falls back to a local, deterministic simulation.

## Pushing Changes

If you’re happy with the demo, commit and push:
```
git add -A
git commit -m "Streamlined demo: basic one-page UI + static story build"
git push origin main
```

## Data Integration

### Current Status
- Uses the provided CSV (`data/yousician_songs.csv`) by default when `USE_REAL_YS_DATA=true`.
- You can switch to your own CSV via `/api/import/local-csv`.

## Development

- Uses Express.js for the REST API
- Mock data mode for immediate testing (no API keys required)
- Real API mode ready for Yousician integration
- CORS enabled for cross-origin requests
- Environment variables for configuration

## Contributing

This is a hackday project focused on contextual music recommendations beyond comfort zones. The proof of concept demonstrates the "mapping model" for how variable factors (mood, time, goals) can enhance existing recommendation algorithms.
