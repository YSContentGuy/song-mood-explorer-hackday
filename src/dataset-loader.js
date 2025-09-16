const { mockSongs, mockUserProfiles, mockContextScenarios } = require('./mock-data');

class DatasetLoader {
  constructor() {
    this.songs = [];
    this.isLoaded = false;
  }

  /**
   * Load song dataset - will use Pavel's real data when available
   * For now uses mock data for proof of concept
   */
  async loadSongDataset() {
    try {
      // TODO: Replace with Pavel's dataset loading
      // const realSongs = await this.loadFromPavel();
      
      this.songs = mockSongs;
      this.isLoaded = true;
      
      console.log(`Loaded ${this.songs.length} songs for mood exploration`);
      return this.songs;
    } catch (error) {
      console.error('Error loading song dataset:', error.message);
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
