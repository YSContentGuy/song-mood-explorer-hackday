const { mockSongs, mockUserProfiles, mockContextScenarios } = require('./mock-data');
const BehavioralAnalyzer = require('./behavioral-analyzer');
const LLMMoodEnhancer = require('./llm-mood-enhancer');
const MultiSourceMoodMapper = require('./multi-source-mood-mapper');

class DatasetLoader {
  constructor() {
    this.songs = [];
    this.isLoaded = false;
    this.behavioralAnalyzer = new BehavioralAnalyzer();
    this.llmMoodEnhancer = new LLMMoodEnhancer();
    this.moodMapper = new MultiSourceMoodMapper();
    this.useRealData = process.env.USE_REAL_YS_DATA === 'true';
    this.enhancedSongs = [];
    this.unifiedMoodProfiles = [];
  }

  /**
   * Load song dataset - will use Pavel's real data when available
   * For now uses mock data for proof of concept
   */
  async loadSongDataset() {
    try {
      if (this.useRealData) {
        // Load Pavel's real YS dataset
        console.log('Loading real YS dataset with behavioral analysis...');
        this.songs = await this.behavioralAnalyzer.loadYSDataset();
        
        // Run behavioral analysis
        const analysis = this.behavioralAnalyzer.analyzeBehavioralPatterns();
        console.log('Behavioral Analysis Results:', analysis);
        
        this.isLoaded = true;
        return this.songs;
      } else {
        // Use mock data for development
        this.songs = mockSongs;
        this.isLoaded = true;
        return this.songs;
      }
    } catch (error) {
      console.error('Error loading song dataset:', error);
      // Fallback to mock data
      this.songs = mockSongs;
      this.isLoaded = true;
      return this.songs;
    }
  }

  /**
   * Get songs filtered by criteria
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered songs
   */
  getSongs(filters = {}) {
    if (!this.isLoaded) {
      throw new Error('Dataset not loaded. Call loadSongDataset() first.');
    }

    let filteredSongs = [...this.songs];

    // Genre filtering
    if (filters.genre_tags) {
      const genreFilter = Array.isArray(filters.genre_tags) ? filters.genre_tags : [filters.genre_tags];
      filteredSongs = filteredSongs.filter(song => 
        song.genre_tags.some(tag => genreFilter.includes(tag))
      );
    }

    // Style tags filtering
    if (filters.style_tags) {
      const styleFilter = Array.isArray(filters.style_tags) ? filters.style_tags : [filters.style_tags];
      filteredSongs = filteredSongs.filter(song => 
        song.style_tags.some(tag => styleFilter.includes(tag))
      );
    }

    // Difficulty filtering
    if (filters.min_difficulty) {
      filteredSongs = filteredSongs.filter(song => song.difficulty_level >= filters.min_difficulty);
    }
    if (filters.max_difficulty) {
      filteredSongs = filteredSongs.filter(song => song.difficulty_level <= filters.max_difficulty);
    }

    // Duration filtering
    if (filters.max_duration) {
      filteredSongs = filteredSongs.filter(song => song.duration <= filters.max_duration);
    }

    // Energy level filtering
    if (filters.energy_level) {
      filteredSongs = filteredSongs.filter(song => song.energy_level === filters.energy_level);
    }

    // Density filtering
    if (filters.density) {
      filteredSongs = filteredSongs.filter(song => song.density === filters.density);
    }

    // Instrument filtering
    if (filters.instrument_fit) {
      filteredSongs = filteredSongs.filter(song => song.instrument_fit === filters.instrument_fit);
    }

    // Limit results
    if (filters.limit) {
      filteredSongs = filteredSongs.slice(0, parseInt(filters.limit));
    }

    return filteredSongs;
  }

  /**
   * Get song by ID
   * @param {string} songId - Song ID
   * @returns {Object|null} Song object or null if not found
   */
  getSongById(songId) {
    if (!this.isLoaded) {
      throw new Error('Dataset not loaded. Call loadSongDataset() first.');
    }

    return this.songs.find(song => song.id === songId) || null;
  }

  /**
   * Get mock user profiles for testing
   * @returns {Array} User profiles
   */
  getMockUserProfiles() {
    return mockUserProfiles;
  }

  /**
   * Get mock context scenarios for testing
   * @returns {Array} Context scenarios
   */
  getMockContextScenarios() {
    return mockContextScenarios;
  }

  /**
   * Get behavioral analysis for all songs
   */
  getBehavioralAnalysis() {
    if (!this.useRealData) {
      return { message: 'Behavioral analysis only available with real YS data' };
    }
    return this.behavioralAnalyzer.analyzeBehavioralPatterns();
  }

  /**
   * Get songs by behavioral type (comfort_zone, challenge_abandoned, etc.)
   */
  getSongsByBehavioralType(type, limit = 10) {
    if (!this.useRealData) {
      return [];
    }
    return this.behavioralAnalyzer.getSongsByBehavioralType(type, limit);
  }

  /**
   * Get behavioral insights for a specific song
   */
  getSongBehavioralInsights(songId) {
    if (!this.useRealData) {
      return null;
    }
    return this.behavioralAnalyzer.getSongBehavioralInsights(songId);
  }

  /**
   * Get mood inference based on behavioral patterns
   */
  inferMoodFromBehavior(song) {
    if (!this.useRealData) {
      return { mood: 'unknown', confidence: 0, reasoning: 'Mock data mode' };
    }
    return this.behavioralAnalyzer.inferMoodFromBehavior(song);
  }

  /**
   * Enhance songs with LLM-generated mood tags
   */
  async enhanceSongsWithLLM(options = {}) {
    const { maxSongs = 50, onlySparseTags = true } = options;
    
    if (!this.isLoaded) {
      await this.loadSongDataset();
    }

    console.log('Starting LLM mood enhancement...');
    this.enhancedSongs = await this.llmMoodEnhancer.enhanceSongsWithLLM(
      this.songs, 
      { 
        maxSongs, 
        onlySparseTags,
        progressCallback: (current, total) => {
          console.log(`LLM Enhancement Progress: ${current}/${total}`);
        }
      }
    );

    return this.enhancedSongs;
  }

  /**
   * Get songs with LLM enhancements
   */
  getEnhancedSongs(limit = 10) {
    return this.enhancedSongs.slice(0, limit);
  }

  /**
   * Get LLM enhancement statistics
   */
  getLLMStats() {
    return {
      enhancementStats: this.llmMoodEnhancer.getStats(),
      enhancedSongsCount: this.enhancedSongs.length,
      totalSongsCount: this.songs.length
    };
  }

  /**
   * Create unified mood profiles combining all sources
   */
  async createUnifiedMoodProfiles(options = {}) {
    const { maxSongs = 20, useEnhancedSongs = true } = options;
    
    // Ensure we have enhanced songs first
    if (useEnhancedSongs && this.enhancedSongs.length === 0) {
      await this.enhanceSongsWithLLM({ maxSongs });
    }
    
    const songsToProcess = useEnhancedSongs ? this.enhancedSongs : this.songs.slice(0, maxSongs);
    
    // Ensure behavioral signals are attached to songs
    const songsWithBehavioral = songsToProcess.map(song => {
      if (!song.behavioralSignals && this.useRealData) {
        const insights = this.behavioralAnalyzer.getSongBehavioralInsights(song.SONG_ID);
        if (insights) {
          song.behavioralSignals = insights.behavioralSignals;
        }
      }
      return song;
    });
    
    console.log(`Creating unified mood profiles for ${songsWithBehavioral.length} songs...`);
    this.unifiedMoodProfiles = this.moodMapper.createUnifiedMoodProfiles(songsWithBehavioral);
    
    return this.unifiedMoodProfiles;
  }

  /**
   * Get unified mood profiles
   */
  getUnifiedMoodProfiles(limit = 10) {
    return this.unifiedMoodProfiles.slice(0, limit);
  }

  /**
   * Get mood distribution statistics
   */
  getMoodDistribution() {
    if (this.unifiedMoodProfiles.length === 0) {
      return { message: 'No unified mood profiles available. Run createUnifiedMoodProfiles first.' };
    }
    
    return this.moodMapper.getMoodDistribution(this.unifiedMoodProfiles);
  }

  /**
   * Get songs by unified mood category
   */
  getSongsByUnifiedMood(moodCategory, limit = 10) {
    const matchingSongs = this.unifiedMoodProfiles.filter(profile => 
      profile.unifiedMoodProfile.primaryMood.mood === moodCategory
    );
    
    return matchingSongs.slice(0, limit);
  }

  /**
   * Prepare for Pavel's dataset integration
   * This method will be implemented when the real dataset is available
   */
  async loadFromPavel() {
    // TODO: Implement when Pavel's dataset is available
    // This would handle:
    // - Loading ~100k songs with basic metadata
    // - Parsing the data structure
    // - Optimizing for fast processing
    throw new Error('Pavel dataset integration not yet implemented');
  }

  /**
   * Get dataset statistics
   * @returns {Object} Dataset statistics
   */
  getDatasetStats() {
    if (!this.isLoaded) {
      return { error: 'Dataset not loaded' };
    }

    const genres = new Set();
    const styleTags = new Set();
    const difficulties = [];
    const energyLevels = new Set();

    this.songs.forEach(song => {
      song.genre_tags.forEach(genre => genres.add(genre));
      song.style_tags.forEach(style => styleTags.add(style));
      difficulties.push(song.difficulty_level);
      energyLevels.add(song.energy_level);
    });

    return {
      totalSongs: this.songs.length,
      uniqueGenres: Array.from(genres),
      uniqueStyleTags: Array.from(styleTags),
      difficultyRange: {
        min: Math.min(...difficulties),
        max: Math.max(...difficulties),
        average: difficulties.reduce((a, b) => a + b, 0) / difficulties.length
      },
      energyLevels: Array.from(energyLevels)
    };
  }
}

module.exports = DatasetLoader;
