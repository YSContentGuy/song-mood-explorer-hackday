const YousicianClient = require('./yousician-client');

class MoodExplorer {
  constructor() {
    this.client = new YousicianClient();
  }

  /**
   * Analyze mood patterns across multiple songs
   * @param {Array} songIds - Array of song IDs to analyze
   * @returns {Promise} Mood analysis results
   */
  async analyzeMoodPatterns(songIds) {
    try {
      const moodPromises = songIds.map(id => this.client.getSongMood(id));
      const moodResults = await Promise.all(moodPromises);
      
      return this.aggregateMoodData(moodResults);
    } catch (error) {
      console.error('Error analyzing mood patterns:', error.message);
      throw error;
    }
  }

  /**
   * Find songs by mood criteria
   * @param {string} mood - Target mood (e.g., 'happy', 'sad', 'energetic')
   * @param {number} limit - Maximum number of results
   * @returns {Promise} Array of matching songs
   */
  async findSongsByMood(mood, limit = 10) {
    try {
      const searchParams = {
        mood: mood,
        limit: limit
      };
      
      return await this.client.searchSongs(searchParams);
    } catch (error) {
      console.error(`Error finding songs by mood ${mood}:`, error.message);
      throw error;
    }
  }

  /**
   * Get mood recommendations based on current mood
   * @param {string} currentMood - User's current mood
   * @returns {Promise} Recommended songs
   */
  async getMoodRecommendations(currentMood) {
    try {
      // Logic to recommend songs based on mood
      const complementaryMoods = this.getComplementaryMoods(currentMood);
      const recommendations = [];

      for (const mood of complementaryMoods) {
        const songs = await this.findSongsByMood(mood, 5);
        recommendations.push(...songs);
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting mood recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Aggregate mood data from multiple songs
   * @param {Array} moodResults - Array of mood analysis results
   * @returns {Object} Aggregated mood statistics
   */
  aggregateMoodData(moodResults) {
    const moodCounts = {};
    const totalSongs = moodResults.length;

    moodResults.forEach(result => {
      if (result.mood) {
        moodCounts[result.mood] = (moodCounts[result.mood] || 0) + 1;
      }
    });

    const moodPercentages = {};
    Object.keys(moodCounts).forEach(mood => {
      moodPercentages[mood] = (moodCounts[mood] / totalSongs) * 100;
    });

    return {
      totalSongs,
      moodCounts,
      moodPercentages,
      dominantMood: Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
      )
    };
  }

  /**
   * Get complementary moods for recommendations
   * @param {string} mood - Current mood
   * @returns {Array} Array of complementary moods
   */
  getComplementaryMoods(mood) {
    const moodMap = {
      'sad': ['uplifting', 'hopeful', 'calm'],
      'angry': ['calm', 'peaceful', 'soothing'],
      'happy': ['energetic', 'joyful', 'upbeat'],
      'tired': ['energetic', 'motivational', 'upbeat'],
      'stressed': ['calm', 'relaxing', 'peaceful'],
      'excited': ['energetic', 'upbeat', 'dynamic']
    };

    return moodMap[mood.toLowerCase()] || ['happy', 'calm', 'energetic'];
  }
}

module.exports = MoodExplorer;
