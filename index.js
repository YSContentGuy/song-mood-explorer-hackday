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
    message: 'Song Mood Explorer API',
    version: '1.0.0',
    endpoints: {
      '/songs': 'GET - Get all songs',
      '/songs/:id': 'GET - Get song by ID',
      '/songs/:id/mood': 'GET - Get song mood analysis',
      '/mood/search': 'GET - Search songs by mood',
      '/mood/recommendations': 'GET - Get mood-based recommendations',
      '/mood/analyze': 'POST - Analyze mood patterns'
    }
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

// Search songs by mood
app.get('/mood/search', async (req, res) => {
  try {
    const { mood, limit } = req.query;
    if (!mood) {
      return res.status(400).json({ error: 'Mood parameter is required' });
    }
    
    const songs = await moodExplorer.findSongsByMood(mood, parseInt(limit) || 10);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mood-based recommendations
app.get('/mood/recommendations', async (req, res) => {
  try {
    const { currentMood } = req.query;
    if (!currentMood) {
      return res.status(400).json({ error: 'currentMood parameter is required' });
    }
    
    const recommendations = await moodExplorer.getMoodRecommendations(currentMood);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analyze mood patterns
app.post('/mood/analyze', async (req, res) => {
  try {
    const { songIds } = req.body;
    if (!songIds || !Array.isArray(songIds)) {
      return res.status(400).json({ error: 'songIds array is required' });
    }
    
    const analysis = await moodExplorer.analyzeMoodPatterns(songIds);
    res.json(analysis);
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
