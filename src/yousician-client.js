const axios = require('axios');
require('dotenv').config();

class YousicianClient {
  constructor() {
    this.baseURL = process.env.YOUSICIAN_BASE_URL || 'https://api.yousician.com';
    this.apiKey = process.env.YOUSICIAN_API_KEY;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get songs with filters (existing YS functionality)
   * @param {Object} filters - Filter parameters (genre, level, instrument, etc.)
   * @returns {Promise} API response with song data
   */
  async getSongs(filters = {}) {
    try {
      const response = await this.client.get('/songs', { params: filters });
      return response.data;
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
      const response = await this.client.get(`/songs/${songId}`);
      return response.data;
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
      const response = await this.client.post('/recommendations', userProfile);
      return response.data;
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
      const response = await this.client.get('/songs/search', { params: searchParams });
      return response.data;
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
