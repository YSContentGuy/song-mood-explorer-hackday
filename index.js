const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const YousicianClient = require('./src/yousician-client');
const MoodExplorer = require('./src/mood-explorer');
const DatasetLoader = require('./src/dataset-loader');
const LLMMoodEnhancer = require('./src/llm-mood-enhancer');
const { Validator, ValidationError, errorHandler, requestLogger } = require('./src/validation');

// Simple recommendation cache for instant responses - ALWAYS CLEAR ON STARTUP
const recommendationCache = new Map();
const CACHE_START_TIME = Date.now(); // Track when server started
recommendationCache.clear(); // Force clear on every startup

// Preload recommendations for all users - optimized for speed
async function preloadUserRecommendations() {
  console.log('🚀 Preloading recommendations for instant responses...');
  
  const userProfiles = [
    { id: 'user_beginner', mood: 'relaxed', timeOfDay: 'evening', availableTime: 20, goals: 'relax' },
    { id: 'user_intermediate', mood: 'energetic', timeOfDay: 'afternoon', availableTime: 20, goals: 'challenge' },
    { id: 'user_advanced', mood: 'focused', timeOfDay: 'morning', availableTime: 20, goals: 'challenge' }
  ];

  // Preload only the first recommendation for each user (most important)
  const preloadPromises = userProfiles.map(async (user) => {
    try {
      const cacheKey = `${user.id}_${user.mood}_${user.timeOfDay}_${user.availableTime}_${user.goals}_0`;
      
      if (!recommendationCache.has(cacheKey)) {
        const recommendation = await generateUserRecommendation(user.id, user.mood, user.timeOfDay, user.availableTime, user.goals, 0);
        recommendationCache.set(cacheKey, recommendation);
        console.log(`✅ Preloaded ${user.id}`);
      }
    } catch (error) {
      console.warn(`❌ Failed to preload ${user.id}:`, error.message);
    }
  });

  await Promise.allSettled(preloadPromises);
  console.log(`🎯 Preloading completed! ${recommendationCache.size} recommendations ready for instant responses.`);
}

// Extract recommendation generation logic
async function generateUserRecommendation(userId, mood, timeOfDay, availableTime, goals, offset) {
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

  const recs = await moodExplorer.getContextualRecommendations(user, context);
  const idx = Math.max(0, Math.min(recs.length - 1, parseInt(offset) || 0));
  const top = recs[idx] || null;

  // Generate AI explanation for the recommendation
  let aiExplanation = null;
  if (top) {
    try {
      const llmEnhancer = new LLMMoodEnhancer();
      aiExplanation = await llmEnhancer.generateRecommendationExplanation(top, user, context);
    } catch (error) {
      console.warn('Failed to generate AI explanation:', error.message);
      // Fallback explanation will be handled by the LLM enhancer
    }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      habits: {
        experience: user.playingExperience,
        frequency: user.practiceFrequency,
        preferredDifficulty: user.preferredDifficulty,
        popularityPreference: user.popularityPreference
      }
    },
    context,
    suggestion: top,
    aiExplanation: aiExplanation,
    offset: idx,
    total: recs.length
  };
}

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

    // Run lightweight enhancement in background for better performance
             const enhancementPromise = datasetLoader.enhanceSongsWithLLM({ maxSongs: 100, onlySparseTags: true })
               .then(() => console.log('LLM mood enhancement completed for 100 songs'))
               .catch(err => console.warn('LLM mood enhancement failed:', err.message));

    // Run popularity assessment in background for better commercial vs learning song differentiation
    const popularityPromise = datasetLoader.enhanceSongsWithPopularityAssessment({ maxSongs: 50 })
      .then(() => console.log('LLM popularity assessment completed for 50 songs'))
      .catch(err => console.warn('LLM popularity assessment failed:', err.message));

    // Start preloading immediately, don't wait for LLM enhancements
    console.log('Starting immediate preloading for instant demo responses...');
    preloadUserRecommendations();

    // Wait for both to complete, but don't block server startup
    Promise.allSettled([enhancementPromise, popularityPromise])
      .then(() => {
        console.log('All LLM enhancements completed');
      })
      .catch(() => console.log('Some LLM enhancements failed, but system is ready'));

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  const datasetLoader = global.__YS_SHARED_DATASET_LOADER;
  const isDatasetLoaded = datasetLoader && datasetLoader.isLoaded;
  const songCount = isDatasetLoaded ? datasetLoader.songs.length : 0;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dataset: {
      loaded: isDatasetLoaded,
      songCount: songCount
    },
    services: {
      llmEnhancement: process.env.OPENAI_API_KEY ? 'available' : 'simulation',
      behavioralAnalysis: isDatasetLoaded ? 'active' : 'inactive'
    },
    cache: {
      recommendationCount: recommendationCache.size,
      preloaded: recommendationCache.size > 0
    }
  });
});

// Cache refresh endpoint for development
app.post('/api/cache/refresh', (req, res) => {
  const oldSize = recommendationCache.size;
  recommendationCache.clear();
  
  // Trigger immediate preloading
  preloadUserRecommendations().then(() => {
    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      oldSize,
      newSize: recommendationCache.size,
      timestamp: new Date().toISOString()
    });
  }).catch(error => {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
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

    // Assign diverse times of day based on user characteristics
    const getTimeOfDay = (userProfile) => {
      switch (userProfile.id) {
        case 'user_beginner':
          // Beginners often practice in the evening when they have time
          return 'evening';
        case 'user_intermediate':
          // Intermediate users practice in the afternoon for energy
          return 'afternoon';
        case 'user_advanced':
          // Advanced users often practice in the morning for focus
          return 'morning';
        default:
          return new MoodExplorer().getTimeSlot(new Date().getHours());
      }
    };

    const results = [];
    for (const u of users) {
      // Use realistic behavioral data from user profile instead of computing from dataset
      const summary = {
        count: u.songsReturnedTo || 0,
        avgDifficulty: u.typicalDifficulty || null,
        dominantEnergy: u.dominantEnergy || null,
        topStyleTags: u.topStyleTags || [],
        source: 'realistic_behavior'
      };
      
      const mood = pickMood(summary, u);
      const timeOfDay = getTimeOfDay(u);
      // Set goals based on mood for more diverse behavior
      const goals = mood === 'energetic' || mood === 'focused' ? 'challenge' : 'relax';
      const context = { mood, timeOfDay, availableTime: 20, goals, exploreNewMoods: true };
      const recs = await moodExplorer.getContextualRecommendations(u, context);
      const top = recs[0] || null;

      const blurb = `${u.name.split('(')[1]?.replace(')', '') || 'Player'} · Likes ${u.genrePreferences.join(', ')} · ` +
        `Played ${u.totalSongsPlayed || 0} songs over ${u.subscriptionTime || 'unknown time'}`;

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
    
             // Always generate fresh recommendations to ensure data is current
             const cacheKey = `${userId}_${mood}_${timeOfDay}_${availableTime}_${goals}_${offset}`;
             
             // Check if we have a recent cache entry (within last 30 seconds)
             const cachedEntry = recommendationCache.get(cacheKey);
             const isRecentCache = cachedEntry && (Date.now() - CACHE_START_TIME) < 30000;
             
             if (isRecentCache) {
               console.log(`Cache hit for ${cacheKey} - instant response!`);
               return res.json(cachedEntry);
             }
             
             // Generate fresh recommendation
             console.log(`Generating fresh recommendation for ${cacheKey}...`);
             const recommendation = await generateUserRecommendation(userId, mood, timeOfDay, availableTime, goals, offset);
             
             // Cache the result for future requests
             recommendationCache.set(cacheKey, recommendation);
    
    res.json(recommendation);
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
app.listen(PORT, async () => {
  console.log(`Song Mood Explorer API running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT}/basic-demo.html for the demo`);
  console.log(`API docs: http://localhost:${PORT}/api`);
  
  // Fast initialization - load dataset and preload recommendations
  try {
    console.log('🚀 Dataset already loaded during startup');
    console.log(`✅ Dataset ready: ${datasetLoader.getSongCount()} songs`);
    
    console.log('🚀 Preloading recommendations...');
    await preloadUserRecommendations();
    console.log('🎉 Ready for instant responses!');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  }
});

module.exports = app;
