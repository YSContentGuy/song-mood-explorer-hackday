const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const YousicianClient = require('./src/yousician-client');
const MoodExplorer = require('./src/mood-explorer');
const DatasetLoader = require('./src/dataset-loader');
const { Validator, ValidationError, errorHandler, requestLogger } = require('./src/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(requestLogger);

// Initialize services
const moodExplorer = new MoodExplorer();
const datasetLoader = new DatasetLoader();

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
app.get('/api/songs', async (req, res) => {
  try {
    const client = new YousicianClient();
    const songs = await client.getSongs(req.query);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get song by ID
app.get('/api/songs/:id', async (req, res) => {
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

// Get recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const client = new YousicianClient();
    const songs = await client.getSongs(req.query);
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search songs by mood (simplified)
app.get('/api/mood/search', async (req, res) => {
  try {
    const { mood, limit } = req.query;
    if (!mood) {
      return res.status(400).json({ error: 'Mood parameter is required' });
    }
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const allSongs = client.datasetLoader.getSongs();
    const moodSongs = allSongs.filter(song => 
      song.style_tags && song.style_tags.some(tag => 
        tag.toLowerCase().includes(mood.toLowerCase())
      )
    );
    
    const limitedSongs = moodSongs.slice(0, parseInt(limit) || 10);
    
    res.json({
      mood,
      count: limitedSongs.length,
      songs: limitedSongs
    });
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

// Analyze mood patterns
app.get('/api/mood/patterns', async (req, res) => {
  try {
    const { timeOfDay, availableTime, goals } = req.query;
    
    const context = {
      timeOfDay: timeOfDay || moodExplorer.getTimeSlot(new Date().getHours()),
      availableTime: parseInt(availableTime) || 15,
      goals: goals || 'relax'
    };
    
    const analysis = await moodExplorer.analyzeMoodPatterns(context);
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

// Mood-based contextual recommendations
app.post('/api/mood/contextual-recommendations', async (req, res) => {
  try {
    const { userId, contextId } = req.body;
    
    const users = datasetLoader.getMockUserProfiles();
    const contexts = datasetLoader.getMockContextScenarios();
    
    const user = users.find(u => u.id === userId) || users[0];
    const context = contexts.find(c => c.id === contextId) || contexts[0];
    
    const recommendations = await moodExplorer.getContextualRecommendations(user, context);
    
    res.json({
      message: 'Full contextual recommendation demo',
      selectedUser: user,
      selectedContext: context,
      recommendations,
      explanation: {
        comfortZone: 'Songs matching user\'s genre preferences and skill level',
        contextual: 'Songs adjusted for mood, time, and goals',
        scoring: 'Combined scoring based on mood alignment and context fit'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo endpoints for proof of concept
app.get('/api/demo/users', (req, res) => {
  try {
    const users = datasetLoader.getMockUserProfiles();
    res.json({
      message: 'Artificial user profiles for proof of concept',
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/demo/contexts', (req, res) => {
  try {
    const contexts = datasetLoader.getMockContextScenarios();
    res.json({
      message: 'Context scenarios for testing mood recommendations',
      contexts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/demo/dataset-stats', (req, res) => {
  try {
    const client = new YousicianClient();
    client.ensureDatasetLoaded().then(() => {
      const stats = client.datasetLoader.getDatasetStats();
      const behavioralAnalysis = client.datasetLoader.getBehavioralAnalysis();
      
      res.json({
        message: process.env.USE_REAL_YS_DATA === 'true' ? 
          'Real YS dataset with behavioral analysis' : 
          'Mock dataset statistics (will be replaced with Pavel\'s songs)',
        stats,
        behavioralAnalysis
      });
    }).catch(error => {
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// New behavioral analysis endpoints
app.get('/api/behavioral/analysis', async (req, res) => {
  try {
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const analysis = client.datasetLoader.getBehavioralAnalysis();
    res.json({
      message: 'Behavioral pattern analysis of song engagement',
      analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/behavioral/songs/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const songs = client.datasetLoader.getSongsByBehavioralType(type, parseInt(limit));
    res.json({
      message: `Songs with ${type} behavioral pattern`,
      type,
      count: songs.length,
      songs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/behavioral/insights/:songId', async (req, res) => {
  try {
    const { songId } = req.params;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const insights = client.datasetLoader.getSongBehavioralInsights(songId);
    if (!insights) {
      return res.status(404).json({ error: 'Song not found or no behavioral data available' });
    }
    
    res.json({
      message: 'Behavioral insights and mood inference for song',
      insights
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LLM mood enhancement endpoints
app.post('/api/llm/enhance', async (req, res) => {
  try {
    const { maxSongs = 20, onlySparseTags = true } = req.body;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const enhancedSongs = await client.datasetLoader.enhanceSongsWithLLM({
      maxSongs,
      onlySparseTags
    });
    
    res.json({
      message: 'Songs enhanced with LLM-generated mood tags',
      enhancedCount: enhancedSongs.length,
      stats: client.datasetLoader.getLLMStats(),
      sample: enhancedSongs.slice(0, 3) // Show first 3 as sample
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/llm/enhanced-songs', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const enhancedSongs = client.datasetLoader.getEnhancedSongs(parseInt(limit));
    
    res.json({
      message: 'Songs with LLM mood enhancements',
      count: enhancedSongs.length,
      songs: enhancedSongs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/llm/stats', async (req, res) => {
  try {
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const stats = client.datasetLoader.getLLMStats();
    
    res.json({
      message: 'LLM mood enhancement statistics',
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Multi-source mood mapping endpoints
app.post('/api/mood/unified-profiles', async (req, res) => {
  try {
    const { maxSongs = 15, useEnhancedSongs = true } = req.body;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const profiles = await client.datasetLoader.createUnifiedMoodProfiles({
      maxSongs,
      useEnhancedSongs
    });
    
    res.json({
      message: 'Unified mood profiles combining YS tags, behavioral signals, and LLM enhancement',
      profilesCount: profiles.length,
      moodDistribution: client.datasetLoader.getMoodDistribution(),
      sample: profiles.slice(0, 3)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mood/profiles', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const profiles = client.datasetLoader.getUnifiedMoodProfiles(parseInt(limit));
    
    res.json({
      message: 'Unified mood profiles',
      count: profiles.length,
      profiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mood/distribution', async (req, res) => {
  try {
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const distribution = client.datasetLoader.getMoodDistribution();
    
    res.json({
      message: 'Mood distribution across all processed songs',
      distribution
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/mood/songs/:moodCategory', async (req, res) => {
  try {
    const { moodCategory } = req.params;
    const { limit = 10 } = req.query;
    
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const songs = client.datasetLoader.getSongsByUnifiedMood(moodCategory, parseInt(limit));
    
    res.json({
      message: `Songs classified as ${moodCategory} mood`,
      moodCategory,
      count: songs.length,
      songs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/demo/songs', (req, res) => {
  try {
    const client = new YousicianClient();
    client.ensureDatasetLoaded().then(() => {
      const songs = client.datasetLoader.getSongs();
      res.json({
        message: 'All songs in mock dataset (17 diverse songs)',
        count: songs.length,
        songs
      });
    }).catch(error => {
      res.status(500).json({ error: error.message });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/demo/contextual-flow', async (req, res) => {
  try {
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();
    
    const users = client.datasetLoader.getMockUserProfiles();
    const contexts = client.datasetLoader.getMockContextScenarios();
    
    // Demo with first user and first context
    const demoUser = users[0];
    const demoContext = contexts[0];
    
    const moodExplorer = new MoodExplorer();
    const recommendations = await moodExplorer.getContextualRecommendations(demoUser, demoContext);
    
    res.json({
      message: 'Full contextual recommendation demo',
      demo_user: demoUser,
      demo_context: demoContext,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo: Full contextual recommendation flow
app.post('/api/demo/full-recommendation', async (req, res) => {
  try {
    const { userId, contextId } = req.body;
    
    const users = datasetLoader.getMockUserProfiles();
    const contexts = datasetLoader.getMockContextScenarios();
    
    const user = users.find(u => u.id === userId) || users[0];
    const context = contexts.find(c => c.id === contextId) || contexts[0];
    
    const recommendations = await moodExplorer.getContextualRecommendations(user, context);
    
    res.json({
      message: 'Full contextual recommendation demo',
      selectedUser: user,
      selectedContext: context,
      recommendations,
      explanation: {
        comfortZone: 'Songs matching user\'s genre preferences and skill level',
        contextual: 'Songs adjusted for mood, time, and goals',
        scoring: 'Combined scoring based on mood alignment and context fit'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Song Mood Explorer API running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API documentation`);
});

module.exports = app;
