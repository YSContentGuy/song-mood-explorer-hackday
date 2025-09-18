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
      const ctx = { ...context, userProfile };
      return this.combineRecommendations(comfortZoneRecommendations, contextualSongs, ctx);
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
    const filters = this.buildContextualFilters(userProfile, context);
    
    // Get songs that match contextual criteria
    let songs = await this.client.searchSongs(filters);
    
    // If we don't have enough songs for good mood matching, get more with relaxed filters
    if (songs.length < 50) {
      const relaxedFilters = {
        ...filters,
        limit: 200, // Get more songs for better mood matching
        // Remove restrictive filters that might limit our pool
        style_tags: undefined, // Let mood scoring handle this
        energy_level: undefined // Let mood scoring handle this
      };
      const moreSongs = await this.client.searchSongs(relaxedFilters);
      songs = [...songs, ...moreSongs];
    }
    
    // Apply mood-based scoring (augment context with user profile)
    return this.scoreSongsByMood(songs, { ...context, userProfile });
  }

  /**
   * Build search filters based on context
   * @param {Object} context - Context with mood, time, available_time, goals, etc.
   * @returns {Object} Search filters
   */
  buildContextualFilters(userProfile, context) {
    const filters = {};
    
    // Time-based filters (avoid over-restricting when a mood is specified)
    if (context.timeOfDay && !context.mood) {
      filters.energy_level = this.getEnergyLevelForTime(context.timeOfDay);
    }
    
    // Duration filters based on available time
    if (context.availableTime) {
      filters.max_duration = this.getDurationForAvailableTime(context.availableTime);
    }
    
    // Goal-based filters - respect learning styles
    const learningStyle = userProfile?.learningStyle || '';
    
    if (context.goals === 'challenge') {
      // Encourage growth for everyone, but respect learning styles
      if (learningStyle === 'comfort_zone_required') {
        // Sarah: NO challenge - stay in comfort zone even when "challenging"
        filters.min_difficulty = Math.max(1, (userProfile?.skillLevel || 3) - 1);
        filters.max_difficulty = userProfile?.skillLevel || 3; // Stay at skill level
      } else if (learningStyle === 'comfort_zone_least_important') {
        // Mike: Loves challenges - push boundaries more
        filters.min_difficulty = (userProfile?.skillLevel || 3) + 1;
        filters.max_difficulty = Math.min(10, (userProfile?.skillLevel || 3) + 3);
      } else {
        // Alex and default: Moderate challenge
        filters.min_difficulty = (userProfile?.skillLevel || 3) + 1;
        filters.max_difficulty = Math.min(10, (userProfile?.skillLevel || 3) + 2);
      }
      filters.density = 'high'; // More notes/chords
    } else if (context.goals === 'relax') {
      // Stay in comfort zone for relaxation
      if (learningStyle === 'comfort_zone_required') {
        // Sarah: Stay well within comfort zone - only levels 1-2
        filters.min_difficulty = 1;
        filters.max_difficulty = Math.max(1, (userProfile?.skillLevel || 3) - 1);
      } else {
        // Others: Stay at or below skill level
        filters.max_difficulty = Math.max(1, (userProfile?.skillLevel || 3));
      }
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
      const weights = this.getContextualWeights(context);
      
      // Base comfort zone score (existing recommendation logic)
      const comfortZoneScore = this.getComfortZoneScore(song, context.userProfile || {});
      score += comfortZoneScore * weights.comfortZone;
      
      // Mood alignment scoring with enhanced logic
      const moodScore = this.getEnhancedMoodAlignmentScore(song, context);
      score += moodScore * weights.mood;
      
      // Time-based scoring with energy correlation
      const timeScore = this.getEnhancedTimeBasedScore(song, context.timeOfDay, context.mood);
      score += timeScore * weights.time;
      
      // Duration fit scoring with preference curves
      const durationScore = this.getEnhancedDurationFitScore(song, context.availableTime);
      score += durationScore * weights.duration;
      
      // Goal alignment scoring with skill progression
      const goalScore = this.getEnhancedGoalAlignmentScore(song, context.goals, context.userProfile);
      score += goalScore * weights.goal;
      
      // Exploration bonus for variety
      const explorationScore = this.getExplorationScore(song, context);
      score += explorationScore * weights.exploration;
      
      // Popularity scoring (proven appeal + user preference alignment)
      const popularityScore = this.getEnhancedPopularityScore(song, context.userProfile);
      score += popularityScore * weights.popularity;
      
      return {
        ...song,
        contextualScore: Math.round(score * 100) / 100,
        scoringBreakdown: {
          comfortZone: Math.round(comfortZoneScore * 100) / 100,
          moodAlignment: Math.round(moodScore * 100) / 100,
          timeAlignment: Math.round(timeScore * 100) / 100,
          durationFit: Math.round(durationScore * 100) / 100,
          goalAlignment: Math.round(goalScore * 100) / 100,
          exploration: Math.round(explorationScore * 100) / 100,
          popularity: Math.round(popularityScore * 100) / 100,
          weights: weights
        }
      };
    }).sort((a, b) => b.contextualScore - a.contextualScore);
  }

  /**
   * Calculate comfort zone score based ONLY on difficulty level proximity
   * This represents how comfortable the user will be with the technical difficulty
   */
  getComfortZoneScore(song, userProfile) {
    let score = 0.0; // Start from 0 - no comfort zone match

    // Only consider difficulty proximity - this is what "comfort zone" should mean
    if (userProfile && typeof userProfile.skillLevel === 'number' && typeof song.difficulty_level === 'number') {
      const gap = Math.abs(song.difficulty_level - userProfile.skillLevel);
      let difficultyScore = 0;
      
      // Base difficulty scoring
      if (gap === 0) difficultyScore = 1.0; // Perfect match
      else if (gap === 1) difficultyScore = 0.7; // Close match
      else if (gap === 2) difficultyScore = 0.4; // Moderate stretch
      else difficultyScore = 0.1; // Far from comfort zone
      
      // Adjust based on learning style
      const learningStyle = userProfile.learningStyle || '';
      if (learningStyle === 'comfort_zone_required') {
        // Sarah: Strictly prefer comfort zone difficulty
        if (gap > 1) difficultyScore *= 0.3; // Heavy penalty for challenging songs
        else if (gap === 1) difficultyScore *= 0.6; // Moderate penalty for slight challenge
      } else if (learningStyle === 'comfort_zone_least_important') {
        // Mike: Doesn't care much about comfort zone - reward challenges
        if (gap > 1) difficultyScore *= 1.2; // Bonus for challenging songs
        else if (gap === 0) difficultyScore *= 0.8; // Slight penalty for too easy
      } else if (learningStyle === 'comfort_zone_preferred_but_adventurous') {
        // Alex: Likes comfort zone but open to growth
        if (gap > 2) difficultyScore *= 1.1; // Slight bonus for big challenges
        else if (gap === 0) difficultyScore *= 1.1; // Bonus for comfort zone
      }
      
      score = difficultyScore;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  getContextualWeights(context) {
    // Dynamic weight adjustment based on context
    const baseWeights = {
      comfortZone: 0.20,
      mood: 0.25,
      time: 0.15,
      duration: 0.15,
      goal: 0.05,
      exploration: 0.05,
      popularity: 0.15
    };

    // Adjust popularity weight based on user preference
    const userPopularityPreference = context.userProfile?.popularityPreference || 0.5;
    if (userPopularityPreference > 0.6) {
      // User prefers popular songs - increase popularity weight
      baseWeights.popularity += 0.10;
      baseWeights.comfortZone -= 0.05;
      baseWeights.mood -= 0.05;
    } else if (userPopularityPreference < 0.4) {
      // User prefers niche songs - decrease popularity weight
      baseWeights.popularity -= 0.05;
      baseWeights.comfortZone += 0.05;
    }

    // Adjust weights based on learning style
    const userProfile = context.userProfile;
    if (userProfile && userProfile.learningStyle) {
      const learningStyle = userProfile.learningStyle;
      if (learningStyle === 'comfort_zone_required') {
        // Sarah: Heavily weight comfort zone, reduce exploration
        baseWeights.comfortZone += 0.10;
        baseWeights.exploration -= 0.10;
      } else if (learningStyle === 'comfort_zone_least_important') {
        // Mike: Reduce comfort zone weight, increase exploration
        baseWeights.comfortZone -= 0.10;
        baseWeights.exploration += 0.10;
      } else if (learningStyle === 'comfort_zone_preferred_but_adventurous') {
        // Alex: Moderate comfort zone, balanced exploration
        baseWeights.comfortZone += 0.05;
        baseWeights.exploration += 0.05;
        baseWeights.mood -= 0.10; // Reduce mood weight to balance
      }
    }

    // Adjust weights based on context
    if (context.exploreNewMoods) {
      baseWeights.exploration += 0.10;
      baseWeights.comfortZone -= 0.05;
      baseWeights.mood -= 0.05;
    }

    if (context.availableTime && context.availableTime < 10) {
      // Short sessions prioritize duration fit
      baseWeights.duration += 0.15;
      baseWeights.mood -= 0.10;
      baseWeights.time -= 0.05;
    }

    if (context.goals === 'challenge') {
      baseWeights.goal += 0.10;
      baseWeights.comfortZone -= 0.10;
    }

    // Ensure no negative weights and normalize
    Object.keys(baseWeights).forEach(key => {
      baseWeights[key] = Math.max(0, baseWeights[key]);
    });

    // Normalize weights to sum to 1.0
    const totalWeight = Object.values(baseWeights).reduce((sum, weight) => sum + weight, 0);
    if (totalWeight > 0) {
      Object.keys(baseWeights).forEach(key => {
        baseWeights[key] = baseWeights[key] / totalWeight;
      });
    }

    return baseWeights;
  }

  getEnhancedMoodAlignmentScore(song, context) {
    const moodMappings = {
      happy: ['upbeat', 'positive', 'uplifting', 'happy', 'energetic', 'playful', 'joyful', 'cheerful', 'optimistic'],
      sad: ['melancholic', 'sad', 'emotional', 'introspective', 'haunting', 'melancholy', 'sorrowful', 'bittersweet'],
      energetic: ['energetic', 'powerful', 'upbeat', 'aggressive', 'intense', 'dynamic', 'vibrant', 'pumping', 'driving'],
      calm: ['peaceful', 'dreamy', 'gentle', 'soft', 'relaxing', 'serene', 'tranquil', 'soothing', 'meditative'],
      stressed: ['peaceful', 'calm', 'dreamy', 'gentle', 'soothing', 'serene', 'tranquil', 'meditative', 'healing'],
      motivated: ['motivational', 'powerful', 'building', 'intense', 'epic', 'inspiring', 'empowering', 'confident', 'determined'],
      tired: ['gentle', 'peaceful', 'soft', 'calm', 'dreamy', 'soothing', 'serene', 'tranquil', 'lullaby'],
      neutral: ['balanced', 'moderate', 'versatile', 'neutral', 'stable', 'consistent'],
      relaxed: ['peaceful', 'calm', 'gentle', 'soft', 'dreamy', 'serene', 'tranquil', 'soothing', 'meditative'],
      focused: ['focused', 'concentrated', 'intense', 'determined', 'serious', 'driven', 'disciplined', 'motivational', 'building', 'epic', 'inspiring'],
      romantic: ['romantic', 'passionate', 'intimate', 'loving', 'tender', 'sensual', 'affectionate'],
      nostalgic: ['nostalgic', 'retro', 'vintage', 'memorable', 'sentimental', 'reminiscent', 'timeless'],
      social: ['social', 'party', 'celebratory', 'communal', 'festive', 'gathering', 'interactive']
    };

    const targetMoodTags = moodMappings[context.mood] || [];
    if (targetMoodTags.length === 0) return 0.5; // Neutral score for unknown moods

    let alignmentScore = 0;
    let matchCount = 0;

    // MUSICAL STYLE PREFERENCE MATCHING (moved from comfort zone)
    // This is now part of mood match since it's about what the user wants to feel/hear
    if (context.userProfile && Array.isArray(context.userProfile.genrePreferences)) {
      let styleMatches = 0;
      
      // Check genre_tags first
      if (Array.isArray(song.genre_tags)) {
        styleMatches += song.genre_tags.filter(g => context.userProfile.genrePreferences.includes(g)).length;
      }
      
      // Check style_tags for genre matches (since genre_tags is often empty)
      if (Array.isArray(song.style_tags)) {
        styleMatches += song.style_tags.filter(tag => context.userProfile.genrePreferences.includes(tag)).length;
      }
      
      let styleBonus = 0;
      if (styleMatches >= 2) styleBonus = 0.4; // Strong style match
      else if (styleMatches === 1) styleBonus = 0.2; // Moderate style match
      
      // Adjust style preference based on learning style
      const learningStyle = context.userProfile.learningStyle || '';
      if (learningStyle === 'comfort_zone_required') {
        // Sarah: Heavily reward familiar styles
        styleBonus *= 1.3;
      } else if (learningStyle === 'comfort_zone_least_important') {
        // Mike: Less emphasis on familiar styles, more on exploration
        styleBonus *= 0.8;
      } else if (learningStyle === 'comfort_zone_preferred_but_adventurous') {
        // Alex: Moderate preference for familiar styles
        styleBonus *= 1.0;
      }
      
      alignmentScore += styleBonus;
      if (styleMatches > 0) matchCount++;
    }

    // Check style tags alignment
    if (song.style_tags) {
      song.style_tags.forEach(tag => {
        if (targetMoodTags.includes(tag)) {
          alignmentScore += 1.0;
          matchCount++;
        }
      });
    }

    // Check LLM-generated mood tags (enhanced data)
    if (song.llmEnhancement && song.llmEnhancement.generatedTags) {
      song.llmEnhancement.generatedTags.forEach(tag => {
        if (targetMoodTags.includes(tag)) {
          alignmentScore += 1.2; // Slightly higher weight for LLM tags
          matchCount++;
        }
      });
    }

    // Check LLM mood category direct match
    if (song.llmEnhancement && song.llmEnhancement.moodCategory) {
      if (song.llmEnhancement.moodCategory === context.mood) {
        alignmentScore += 1.5; // Strong match for direct mood category
        matchCount++;
      }
    }

    // Check psychological effect alignment
    if (song.llmEnhancement && song.llmEnhancement.psychologicalEffect) {
      const psychEffect = song.llmEnhancement.psychologicalEffect;
      const moodPsychMap = {
        happy: ['motivating', 'playful', 'confident'],
        sad: ['introspective', 'vulnerable'],
        energetic: ['motivating', 'energizing', 'confident'],
        calm: ['calming', 'soothing'],
        stressed: ['calming', 'soothing', 'healing'],
        motivated: ['motivating', 'energizing', 'confident'],
        tired: ['calming', 'soothing'],
        relaxed: ['calming', 'soothing', 'peaceful'],
        focused: ['motivating', 'serious', 'confident']
      };
      
      if (moodPsychMap[context.mood] && moodPsychMap[context.mood].includes(psychEffect)) {
        alignmentScore += 1.0;
        matchCount++;
      }
    }

    // Energy level correlation
    const energyMoodMap = {
      tired: 'very_low',
      calm: 'low',
      relaxed: 'low',
      neutral: 'medium',
      happy: 'medium',
      motivated: 'high',
      energetic: 'very_high',
      stressed: 'low', // Prefer calming music when stressed
      focused: 'high' // Focused mood benefits from high energy
    };

    if (song.energy_level === energyMoodMap[context.mood]) {
      alignmentScore += 0.5;
    }

    // More generous scoring - ensure we get reasonable mood match scores
    if (matchCount === 0) {
      // If no direct matches, give a base score based on energy level correlation
      return song.energy_level === energyMoodMap[context.mood] ? 0.3 : 0.1;
    }
    
    // Normalize score more generously
    const maxPossibleScore = Math.max(2, matchCount + 1); // More generous normalization
    const normalizedScore = Math.min(1.0, alignmentScore / maxPossibleScore);
    
    // Boost scores to ensure they're presentation-worthy (minimum 0.4 for any match)
    return Math.max(0.4, normalizedScore);
  }

  getEnhancedTimeBasedScore(song, timeOfDay, mood) {
    const timeEnergyMap = {
      morning: ['medium', 'high', 'very_high'],
      afternoon: ['medium', 'high'],
      evening: ['low', 'medium'],
      night: ['very_low', 'low']
    };

    const preferredEnergies = timeEnergyMap[timeOfDay] || ['medium'];
    let score = preferredEnergies.includes(song.energy_level) ? 1.0 : 0.3;

    // Mood override for time preferences
    if (mood === 'tired' && ['very_low', 'low'].includes(song.energy_level)) {
      score = 1.0;
    } else if (mood === 'energetic' && ['high', 'very_high'].includes(song.energy_level)) {
      score = 1.0;
    }

    return score;
  }

  getEnhancedDurationFitScore(song, availableTime) {
    if (!availableTime || !song.duration) return 0.5;

    const songMinutes = song.duration / 60;
    const availableMinutes = availableTime;

    // Optimal fit curve - songs should be 60-80% of available time
    const optimalRatio = songMinutes / availableMinutes;
    
    if (optimalRatio >= 0.6 && optimalRatio <= 0.8) {
      return 1.0; // Perfect fit
    } else if (optimalRatio >= 0.4 && optimalRatio <= 1.0) {
      return 0.8; // Good fit
    } else if (optimalRatio >= 0.2 && optimalRatio <= 1.2) {
      return 0.6; // Acceptable fit
    } else {
      return 0.2; // Poor fit
    }
  }

  getEnhancedGoalAlignmentScore(song, goals, userProfile) {
    const goalMappings = {
      relax: {
        energyLevels: ['very_low', 'low'],
        styleTags: ['peaceful', 'calm', 'gentle', 'dreamy'],
        difficultyPreference: 'lower'
      },
      energize: {
        energyLevels: ['high', 'very_high'],
        styleTags: ['energetic', 'upbeat', 'powerful'],
        difficultyPreference: 'any'
      },
      challenge: {
        energyLevels: ['medium', 'high', 'very_high'],
        styleTags: ['complex', 'technical', 'progressive'],
        difficultyPreference: 'higher'
      },
      maintain: {
        energyLevels: ['medium'],
        styleTags: ['balanced', 'familiar'],
        difficultyPreference: 'comfortable'
      },
      learn: {
        energyLevels: ['medium', 'high'],
        styleTags: ['educational', 'progressive'],
        difficultyPreference: 'slightly_higher'
      }
    };

    const goalMapping = goalMappings[goals];
    if (!goalMapping) return 0.5;

    let score = 0;
    let factors = 0;

    // Energy level alignment
    if (goalMapping.energyLevels.includes(song.energy_level)) {
      score += 1.0;
    }
    factors++;

    // Style tag alignment
    if (song.style_tags) {
      const matchingTags = song.style_tags.filter(tag => 
        goalMapping.styleTags.includes(tag)
      ).length;
      score += matchingTags > 0 ? 1.0 : 0.0;
    }
    factors++;

    // Difficulty alignment based on user skill and goal
    if (userProfile && userProfile.skillLevel && song.difficulty_level) {
      const userSkill = userProfile.skillLevel;
      const songDifficulty = song.difficulty_level;
      
      switch (goalMapping.difficultyPreference) {
        case 'lower':
          score += songDifficulty <= userSkill - 1 ? 1.0 : 0.3;
          break;
        case 'higher':
          score += songDifficulty >= userSkill + 1 ? 1.0 : 0.5;
          break;
        case 'slightly_higher':
          score += songDifficulty === userSkill + 1 ? 1.0 : 0.7;
          break;
        case 'comfortable':
          score += Math.abs(songDifficulty - userSkill) <= 1 ? 1.0 : 0.5;
          break;
        default:
          score += 0.5;
      }
    }
    factors++;

    return factors > 0 ? score / factors : 0.5;
  }

  getExplorationScore(song, context) {
    if (!context.exploreNewMoods) return 0;

    const userProfile = context.userProfile || {};
    let explorationBonus = 0;

    // Genre exploration
    if (userProfile.genrePreferences && song.genre_tags) {
      const hasUnfamiliarGenre = song.genre_tags.some(genre => 
        !userProfile.genrePreferences.includes(genre)
      );
      if (hasUnfamiliarGenre) explorationBonus += 0.5;
    }

    // Style exploration
    const commonStyles = ['upbeat', 'catchy', 'popular'];
    if (song.style_tags) {
      const hasUniqueStyle = song.style_tags.some(style => 
        !commonStyles.includes(style)
      );
      if (hasUniqueStyle) explorationBonus += 0.3;
    }

    // Difficulty exploration (slightly outside comfort zone)
    if (userProfile.skillLevel && song.difficulty_level) {
      const difficultyGap = Math.abs(song.difficulty_level - userProfile.skillLevel);
      if (difficultyGap === 1 || difficultyGap === 2) {
        explorationBonus += 0.2;
      }
    }

    return Math.min(1.0, explorationBonus);
  }

  /**
   * Combine comfort zone and contextual recommendations
   * @param {Array} comfortZone - Existing recommendations
   * @param {Array} contextual - Context-based recommendations
   * @param {Object} context - Current context
   * @returns {Array} Combined and ranked recommendations
   */
  combineRecommendations(comfortZone, contextual, context) {
    // If contextual list is empty, score comfort picks to provide explanations
    let contextualScored = contextual;
    if (!contextualScored || contextualScored.length === 0) {
      contextualScored = this.scoreSongsByMood(comfortZone, context);
    }

    // Score all comfort zone songs for comparison
    const comfortScored = this.scoreSongsByMood(comfortZone, context);
    
    // Combine all scored songs and get the absolute best matches
    const allScored = [...contextualScored, ...comfortScored];
    
    // Remove duplicates based on song ID
    const uniqueSongs = new Map();
    allScored.forEach(song => {
      const songId = song.SONG_ID || song.id;
      if (!uniqueSongs.has(songId) || uniqueSongs.get(songId).contextualScore < song.contextualScore) {
        uniqueSongs.set(songId, song);
      }
    });
    
    // Sort by contextual score and return top 10
    const finalRecommendations = Array.from(uniqueSongs.values())
      .sort((a, b) => b.contextualScore - a.contextualScore)
      .slice(0, 10);
    
    return finalRecommendations;
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

  /**
   * Score song based on popularity (play count)
   * @param {Object} song - Song object
   * @returns {number} Popularity score (0-1)
   */
  getPopularityScore(song) {
    // Use pre-calculated popularity score if available
    if (song.popularity_score !== undefined) {
      return song.popularity_score;
    }
    
    // Fallback: calculate from play count
    const playCount = parseInt(song.PLAY_COUNT) || 0;
    if (playCount === 0) return 0.1; // Small boost for songs with no data
    
    // Logarithmic scale: log(playCount + 1) / log(maxExpectedPlays)
    // Normalize to 0-1 scale where 1M plays = 1.0
    return Math.min(1.0, Math.log(playCount + 1) / Math.log(1000000));
  }

  /**
   * Enhanced popularity scoring that considers user preference and LLM assessment
   * @param {Object} song - Song object
   * @param {Object} userProfile - User profile with popularityPreference
   * @returns {number} Enhanced popularity score (0-1)
   */
  getEnhancedPopularityScore(song, userProfile) {
    const userPopularityPreference = userProfile?.popularityPreference || 0.5;
    
    // Get base popularity score (play count based)
    const basePopularity = this.getPopularityScore(song);
    
    // Get LLM popularity assessment if available
    let llmPopularity = 0.5; // Default moderate popularity
    if (song.llmPopularityAssessment) {
      llmPopularity = song.llmPopularityAssessment.overallPopularity || 0.5;
    } else {
      // Fallback: infer from artist name for Yousician vs commercial songs
      const artistLower = (song.ARTIST_NAME || '').toLowerCase();
      if (artistLower.includes('yousician')) {
        llmPopularity = 0.1; // Yousician songs are learning-focused, not commercially popular
      } else {
        llmPopularity = 0.6; // Commercial songs generally have higher recognition
      }
    }
    
    // Combine base popularity (play data) with LLM assessment
    const combinedPopularity = (basePopularity * 0.3) + (llmPopularity * 0.7);
    
    // Apply user preference: if user prefers popular songs, boost high-popularity songs
    // If user prefers niche songs, boost low-popularity songs
    let preferenceAdjustedScore;
    if (userPopularityPreference > 0.5) {
      // User prefers popular songs - boost high popularity, penalize low popularity
      preferenceAdjustedScore = combinedPopularity * (0.5 + userPopularityPreference);
    } else {
      // User prefers niche songs - boost low popularity, penalize high popularity
      preferenceAdjustedScore = (1 - combinedPopularity) * (1.5 - userPopularityPreference);
    }
    
    return Math.min(1.0, Math.max(0.0, preferenceAdjustedScore));
  }
}

module.exports = MoodExplorer;
