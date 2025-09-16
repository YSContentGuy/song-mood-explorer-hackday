const YousicianClient = require('./yousician-client');

class MoodExplorer {
  constructor() {
    this.client = new YousicianClient();
  }

  /**
   * Get contextual recommendations beyond comfort zone
   * @param {Object} userProfile - User's preferences, skill level, etc.
   * @param {Object} context - Variable factors (time, mood, goals, etc.)
   * @returns {Promise} Context-aware song recommendations
   */
  async getContextualRecommendations(userProfile, context) {
    try {
      // Get baseline comfort zone recommendations
      const comfortZoneRecommendations = await this.client.getRecommendations(userProfile);
      
      // Apply contextual filters and mood-based adjustments
      const contextualSongs = await this.applyContextualFilters(userProfile, context);
      
      // Combine and rank recommendations
      return this.combineRecommendations(comfortZoneRecommendations, contextualSongs, context);
    } catch (error) {
      console.error('Error getting contextual recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Apply contextual filters based on variable factors
   * @param {Object} userProfile - User profile
   * @param {Object} context - Context object with mood, time, goals, etc.
   * @returns {Promise} Filtered songs
   */
  async applyContextualFilters(userProfile, context) {
    const filters = this.buildContextualFilters(context);
    
    // Get songs that match contextual criteria
    const songs = await this.client.searchSongs(filters);
    
    // Apply mood-based scoring
    return this.scoreSongsByMood(songs, context);
  }

  /**
   * Build search filters based on context
   * @param {Object} context - Context with mood, time, available_time, goals, etc.
   * @returns {Object} Search filters
   */
  buildContextualFilters(context) {
    const filters = {};
    
    // Time-based filters
    if (context.timeOfDay) {
      filters.energy_level = this.getEnergyLevelForTime(context.timeOfDay);
    }
    
    // Duration filters based on available time
    if (context.availableTime) {
      filters.max_duration = this.getDurationForAvailableTime(context.availableTime);
    }
    
    // Goal-based filters
    if (context.goals === 'challenge') {
      filters.min_difficulty = userProfile.skillLevel + 1; // Push boundaries
      filters.density = 'high'; // More notes/chords
    } else if (context.goals === 'relax') {
      filters.max_difficulty = userProfile.skillLevel - 1; // Stay comfortable
      filters.style_tags = ['calm', 'peaceful', 'slow'];
    }
    
    // Mood-based style filters
    if (context.mood) {
      filters.style_tags = this.getStyleTagsForMood(context.mood);
    }
    
    // Inspiration-based filters
    if (context.inspiration) {
      filters.similar_to = context.inspiration; // Artist or song that inspired
    }
    
    return filters;
  }

  /**
   * Score songs based on mood and context fit
   * @param {Array} songs - Array of songs to score
   * @param {Object} context - Context with mood, goals, etc.
   * @returns {Array} Songs with mood scores
   */
  scoreSongsByMood(songs, context) {
    return songs.map(song => {
      let score = 0;
      
      // Mood alignment scoring
      if (context.mood && song.style_tags) {
        const moodTags = this.getStyleTagsForMood(context.mood);
        const matchingTags = song.style_tags.filter(tag => moodTags.includes(tag));
        score += matchingTags.length * 10;
      }
      
      // Energy level scoring based on time of day
      if (context.timeOfDay && song.energy_level) {
        const expectedEnergy = this.getEnergyLevelForTime(context.timeOfDay);
        if (song.energy_level === expectedEnergy) score += 15;
      }
      
      // Goal alignment scoring
      if (context.goals === 'challenge' && song.difficulty > song.user_level) {
        score += 20; // Reward challenging songs
      } else if (context.goals === 'relax' && song.difficulty <= song.user_level) {
        score += 20; // Reward comfortable songs
      }
      
      return { ...song, mood_score: score };
    }).sort((a, b) => b.mood_score - a.mood_score);
  }

  /**
   * Combine comfort zone and contextual recommendations
   * @param {Array} comfortZone - Existing recommendations
   * @param {Array} contextual - Context-based recommendations
   * @param {Object} context - Current context
   * @returns {Array} Combined and ranked recommendations
   */
  combineRecommendations(comfortZone, contextual, context) {
    // Weight contextual recommendations higher for mood exploration
    const contextWeight = context.exploreNewMoods ? 0.7 : 0.3;
    const comfortWeight = 1 - contextWeight;
    
    // Take top contextual recommendations
    const topContextual = contextual.slice(0, Math.ceil(10 * contextWeight));
    
    // Take remaining from comfort zone
    const remainingSlots = 10 - topContextual.length;
    const topComfort = comfortZone.slice(0, remainingSlots);
    
    return [...topContextual, ...topComfort];
  }

  /**
   * Get style tags that match a given mood
   * @param {string} mood - User's current mood
   * @returns {Array} Style tags that complement the mood
   */
  getStyleTagsForMood(mood) {
    const moodToStyleMap = {
      'happy': ['upbeat', 'joyful', 'energetic', 'positive'],
      'sad': ['melancholic', 'emotional', 'slow', 'introspective'],
      'energetic': ['fast', 'dynamic', 'powerful', 'driving'],
      'calm': ['peaceful', 'relaxing', 'ambient', 'gentle'],
      'stressed': ['calming', 'soothing', 'meditative', 'soft'],
      'excited': ['upbeat', 'energetic', 'fast', 'dynamic'],
      'tired': ['gentle', 'slow', 'peaceful', 'ambient'],
      'angry': ['intense', 'powerful', 'aggressive', 'fast'],
      'romantic': ['romantic', 'soft', 'emotional', 'gentle'],
      'nostalgic': ['classic', 'vintage', 'emotional', 'slow']
    };
    
    return moodToStyleMap[mood.toLowerCase()] || ['balanced', 'moderate'];
  }

  /**
   * Get appropriate energy level for time of day
   * @param {string} timeOfDay - 'morning', 'afternoon', 'evening', 'night'
   * @returns {string} Energy level
   */
  getEnergyLevelForTime(timeOfDay) {
    const timeEnergyMap = {
      'morning': 'medium',
      'afternoon': 'high',
      'evening': 'medium',
      'night': 'low'
    };
    
    return timeEnergyMap[timeOfDay] || 'medium';
  }

  /**
   * Get max duration based on available time
   * @param {number} availableMinutes - Available time in minutes
   * @returns {number} Max song duration in seconds
   */
  getDurationForAvailableTime(availableMinutes) {
    if (availableMinutes <= 5) return 180; // 3 minutes
    if (availableMinutes <= 15) return 300; // 5 minutes
    if (availableMinutes <= 30) return 420; // 7 minutes
    return 600; // 10 minutes max
  }

  /**
   * Analyze mood patterns across user's playing history
   * @param {Array} playHistory - User's recent song plays
   * @returns {Object} Mood pattern analysis
   */
  analyzeMoodPatterns(playHistory) {
    const moodCounts = {};
    const timePatterns = {};
    
    playHistory.forEach(play => {
      // Count mood occurrences
      if (play.song.style_tags) {
        play.song.style_tags.forEach(tag => {
          moodCounts[tag] = (moodCounts[tag] || 0) + 1;
        });
      }
      
      // Track time-based patterns
      const hour = new Date(play.timestamp).getHours();
      const timeSlot = this.getTimeSlot(hour);
      if (!timePatterns[timeSlot]) timePatterns[timeSlot] = {};
      
      play.song.style_tags?.forEach(tag => {
        timePatterns[timeSlot][tag] = (timePatterns[timeSlot][tag] || 0) + 1;
      });
    });
    
    return {
      preferredMoods: Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]),
      timePatterns,
      totalPlays: playHistory.length
    };
  }

  /**
   * Get time slot for hour
   * @param {number} hour - Hour (0-23)
   * @returns {string} Time slot
   */
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }
}

module.exports = MoodExplorer;
