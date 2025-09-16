const express = require('express');
const cors = require('cors');
const YousicianClient = require('./src/yousician-client');
const MoodExplorer = require('./src/mood-explorer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const moodExplorer = new MoodExplorer();

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Song Mood Explorer API - Beyond Comfort Zone Recommendations',
    version: '2.0.0',
    description: 'Contextual song recommendations based on mood, time, goals, and variable factors',
    endpoints: {
      '/songs': 'GET - Get all songs with filters',
      '/songs/:id': 'GET - Get song by ID with full metadata',
      '/songs/:id/mood': 'GET - Get song mood analysis',
      '/mood/contextual-recommendations': 'POST - Get context-aware recommendations beyond comfort zone',
      '/mood/search': 'GET - Search songs by mood',
      '/mood/analyze-patterns': 'POST - Analyze user mood patterns from play history',
      '/mood/suggestions': 'GET - Get mood suggestions based on time and context',
      '/health': 'GET - Health check'
    },
    contextualFactors: [
      'Time of day/week/year',
      'Available practice time',
      'Goals (challenge vs relax)',
      'Current mood',
      'Inspiration sources',
      'Energy levels'
    ]
  });
});

// Get all songs
app.get('/songs', async (req, res) => {
  try {
    const client = new YousicianClient();
    const songs = await client.getSongs(req.query);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get song by ID
app.get('/songs/:id', async (req, res) => {
  try {
    const client = new YousicianClient();
    const song = await client.getSongById(req.params.id);
    res.json(song);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get song mood analysis
app.get('/songs/:id/mood', async (req, res) => {
  try {
    const client = new YousicianClient();
    const mood = await client.getSongMood(req.params.id);
    res.json(mood);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contextual recommendations beyond comfort zone
app.post('/mood/contextual-recommendations', async (req, res) => {
  try {
    const { userProfile, context } = req.body;
    if (!userProfile || !context) {
      return res.status(400).json({ 
        error: 'userProfile and context are required',
        example: {
          userProfile: { skillLevel: 3, genrePreferences: ['rock', 'pop'], instrument: 'guitar' },
          context: { mood: 'happy', timeOfDay: 'afternoon', availableTime: 20, goals: 'challenge' }
        }
      });
    }
    
    const recommendations = await moodExplorer.getContextualRecommendations(userProfile, context);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search songs by mood (simplified)
app.get('/mood/search', async (req, res) => {
  try {
    const { mood, limit } = req.query;
    if (!mood) {
      return res.status(400).json({ error: 'Mood parameter is required' });
    }
    
    const client = new YousicianClient();
    const searchParams = {
      style_tags: moodExplorer.getStyleTagsForMood(mood),
      limit: parseInt(limit) || 10
    };
    
    const songs = await client.searchSongs(searchParams);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze user's mood patterns from play history
app.post('/mood/analyze-patterns', async (req, res) => {
  try {
    const { playHistory } = req.body;
    if (!playHistory || !Array.isArray(playHistory)) {
      return res.status(400).json({ 
        error: 'playHistory array is required',
        example: [{ song: { style_tags: ['upbeat', 'rock'] }, timestamp: '2024-01-01T10:00:00Z' }]
      });
    }
    
    const analysis = await moodExplorer.analyzeMoodPatterns(playHistory);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mood suggestions based on time and context
app.get('/mood/suggestions', async (req, res) => {
  try {
    const { timeOfDay, availableTime, goals } = req.query;
    
    const context = {
      timeOfDay: timeOfDay || moodExplorer.getTimeSlot(new Date().getHours()),
      availableTime: parseInt(availableTime) || 15,
      goals: goals || 'relax'
    };
    
    const suggestions = {
      recommendedMoods: moodExplorer.getStyleTagsForMood(context.goals),
      energyLevel: moodExplorer.getEnergyLevelForTime(context.timeOfDay),
      maxDuration: moodExplorer.getDurationForAvailableTime(context.availableTime),
      context
    };
    
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Song Mood Explorer API running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;
