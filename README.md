# Song Mood Explorer - AI-Enhanced Music Recommendation System

An intelligent music recommendation engine that understands the emotional and contextual needs of musicians. This system goes beyond traditional "comfort zone" algorithms by analyzing user behavior patterns, inferring moods from playing data, and providing personalized song suggestions based on time of day, practice goals, and emotional state.

**Why it's useful:** Instead of just recommending songs at your skill level, this system understands *why* you want to play music right now - whether you need energy, relaxation, challenge, or comfort - and finds songs that match both your technical ability and emotional needs.

## 🎯 The Problem This Solves

Traditional music learning apps recommend songs based only on technical difficulty. But musicians have different needs:
- **Sometimes you want comfort** - familiar songs that feel safe and enjoyable
- **Sometimes you want challenge** - songs that push your boundaries and help you grow  
- **Sometimes you want energy** - upbeat songs to get you motivated
- **Sometimes you want calm** - peaceful songs for relaxation

This system analyzes your playing patterns to understand these needs and recommends songs that match both your skill level AND your emotional state.

## 🚀 Features

### 🤖 AI-Powered Mood Analysis
- **Real OpenAI GPT-4o-mini integration** for intelligent mood tagging
- **Enhanced musical context** including key signatures, pitch ranges, and popularity data
- **Key signature mood mapping** (major keys = uplifting, minor keys = emotional)
- **Confidence scoring** and detailed reasoning for each mood analysis

### 📊 Advanced Data Utilization (95% of Yousician Dataset)
- **8,930 songs** with comprehensive behavioral analysis
- **Popularity-weighted recommendations** using play count data
- **Enhanced song metadata** including popularity scores, key signatures, and pitch ranges
- **Behavioral pattern analysis** (comfort zone vs challenge classification)

### 🎵 Intelligent Recommendations
- **Contextual recommendations** beyond comfort zone based on variable factors
- **7-factor scoring system** including mood alignment, popularity, and exploration
- **Time-aware recommendations** (morning energy vs evening calm)
- **Goal-based filtering** (challenge vs relax modes)
- **Duration-aware suggestions** based on available practice time
- **Real-time mood inference** from user behavior patterns

### 🔍 Advanced Search & Analysis
- **Multi-source mood mapping** combining YS tags, behavioral signals, and LLM enhancement
- **Unified mood profiles** with confidence scoring
- **Behavioral insights** for individual songs
- **Pattern analysis** from playing history

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
   - Create `.env` file with your configuration:
   ```bash
   # OpenAI API Key for AI mood analysis (recommended)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   
   # LLM Configuration
   LLM_PROVIDER=openai
   LLM_MODEL=gpt-4o-mini
   
   # Yousician API (optional)
   USE_REAL_API=false
   YOUSICIAN_API_KEY=your_yousician_api_key_here
   YOUSICIAN_BASE_URL=https://api.yousician.com
   
   # Server Configuration
   USE_REAL_YS_DATA=true
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

Experience the system's intelligent recommendations in action.

1) Install + run
```bash
npm install
npm run dev
```

2) Open the interactive demo
```bash
http://localhost:3000/basic-demo.html
```

**What you'll see:** The demo showcases three different musician profiles with varying skill levels and learning styles. Click on each user to see how the system:
- **Infers their mood** from their playing patterns and preferences
- **Recommends songs** that match both their technical ability and emotional needs
- **Explains the reasoning** behind each recommendation with detailed scoring
- **Adapts to different learning styles** (comfort zone vs challenge seekers)

**Key insight:** Notice how the same song gets different scores for different users based on their individual needs and contexts.

API docs: `http://localhost:3000/api`  •  Health: `http://localhost:3000/health`

## Project Structure

```
├── src/
│   ├── yousician-client.js        # API client (mock + real data modes)
│   ├── mood-explorer.js           # Enhanced contextual mood analysis and recommendations
│   ├── dataset-loader.js          # Advanced dataset management with 95% data utilization
│   ├── llm-mood-enhancer.js       # OpenAI GPT-4o-mini integration for mood analysis
│   ├── behavioral-analyzer.js     # Behavioral pattern analysis and classification
│   ├── multi-source-mood-mapper.js # Unified mood mapping from multiple sources
│   └── mock-data.js              # Sample songs and user profiles for PoC
├── data/
│   └── yousician_songs.csv       # 8,930 songs with behavioral data
├── public/
│   └── basic-demo.html           # Interactive demo interface
├── index.js                      # Express server with comprehensive API endpoints
├── package.json                  # Dependencies and scripts
└── README.md                     # This file
```

## 🚀 Enhanced API Examples

### 🤖 AI-Powered Mood Analysis
```bash
# Enhance songs with real AI mood analysis
curl -X POST http://localhost:3000/api/llm/enhance \
  -H 'Content-Type: application/json' \
  -d '{"maxSongs": 10, "onlySparseTags": true}' | jq

# View AI-enhanced songs with mood analysis
curl http://localhost:3000/api/llm/enhanced-songs?limit=5 | jq

# Get LLM enhancement statistics
curl http://localhost:3000/api/llm/stats | jq
```

### 📊 Advanced Data Analysis
```bash
# Get comprehensive dataset statistics
curl http://localhost:3000/api/demo/dataset-stats | jq

# Behavioral analysis of song engagement patterns
curl http://localhost:3000/api/behavioral/analysis | jq

# Get songs by behavioral type (comfort zone vs challenge)
curl http://localhost:3000/api/behavioral/songs/persistent_challenge?limit=5 | jq
```

### 🎵 Enhanced Recommendations
```bash
# Users overview with enhanced scoring (includes popularity)
curl http://localhost:3000/api/demo/users-overview | jq

# Single-user suggestion with 7-factor scoring
curl "http://localhost:3000/api/demo/user-suggestion?userId=user_intermediate&mood=happy&timeOfDay=afternoon&availableTime=20&goals=challenge" | jq

# Unified mood profiles combining all data sources
curl -X POST http://localhost:3000/api/mood/unified-profiles \
  -H 'Content-Type: application/json' \
  -d '{"maxSongs": 15, "useEnhancedSongs": true}' | jq
```

### 🔍 Mood Distribution & Search
```bash
# Get mood distribution across all songs
curl http://localhost:3000/api/mood/distribution | jq

# Search songs by mood category
curl http://localhost:3000/api/mood/songs/energetic?limit=5 | jq

# Get behavioral insights for a specific song
curl http://localhost:3000/api/behavioral/insights/621f8de250cb7457161faec1 | jq
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

## 🤖 AI Integration (Production Ready)

The system now features **real OpenAI GPT-4o-mini integration** for advanced mood analysis:

### Enhanced AI Features:
- **Musical Context Analysis**: AI considers key signatures, pitch ranges, BPM, and popularity data
- **Key Signature Mood Mapping**: Major keys tagged as "uplifting", minor keys as "emotional"
- **Confidence Scoring**: Each mood analysis includes confidence levels and detailed reasoning
- **Fallback System**: Graceful degradation to simulation if API is unavailable

### Automatic Enhancement:
The system automatically enhances songs on startup and provides:
- **Real-time mood analysis** with musical theory context
- **Enhanced recommendation scoring** with 7 factors including popularity
- **Behavioral pattern integration** with AI-generated mood tags
- **95% data utilization** from the 8,930-song Yousician dataset

### Manual Enhancement:
```bash
# Enhance specific songs with AI
curl -X POST http://localhost:3000/api/llm/enhance \
  -H 'Content-Type: application/json' \
  -d '{"maxSongs": 20, "onlySparseTags": true}' | jq

# View enhanced results
curl http://localhost:3000/api/llm/enhanced-songs?limit=5 | jq
```

## Pushing Changes

If you’re happy with the demo, commit and push:
```
git add -A
git commit -m "Streamlined demo: basic one-page UI + static story build"
git push origin main
```

## 📊 Data Integration

### Current Status
- **8,930 songs** from Yousician CSV with comprehensive behavioral analysis
- **95% data utilization** including play counts, key signatures, pitch ranges, and popularity data
- **Behavioral classification**: 81% challenge behavior, 11% comfort zone, 8% unknown
- **Enhanced metadata**: popularity scores, key signatures, mood tags, and AI analysis

### Data Sources:
- **Primary**: `data/yousician_songs.csv` (8,930 songs with behavioral data)
- **AI Enhancement**: OpenAI GPT-4o-mini for mood analysis
- **Behavioral Analysis**: Play patterns, engagement levels, and user behavior classification

## 🛠️ Development

- **Express.js** REST API with comprehensive endpoints
- **Real AI Integration** with OpenAI GPT-4o-mini
- **Advanced Data Processing** with 95% Yousician dataset utilization
- **Behavioral Analysis** with pattern recognition and classification
- **CORS enabled** for cross-origin requests
- **Environment-based configuration** for different deployment scenarios

## 🎯 Project Goals

This production-ready system demonstrates advanced music recommendation capabilities:

- **Beyond Comfort Zone**: Intelligent recommendations that balance familiarity with exploration
- **AI-Enhanced Analysis**: Real LLM integration for sophisticated mood understanding
- **Comprehensive Data Utilization**: Maximum value extraction from available datasets
- **Contextual Intelligence**: Multi-factor scoring including time, mood, goals, and popularity
- **Scalable Architecture**: Ready for integration with larger datasets and production deployment

## 🚀 Performance

- **Real-time recommendations** with 7-factor scoring
- **Cached AI analysis** for optimal performance
- **Behavioral pattern analysis** of 8,930 songs
- **95% data utilization** from Yousician dataset
- **Production-ready** with comprehensive error handling and fallbacks
