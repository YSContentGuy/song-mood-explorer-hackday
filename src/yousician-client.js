const axios = require('axios');
const DatasetLoader = require('./dataset-loader');
require('dotenv').config();

class YousicianClient {
  constructor() {
    this.baseURL = process.env.YOUSICIAN_BASE_URL || 'https://api.yousician.com';
    this.apiKey = process.env.YOUSICIAN_API_KEY;
    this.useRealAPI = process.env.USE_REAL_API === 'true';
    
    // Initialize dataset loader for mock data
    this.datasetLoader = new DatasetLoader();
    this.datasetLoaded = false;
    
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
        const filters = {
          genre_tags: userProfile.genrePreferences,
          min_difficulty: Math.max(1, userProfile.skillLevel - 1),
          max_difficulty: userProfile.skillLevel + 1,
          instrument_fit: userProfile.instrument,
          limit: 10
        };
        return this.datasetLoader.getSongs(filters);
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
