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
   * Get songs from Yousician API
   * @param {Object} params - Query parameters
   * @returns {Promise} API response
   */
  async getSongs(params = {}) {
    try {
      const response = await this.client.get('/songs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching songs:', error.message);
      throw error;
    }
  }

  /**
   * Get song details by ID
   * @param {string} songId - Song ID
   * @returns {Promise} API response
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
   * Search songs by mood or other criteria
   * @param {Object} searchParams - Search parameters
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
   * Get mood analysis for a song
   * @param {string} songId - Song ID
   * @returns {Promise} API response
   */
  async getSongMood(songId) {
    try {
      const response = await this.client.get(`/songs/${songId}/mood`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching mood for song ${songId}:`, error.message);
      throw error;
    }
  }
}

module.exports = YousicianClient;
