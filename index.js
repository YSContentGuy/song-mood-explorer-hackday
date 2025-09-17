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

// Redirect root to the nicer basic demo (click a user → profile + song)
app.get('/', (req, res) => {
  res.redirect('/basic-demo.html');
});
app.use(requestLogger);

// Initialize services
const moodExplorer = new MoodExplorer();
const datasetLoader = new DatasetLoader();
// Share loader across all clients to keep data consistent
global.__YS_SHARED_DATASET_LOADER = datasetLoader;

// Autoload Pavel's dataset and run LLM enhancement on startup
(async () => {
  try {
    // Prefer Pavel's CSV if present; otherwise load default dataset
    await datasetLoader.loadFromLocalCsv('song metadata (2).csv').catch(async () => {
      await datasetLoader.loadSongDataset();
    });

    // Always run a lightweight enhancement pass so tags/energy are enriched
    await datasetLoader.enhanceSongsWithLLM({ maxSongs: 50, onlySparseTags: true });

    // If a real LLM key is present, upgrade a small batch with OpenAI in background
    if (process.env.OPENAI_API_KEY) {
      datasetLoader.enhanceSongsWithLLM({ maxSongs: 20, onlySparseTags: true })
        .then(() => console.log('LLM (OpenAI) enhancement completed for 20 songs'))
        .catch(() => {});
    }

    console.log('Dataset ready: Pavel CSV + LLM-enhanced tags merged.');
  } catch (e) {
    console.log('Startup dataset init fallback:', e.message);
  }
})();

// Routes
app.get('/api', (req, res) => {
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

// Overview for 3 pretend users with auto mood + suggestion derived from dataset
app.get('/api/demo/users-overview', async (req, res) => {
  try {
    const client = new YousicianClient();
    await client.ensureDatasetLoaded();

    const users = datasetLoader.getMockUserProfiles();

    // Pick mood based on user profile characteristics for diversity
    const pickMood = (summary, userProfile) => {
      // Create diverse moods based on user characteristics
      switch (userProfile.id) {
        case 'user_beginner':
          // Beginner users tend to prefer relaxed, comfortable moods
          return 'relaxed';
        case 'user_intermediate':
          // Intermediate users are often energetic and motivated
          return 'energetic';
        case 'user_advanced':
          // Advanced users often seek focused, challenging experiences
          return 'focused';
        default:
          // Fallback to energy-based selection
          switch (summary.dominantEnergy) {
            case 'very_high':
            case 'high': return 'energetic';
            case 'very_low':
            case 'low': return 'relaxed';
            default: {
              const tags = summary.topStyleTags.join(',').toLowerCase();
              if (tags.includes('peace') || tags.includes('calm') || tags.includes('dream')) return 'calm';
              if (tags.includes('happy') || tags.includes('upbeat') || tags.includes('positive')) return 'happy';
              if (tags.includes('melanch')) return 'sad';
              return 'neutral';
            }
          }
      }
    };

    const timeOfDay = new MoodExplorer().getTimeSlot(new Date().getHours());

    const results = [];
    for (const u of users) {
      const summary = client.datasetLoader.summarizeForGenres(u.genrePreferences);
      const mood = pickMood(summary, u);
      // Set goals based on mood for more diverse behavior
      const goals = mood === 'energetic' || mood === 'focused' ? 'challenge' : 'relax';
      const context = { mood, timeOfDay, availableTime: 20, goals, exploreNewMoods: true };
      const recs = await moodExplorer.getContextualRecommendations(u, context);
      const top = recs[0] || null;

      const blurb = `${u.name.split('(')[1]?.replace(')', '') || 'Player'} · Likes ${u.genrePreferences.join(', ')} · ` +
        (summary.count > 0 ? `${summary.count} matching songs (avg diff ${summary.avgDifficulty ?? 'n/a'}), energy: ${summary.dominantEnergy || 'n/a'}` : 'no direct matches');

      results.push({
        id: u.id,
        name: u.name,
        blurb,
        derivedMood: mood,
        context,
        suggestion: top,
        summary,
        // return full user profile to avoid any field mismatch
        user: u
      });
    }

    res.json({ users: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// Lightweight user summaries for clickable demo
app.get('/api/demo/users-simple', (req, res) => {
  try {
    const users = datasetLoader.getMockUserProfiles().map(u => ({
      id: u.id,
      name: u.name,
      habits: {
        experience: u.playingExperience,
        frequency: u.practiceFrequency,
        genres: u.genrePreferences.join(', '),
        preferredDifficulty: `${Math.min(...u.preferredDifficulty)}-${Math.max(...u.preferredDifficulty)}`
      }
    }));
    res.json({ users });
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

// Import local CSV (e.g., "song metadata (2).csv") and use it as active dataset
app.post('/api/import/local-csv', async (req, res) => {
  try {
    const { path: csvPath = 'song metadata (2).csv' } = req.body || {};
    await datasetLoader.loadFromLocalCsv(csvPath);
    // Share loader with all clients
    global.__YS_SHARED_DATASET_LOADER = datasetLoader;
    const stats = datasetLoader.getDatasetStats();
    res.json({
      message: `Loaded local CSV: ${csvPath}`,
      totalSongs: stats.totalSongs,
      stats
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
    
    // Ensure unified mood profiles are created
    if (client.datasetLoader.unifiedMoodProfiles.length === 0) {
      await client.datasetLoader.createUnifiedMoodProfiles({ maxSongs: 50 });
    }
    
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

// Simple user suggestion: provide a mood and get 1 top suggestion with reasoning
app.get('/api/demo/user-suggestion', async (req, res) => {
  try {
    const { userId, mood = 'neutral', timeOfDay, availableTime = 15, goals = 'relax', offset = 0 } = req.query;
    const users = datasetLoader.getMockUserProfiles();
    const user = users.find(u => u.id === userId) || users[0];

    const client = new YousicianClient();
    await client.ensureDatasetLoaded();

    const context = {
      mood,
      timeOfDay: timeOfDay || new MoodExplorer().getTimeSlot(new Date().getHours()),
      availableTime: parseInt(availableTime),
      goals,
      exploreNewMoods: true
    };

    const explorer = new MoodExplorer();
    const recs = await explorer.getContextualRecommendations(user, context);
    const idx = Math.max(0, Math.min(recs.length - 1, parseInt(offset) || 0));
    const top = recs[idx] || null;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        habits: {
          experience: user.playingExperience,
          frequency: user.practiceFrequency,
          preferredDifficulty: user.preferredDifficulty
        }
      },
      context,
      suggestion: top,
      offset: idx,
      total: recs.length
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
  console.log(`Open http://localhost:${PORT}/basic-demo.html for the demo`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

module.exports = app;
