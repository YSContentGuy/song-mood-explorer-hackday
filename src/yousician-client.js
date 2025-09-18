const axios = require('axios');
const DatasetLoader = require('./dataset-loader');
require('dotenv').config();

class YousicianClient {
  constructor() {
    this.baseURL = process.env.YOUSICIAN_BASE_URL || 'https://api.yousician.com';
    this.apiKey = process.env.YOUSICIAN_API_KEY;
    this.useRealAPI = process.env.USE_REAL_API === 'true';
    
    // Initialize dataset loader (shared across app if available)
    if (global.__YS_SHARED_DATASET_LOADER) {
      this.datasetLoader = global.__YS_SHARED_DATASET_LOADER;
      this.datasetLoaded = this.datasetLoader.isLoaded;
    } else {
      this.datasetLoader = new DatasetLoader();
      this.datasetLoaded = false;
      global.__YS_SHARED_DATASET_LOADER = this.datasetLoader;
    }
    
    if (this.useRealAPI) {
      this.client = axios.create({
        baseURL: this.baseURL,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
    }
  }

  /**
   * Ensure dataset is loaded for mock mode
   */
  async ensureDatasetLoaded() {
    if (!this.datasetLoaded && !this.useRealAPI) {
      await this.datasetLoader.loadSongDataset();
      this.datasetLoaded = true;
    }
  }

  /**
   * Get songs with filters (existing YS functionality)
   * @param {Object} filters - Filter parameters (genre, level, instrument, etc.)
   * @returns {Promise} API response with song data
   */
  async getSongs(filters = {}) {
    try {
      if (this.useRealAPI) {
        const response = await this.client.get('/songs', { params: filters });
        return response.data;
      } else {
        // Use mock data for proof of concept
        await this.ensureDatasetLoaded();
        return this.datasetLoader.getSongs(filters);
      }
    } catch (error) {
      console.error('Error fetching songs:', error.message);
      throw error;
    }
  }

  /**
   * Get song details with all properties
   * @param {string} songId - Song ID
   * @returns {Promise} Song object with properties:
   *   - artist, popularity
   *   - genre tags
   *   - instrument fit/style (lead/rhythm)
   *   - duration, density (notes/chords per time)
   *   - skill requirements, difficulty level
   *   - style/mood tags
   */
  async getSongById(songId) {
    try {
      if (this.useRealAPI) {
        const response = await this.client.get(`/songs/${songId}`);
        return response.data;
      } else {
        // Use mock data for proof of concept
        await this.ensureDatasetLoaded();
        return this.datasetLoader.getSongById(songId);
      }
    } catch (error) {
      console.error(`Error fetching song ${songId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get existing recommendations (comfort zone)
   * @param {Object} userProfile - User's genre preferences, skill level, etc.
   * @returns {Promise} Recommended songs based on existing algorithm
   */
  async getRecommendations(userProfile) {
    try {
      if (this.useRealAPI) {
        const response = await this.client.post('/recommendations', userProfile);
        return response.data;
      } else {
        // Mock comfort zone recommendations based on user preferences
        await this.ensureDatasetLoaded();
        
        // More nuanced approach: Allow gentle growth for everyone, let scoring handle the balance
        let minDifficulty, maxDifficulty;
        const learningStyle = userProfile.learningStyle || '';
        
        if (learningStyle === 'comfort_zone_required') {
          // Sarah: Mostly comfort zone, but allow gentle growth (1 level above)
          minDifficulty = Math.max(1, userProfile.skillLevel - 1);
          maxDifficulty = userProfile.skillLevel + 1; // Allow gentle challenge
        } else if (learningStyle === 'comfort_zone_least_important') {
          // Mike: Loves challenges - wider range
          minDifficulty = Math.max(1, userProfile.skillLevel - 1);
          maxDifficulty = Math.min(10, userProfile.skillLevel + 2); // Allow challenging songs
        } else if (learningStyle === 'comfort_zone_preferred_but_adventurous') {
          // Alex: Comfort zone preferred, but can handle challenges
          minDifficulty = Math.max(1, userProfile.skillLevel - 1);
          maxDifficulty = Math.min(10, userProfile.skillLevel + 1); // Slight challenge
        } else {
          // Default behavior - gentle growth for everyone
          minDifficulty = Math.max(1, userProfile.skillLevel - 1);
          maxDifficulty = userProfile.skillLevel + 1;
        }
        
        const filters = {
          min_difficulty: minDifficulty,
          max_difficulty: maxDifficulty,
          instrument_fit: userProfile.instrument,
          genre_tags: userProfile.genrePreferences || [],
          limit: 200  // Increased limit to get better mood matches
        };
        let results = this.datasetLoader.getSongs(filters);
        if (results.length === 0) {
          // Relax constraints progressively for better demo coverage, but still respect learning styles
          let relaxedMinDifficulty, relaxedMaxDifficulty;
          
          if (learningStyle === 'comfort_zone_required') {
            // Sarah: Even when relaxing, don't go too far above skill level
            relaxedMinDifficulty = Math.max(1, userProfile.skillLevel - 2);
            relaxedMaxDifficulty = userProfile.skillLevel + 1; // Still limit challenges
          } else if (learningStyle === 'comfort_zone_least_important') {
            // Mike: Can handle more challenging songs when relaxing
            relaxedMinDifficulty = Math.max(1, userProfile.skillLevel - 2);
            relaxedMaxDifficulty = Math.min(10, userProfile.skillLevel + 3);
          } else {
            // Alex and default: Moderate relaxation
            relaxedMinDifficulty = Math.max(1, userProfile.skillLevel - 2);
            relaxedMaxDifficulty = Math.min(10, userProfile.skillLevel + 2);
          }
          
          const relaxed = { 
            ...filters, 
            min_difficulty: relaxedMinDifficulty, 
            max_difficulty: relaxedMaxDifficulty 
          };
          results = this.datasetLoader.getSongs(relaxed);
        }
        if (results.length === 0) {
          // Remove genre filter as last resort
          const noGenre = { min_difficulty: 1, max_difficulty: 10, instrument_fit: userProfile.instrument, limit: filters.limit };
          results = this.datasetLoader.getSongs(noGenre);
        }
        return results;
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Search songs with advanced filters
   * @param {Object} searchParams - Search parameters including mood, style, context
   * @returns {Promise} API response
   */
  async searchSongs(searchParams) {
    try {
      if (this.useRealAPI) {
        const response = await this.client.get('/songs/search', { params: searchParams });
        return response.data;
      } else {
        // Use mock data search
        await this.ensureDatasetLoaded();
        return this.datasetLoader.getSongs(searchParams);
      }
    } catch (error) {
      console.error('Error searching songs:', error.message);
      throw error;
    }
  }

  /**
   * Get songs by genre with additional metadata
   * @param {string} genre - Genre filter
   * @param {Object} additionalFilters - Level, instrument, etc.
   * @returns {Promise} Filtered songs
   */
  async getSongsByGenre(genre, additionalFilters = {}) {
    try {
      const params = { genre, ...additionalFilters };
      const response = await this.client.get('/songs', { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching songs for genre ${genre}:`, error.message);
      throw error;
    }
  }
}

module.exports = YousicianClient;
