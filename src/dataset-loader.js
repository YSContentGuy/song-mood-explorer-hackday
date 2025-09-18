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

        // Normalize CSV-based songs to the internal shape used by filters
        this.songs = this.songs.map(s => this.normalizeYSSong(s));
        
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
   * Load songs from a local CSV path (e.g., user's custom metadata)
   * Replaces current in-memory dataset with normalized songs
   */
  async loadFromLocalCsv(csvPath = 'song metadata (2).csv') {
    try {
      console.log(`Loading local CSV dataset from ${csvPath}...`);
      const rawSongs = await this.behavioralAnalyzer.loadYSDataset(csvPath);
      const analysis = this.behavioralAnalyzer.analyzeBehavioralPatterns();
      console.log('Behavioral Analysis (local CSV):', analysis.totalSongs);
      
      // Normalize
      this.songs = rawSongs.map(s => this.normalizeYSSong(s));
      this.isLoaded = true;
      // Treat as real-like data for downstream endpoints
      this.useRealData = true;
      return this.songs;
    } catch (error) {
      console.error('Failed to load local CSV:', error);
      throw error;
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

    // Remap common query param aliases from UI to internal filter names
    const normalizedFilters = { ...filters };
    if (normalizedFilters.genre && !normalizedFilters.genre_tags) {
      normalizedFilters.genre_tags = normalizedFilters.genre;
    }
    if (normalizedFilters.difficulty_min && !normalizedFilters.min_difficulty) {
      normalizedFilters.min_difficulty = parseInt(normalizedFilters.difficulty_min);
    }
    if (normalizedFilters.difficulty_max && !normalizedFilters.max_difficulty) {
      normalizedFilters.max_difficulty = parseInt(normalizedFilters.difficulty_max);
    }
    if (normalizedFilters.duration_max && !normalizedFilters.max_duration) {
      normalizedFilters.max_duration = parseInt(normalizedFilters.duration_max);
    }
    if (normalizedFilters.instrument && !normalizedFilters.instrument_fit) {
      normalizedFilters.instrument_fit = normalizedFilters.instrument;
    }

    let filteredSongs = [...this.songs];

    // Genre filtering
    if (normalizedFilters.genre_tags) {
      const genreFilter = Array.isArray(normalizedFilters.genre_tags) ? normalizedFilters.genre_tags : [normalizedFilters.genre_tags];
      filteredSongs = filteredSongs.filter(song => {
        const tags = (song.genre_tags || []);
        const hasTag = tags.some(tag => genreFilter.includes(tag));
        if (hasTag) return true;
        // Fallback: text search in raw fields when parsed tags are unavailable
        const hay = `${song.GENRES || ''} ${song.TAGS || ''} ${song.ARTIST_NAME || ''}`.toLowerCase();
        return genreFilter.some(g => hay.includes(String(g).toLowerCase()));
      });
    }

    // Style tags filtering
    if (normalizedFilters.style_tags) {
      const styleFilter = Array.isArray(normalizedFilters.style_tags) ? normalizedFilters.style_tags : [normalizedFilters.style_tags];
      filteredSongs = filteredSongs.filter(song => {
        const tags = (song.style_tags || []);
        const hasTag = tags.some(tag => styleFilter.includes(tag));
        if (hasTag) return true;
        const hay = `${song.TAGS || ''}`.toLowerCase();
        return styleFilter.some(t => hay.includes(String(t).toLowerCase()));
      });
    }

    // Difficulty filtering
    if (normalizedFilters.min_difficulty) {
      filteredSongs = filteredSongs.filter(song => (song.difficulty_level || 0) >= normalizedFilters.min_difficulty);
    }
    if (normalizedFilters.max_difficulty) {
      filteredSongs = filteredSongs.filter(song => (song.difficulty_level || 0) <= normalizedFilters.max_difficulty);
    }

    // Duration filtering
    if (normalizedFilters.max_duration) {
      filteredSongs = filteredSongs.filter(song => (song.duration || 0) <= normalizedFilters.max_duration);
    }

    // Energy level filtering
    if (normalizedFilters.energy_level) {
      filteredSongs = filteredSongs.filter(song => song.energy_level === normalizedFilters.energy_level);
    }

    // Density filtering
    if (normalizedFilters.density) {
      filteredSongs = filteredSongs.filter(song => song.density === normalizedFilters.density);
    }

    // Instrument filtering
    if (normalizedFilters.instrument_fit) {
      filteredSongs = filteredSongs.filter(song => song.instrument_fit === normalizedFilters.instrument_fit);
    }

    // Limit results
    if (normalizedFilters.limit) {
      filteredSongs = filteredSongs.slice(0, parseInt(normalizedFilters.limit));
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

    // Merge enhancements back into the base dataset so downstream scoring uses them
    const byId = new Map();
    this.songs.forEach((s, idx) => {
      const key = s.SONG_ID || s.id;
      if (key) byId.set(key, idx);
    });
    this.enhancedSongs.forEach(es => {
      const key = es.SONG_ID || es.id;
      if (!key) return;
      const idx = byId.get(key);
      if (idx === undefined) return;
      const base = this.songs[idx];
      // Merge tags and energy
      const enhancedTags = Array.isArray(es.enhancedTags) ? es.enhancedTags : [];
      const baseTags = Array.isArray(base.style_tags) ? base.style_tags : [];
      const merged = Array.from(new Set([...baseTags, ...enhancedTags]));
      base.style_tags = merged;
      if (es.enhancedEnergyLevel) {
        base.energy_level = es.enhancedEnergyLevel;
      }
      base.llmEnhancement = es.llmEnhancement || base.llmEnhancement;
      this.songs[idx] = base;
    });

    return this.enhancedSongs;
  }

  /**
   * Enhance songs with LLM-generated popularity assessments
   */
  async enhanceSongsWithPopularityAssessment(options = {}) {
    const { maxSongs = 30 } = options;
    
    if (!this.isLoaded) {
      await this.loadSongDataset();
    }

    console.log('Starting LLM popularity assessment...');
    
    // Get a sample of songs for popularity assessment
    const songsToAssess = this.songs.slice(0, maxSongs);
    const popularityAssessments = [];
    
    for (let i = 0; i < songsToAssess.length; i++) {
      const song = songsToAssess[i];
      try {
        const assessment = await this.llmMoodEnhancer.generatePopularityAssessment(song);
        popularityAssessments.push({
          ...song,
          llmPopularityAssessment: assessment
        });
        
        if ((i + 1) % 5 === 0) {
          console.log(`Popularity Assessment Progress: ${i + 1}/${songsToAssess.length}`);
        }
        
        // Rate limiting: small delay between requests
        if (i < songsToAssess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // Silently fail for individual songs to avoid spam
        popularityAssessments.push(song);
      }
    }

    // Merge popularity assessments back into the base dataset
    const byId = new Map();
    this.songs.forEach((s, idx) => {
      const key = s.SONG_ID || s.id;
      if (key) byId.set(key, idx);
    });
    
    popularityAssessments.forEach(pa => {
      const key = pa.SONG_ID || pa.id;
      if (!key || !pa.llmPopularityAssessment) return;
      const idx = byId.get(key);
      if (idx === undefined) return;
      this.songs[idx].llmPopularityAssessment = pa.llmPopularityAssessment;
    });

    console.log(`Successfully assessed popularity for ${popularityAssessments.length} songs`);
    return popularityAssessments;
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
   * Summarize dataset for a set of genres: counts, avg difficulty,
   * dominant energy, and top style tags.
   */
  summarizeForGenres(genres = []) {
    if (!this.isLoaded) {
      throw new Error('Dataset not loaded. Call loadSongDataset() first.');
    }

    const computeStats = (songs) => {
      const count = songs.length;
      const avgDifficulty = count > 0
        ? Math.round((songs.reduce((sum, s) => sum + (s.difficulty_level || 0), 0) / count) * 100) / 100
        : null;
      const energyCounts = {};
      const tagCounts = {};
      songs.forEach(s => {
        if (s.energy_level) energyCounts[s.energy_level] = (energyCounts[s.energy_level] || 0) + 1;
        (s.style_tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
      });
      const dominantEnergy = Object.entries(energyCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null;
      const topStyleTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([t])=>t);
      return { count, avgDifficulty, dominantEnergy, topStyleTags };
    };

    const inputGenres = Array.isArray(genres) ? genres : [genres];
    const genreSet = new Set(inputGenres.map(g => String(g).toLowerCase()));

    // 1) Try strict genre matches
    let matched = this.songs.filter(s => (s.genre_tags || []).some(g => genreSet.has(String(g).toLowerCase())) ||
      (s.GENRES || '').toLowerCase().split(',').some(raw => genreSet.has(raw.trim().toLowerCase())));
    let stats = computeStats(matched);
    if (stats.count > 0) return { ...stats, source: 'genre' };

    // 2) Fallback to style keywords derived from genres
    const styleMap = {
      rock: ['rock', 'energetic', 'powerful'],
      alternative: ['alternative', 'indie', 'modern'],
      indie: ['indie', 'alternative'],
      pop: ['pop', 'catchy', 'upbeat'],
      acoustic: ['acoustic', 'folk', 'gentle'],
      folk: ['folk', 'storytelling', 'acoustic'],
      metal: ['metal', 'aggressive', 'intense'],
      progressive: ['progressive', 'complex'],
      jazz: ['jazz', 'sophisticated', 'cool'],
      dance: ['dance', 'upbeat'],
      funk: ['funk', 'groove']
    };
    const styleCandidates = inputGenres.flatMap(g => styleMap[String(g).toLowerCase()] || []);
    if (styleCandidates.length > 0) {
      matched = this.songs.filter(s => (s.style_tags || []).some(t => styleCandidates.includes(String(t).toLowerCase())));
      stats = computeStats(matched);
      if (stats.count > 0) return { ...stats, source: 'style' };
    }

    // 3) Last resort: global dataset summary so the UI has something meaningful
    stats = computeStats(this.songs);
    return { ...stats, source: 'global' };
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
      (song.genre_tags || this.safeParseList(song.GENRES)).forEach(genre => genres.add(genre));
      (song.style_tags || this.safeParseList(song.TAGS)).forEach(style => styleTags.add(style));
      if (typeof song.difficulty_level === 'number') difficulties.push(song.difficulty_level);
      if (song.energy_level) energyLevels.add(song.energy_level);
    });

    const difficultyStats = difficulties.length > 0 ? {
      min: Math.min(...difficulties),
      max: Math.max(...difficulties),
      average: Math.round((difficulties.reduce((a, b) => a + b, 0) / difficulties.length) * 100) / 100
    } : { min: null, max: null, average: null };

    return {
      totalSongs: this.songs.length,
      uniqueGenres: Array.from(genres),
      uniqueStyleTags: Array.from(styleTags),
      difficultyRange: difficultyStats,
      energyLevels: Array.from(energyLevels)
    };
  }

  /**
   * Normalize a YS CSV song to internal fields used by filters and scoring
   */
  normalizeYSSong(song) {
    // Parse lists
    const genre_tags = this.safeParseList(song.GENRES);
    const style_tags = this.safeParseList(song.TAGS);

    // Duration from exercise length
    const duration = typeof song['MAX(EXERCISE_LENGTH)'] === 'number' ? Math.round(song['MAX(EXERCISE_LENGTH)']) : undefined;

    // BPM -> energy level
    const bpm = (typeof song.QUARTER_NOTES_PER_MINUTE === 'number' && song.QUARTER_NOTES_PER_MINUTE > 0)
      ? song.QUARTER_NOTES_PER_MINUTE
      : (typeof song.BEATS_PER_MINUTE === 'number' ? song.BEATS_PER_MINUTE : 0);
    let energy_level = 'medium';
    if (bpm > 0) {
      if (bpm < 60) energy_level = 'very_low';
      else if (bpm < 80) energy_level = 'low';
      else if (bpm < 110) energy_level = 'medium';
      else if (bpm < 140) energy_level = 'high';
      else energy_level = 'very_high';
    }

    // Heuristic difficulty based on arrangements, bpm, and pitch range
    const arrangements = this.safeParseList(song.AVAILABLE_ARRAGEMENTS);
    let difficulty = 4;
    const arrStr = arrangements.join(' ').toLowerCase();
    if (arrStr.includes('basic')) difficulty = Math.max(difficulty, 2);
    if (arrStr.includes('main')) difficulty = Math.max(difficulty, 3);
    if (arrStr.includes('advanced') || arrStr.includes('solo') || arrStr.includes('expert')) difficulty = Math.max(difficulty, 7);
    if (bpm >= 130) difficulty += 1;
    if (bpm >= 160) difficulty += 1;
    const pitchRange = (parseInt(song.HIGHEST_PITCH) || 0) - (parseInt(song.LOWEST_PITCH) || 0);
    if (pitchRange > 30) difficulty += 1;
    if (pitchRange > 50) difficulty += 1;
    difficulty = Math.max(1, Math.min(10, difficulty));

    // Key signature mood analysis
    const keyMoodTags = [];
    if (song.SONG_KEY_MODE === 'major') {
      keyMoodTags.push('uplifting', 'positive');
    } else if (song.SONG_KEY_MODE === 'minor') {
      keyMoodTags.push('emotional', 'melancholic');
    }

    // Popularity scoring (logarithmic scale)
    const playCount = parseInt(song.PLAY_COUNT) || 0;
    const popularityScore = playCount > 0 ? Math.log(playCount + 1) / Math.log(1000000) : 0; // Normalize to 0-1 scale

    // Add a couple of derived tags from energy
    const derivedTags = [];
    if (energy_level === 'high' || energy_level === 'very_high') derivedTags.push('energetic');
    if (energy_level === 'low' || energy_level === 'very_low') derivedTags.push('peaceful');

    return {
      ...song,
      // Normalized fields
      genre_tags,
      style_tags: [...new Set([...(style_tags || []), ...derivedTags, ...keyMoodTags])],
      duration,
      energy_level,
      difficulty_level: difficulty,
      instrument_fit: 'guitar',
      // Enhanced fields
      popularity_score: popularityScore,
      key_signature: `${song.SONG_KEY_ROOT || ''} ${song.SONG_KEY_MODE || ''}`.trim(),
      pitch_range: pitchRange,
      key_mood_tags: keyMoodTags
    };
  }

  /**
   * Parse JSON arrays, comma-separated strings, or return [] for falsy
   */
  safeParseList(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const str = String(value).trim();
    if (!str) return [];
    try {
      if (str.startsWith('[')) {
        // Attempt to repair common CSV-embedded JSON formats with doubled quotes and newlines
        const repaired = str
          .replace(/""/g, '"')
          .replace(/\r?\n/g, '\n');
        const parsed = JSON.parse(repaired);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (_) {
      // fallthrough to custom parsing below
    }
    // Handle bracketed non-JSON lists like: [\n  rock\n]
    if (str.startsWith('[') && str.endsWith(']')) {
      const inner = str.slice(1, -1).replace(/\r?\n/g, ' ').replace(/[\"\[\]]/g, ' ');
      const tokens = inner.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
      if (tokens.length > 0) return tokens;
    }
    if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean);
    return [str];
  }
}

module.exports = DatasetLoader;
