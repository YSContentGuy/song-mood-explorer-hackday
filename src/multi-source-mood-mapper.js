/**
 * Multi-Source Mood Mapping System
 * Combines YS tags, behavioral signals, and LLM-generated tags into unified mood scores
 */

class MultiSourceMoodMapper {
  constructor() {
    this.moodCategories = {
      energetic: ['energetic', 'powerful', 'intense', 'driving', 'upbeat', 'rock', 'metal'],
      peaceful: ['peaceful', 'calm', 'gentle', 'dreamy', 'soft', 'ambient', 'chill'],
      happy: ['happy', 'positive', 'joyful', 'uplifting', 'bright', 'cheerful'],
      melancholic: ['melancholic', 'sad', 'emotional', 'introspective', 'blue', 'somber'],
      romantic: ['romantic', 'gentle', 'warm', 'intimate', 'love', 'tender'],
      nostalgic: ['nostalgic', 'reflective', 'wistful', 'memories', 'vintage'],
      focused: ['focused', 'concentration', 'study', 'minimal', 'ambient'],
      social: ['party', 'dance', 'social', 'fun', 'celebration', 'group']
    };

    this.energyLevels = {
      'very_low': 1,
      'low': 2,
      'medium': 3,
      'high': 4,
      'very_high': 5
    };
  }

  /**
   * Create unified mood profile from multiple sources
   */
  createUnifiedMoodProfile(song) {
    const sources = this.extractMoodSources(song);
    const moodScores = this.calculateMoodScores(sources);
    const energyScore = this.calculateEnergyScore(sources);
    const confidence = this.calculateConfidence(sources);

    return {
      songId: song.SONG_ID,
      title: song.SONG_TITLE,
      artist: song.ARTIST_NAME,
      unifiedMoodProfile: {
        primaryMood: this.getPrimaryMood(moodScores),
        moodScores,
        energyLevel: energyScore,
        confidence,
        sources: sources.sourcesUsed,
        reasoning: this.generateReasoning(sources, moodScores)
      },
      originalSources: sources
    };
  }

  /**
   * Extract mood information from all available sources
   */
  extractMoodSources(song) {
    const sources = {
      ysTags: this.parseYSTags(song.TAGS, song.GENRES),
      behavioralSignals: this.extractBehavioralMood(song.behavioralSignals),
      llmEnhancement: this.extractLLMMood(song.llmEnhancement),
      enhancedTags: this.parseEnhancedTags(song.enhancedTags),
      sourcesUsed: []
    };

    // Track which sources provided data
    if (sources.ysTags.tags.length > 0) sources.sourcesUsed.push('yousician_tags');
    if (sources.behavioralSignals.mood) sources.sourcesUsed.push('behavioral_analysis');
    if (sources.llmEnhancement.tags.length > 0) sources.sourcesUsed.push('llm_enhancement');

    return sources;
  }

  /**
   * Parse Yousician tags and genres
   */
  parseYSTags(tags, genres) {
    const allTags = [];
    
    // Parse tags
    if (tags) {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          allTags.push(...parsed);
        }
      } catch (e) {
        // Try comma-separated
        if (tags.includes(',')) {
          allTags.push(...tags.split(',').map(t => t.trim()));
        } else if (tags.trim()) {
          allTags.push(tags.trim());
        }
      }
    }

    // Parse genres
    if (genres) {
      try {
        const parsed = JSON.parse(genres);
        if (Array.isArray(parsed)) {
          allTags.push(...parsed);
        }
      } catch (e) {
        if (genres.includes(',')) {
          allTags.push(...genres.split(',').map(g => g.trim()));
        } else if (genres.trim()) {
          allTags.push(genres.trim());
        }
      }
    }

    return {
      tags: allTags.filter(tag => tag && tag.length > 0),
      confidence: allTags.length > 0 ? 0.8 : 0
    };
  }

  /**
   * Extract mood from behavioral signals
   */
  extractBehavioralMood(behavioralSignals) {
    if (!behavioralSignals) {
      return { mood: null, confidence: 0, reasoning: '' };
    }

    const { behavioralType, engagementRatio, completionRate } = behavioralSignals;
    
    let mood = 'neutral';
    let confidence = 0.6;
    let reasoning = '';

    switch (behavioralType) {
      case 'comfort_zone':
        mood = 'peaceful';
        confidence = 0.7;
        reasoning = 'High completion rate suggests comfortable, relaxing content';
        break;
      case 'challenge_abandoned':
        mood = 'energetic';
        confidence = 0.6;
        reasoning = 'Quick abandonment suggests challenging, intense content';
        break;
      case 'persistent_challenge':
        mood = 'focused';
        confidence = 0.8;
        reasoning = 'Persistent engagement despite difficulty suggests focus-inducing content';
        break;
      case 'appropriate_challenge':
        mood = 'happy';
        confidence = 0.7;
        reasoning = 'Balanced engagement suggests satisfying, positive experience';
        break;
    }

    return { mood, confidence, reasoning };
  }

  /**
   * Extract mood from LLM enhancement
   */
  extractLLMMood(llmEnhancement) {
    if (!llmEnhancement) {
      return { tags: [], energy: 'medium', confidence: 0 };
    }

    return {
      tags: llmEnhancement.generatedTags || [],
      energy: llmEnhancement.energyLevel || 'medium',
      mood: llmEnhancement.moodCategory || 'neutral',
      confidence: llmEnhancement.confidence || 0.3
    };
  }

  /**
   * Parse enhanced tags (combination of original + LLM)
   */
  parseEnhancedTags(enhancedTags) {
    if (!enhancedTags || !Array.isArray(enhancedTags)) {
      return { tags: [], confidence: 0 };
    }

    return {
      tags: enhancedTags,
      confidence: enhancedTags.length > 0 ? 0.6 : 0
    };
  }

  /**
   * Calculate mood scores from all sources
   */
  calculateMoodScores(sources) {
    const moodScores = {};
    
    // Initialize all mood categories
    Object.keys(this.moodCategories).forEach(mood => {
      moodScores[mood] = 0;
    });

    // Weight different sources
    const weights = {
      ysTags: 0.4,
      behavioralSignals: 0.3,
      llmEnhancement: 0.2,
      enhancedTags: 0.1
    };

    // Score from YS tags
    if (sources.ysTags.tags.length > 0) {
      this.addTagsToMoodScores(moodScores, sources.ysTags.tags, weights.ysTags * sources.ysTags.confidence);
    }

    // Score from behavioral signals
    if (sources.behavioralSignals.mood) {
      const behavioralMood = sources.behavioralSignals.mood;
      if (moodScores.hasOwnProperty(behavioralMood)) {
        moodScores[behavioralMood] += weights.behavioralSignals * sources.behavioralSignals.confidence;
      }
    }

    // Score from LLM enhancement
    if (sources.llmEnhancement.tags.length > 0) {
      this.addTagsToMoodScores(moodScores, sources.llmEnhancement.tags, weights.llmEnhancement * sources.llmEnhancement.confidence);
    }

    // Score from enhanced tags
    if (sources.enhancedTags.tags.length > 0) {
      this.addTagsToMoodScores(moodScores, sources.enhancedTags.tags, weights.enhancedTags * sources.enhancedTags.confidence);
    }

    return moodScores;
  }

  /**
   * Add tags to mood scores with fuzzy matching
   */
  addTagsToMoodScores(moodScores, tags, weight) {
    tags.forEach(tag => {
      const tagLower = tag.toLowerCase();
      
      // Direct category matching
      Object.entries(this.moodCategories).forEach(([mood, keywords]) => {
        keywords.forEach(keyword => {
          if (tagLower.includes(keyword) || keyword.includes(tagLower)) {
            moodScores[mood] += weight;
          }
        });
      });
    });
  }

  /**
   * Calculate unified energy score
   */
  calculateEnergyScore(sources) {
    let totalEnergy = 0;
    let totalWeight = 0;

    // Energy from LLM
    if (sources.llmEnhancement.energy) {
      const energyValue = this.energyLevels[sources.llmEnhancement.energy] || 3;
      const weight = sources.llmEnhancement.confidence;
      totalEnergy += energyValue * weight;
      totalWeight += weight;
    }

    // Energy from behavioral patterns
    if (sources.behavioralSignals.mood) {
      let energyValue = 3; // default medium
      switch (sources.behavioralSignals.mood) {
        case 'energetic': energyValue = 5; break;
        case 'peaceful': energyValue = 2; break;
        case 'focused': energyValue = 3; break;
        case 'happy': energyValue = 4; break;
      }
      const weight = sources.behavioralSignals.confidence;
      totalEnergy += energyValue * weight;
      totalWeight += weight;
    }

    // Default to medium if no energy data
    if (totalWeight === 0) return 3;

    return Math.round(totalEnergy / totalWeight);
  }

  /**
   * Calculate overall confidence in mood assessment
   */
  calculateConfidence(sources) {
    const sourceConfidences = [];
    
    if (sources.ysTags.confidence > 0) sourceConfidences.push(sources.ysTags.confidence);
    if (sources.behavioralSignals.confidence > 0) sourceConfidences.push(sources.behavioralSignals.confidence);
    if (sources.llmEnhancement.confidence > 0) sourceConfidences.push(sources.llmEnhancement.confidence);

    if (sourceConfidences.length === 0) return 0.1;

    // Higher confidence when multiple sources agree
    const avgConfidence = sourceConfidences.reduce((a, b) => a + b, 0) / sourceConfidences.length;
    const sourceBonus = Math.min(sourceConfidences.length * 0.1, 0.3);
    
    return Math.min(avgConfidence + sourceBonus, 1.0);
  }

  /**
   * Get primary mood from scores
   */
  getPrimaryMood(moodScores) {
    let maxScore = 0;
    let primaryMood = 'neutral';

    Object.entries(moodScores).forEach(([mood, score]) => {
      if (score > maxScore) {
        maxScore = score;
        primaryMood = mood;
      }
    });

    return { mood: primaryMood, score: maxScore };
  }

  /**
   * Generate human-readable reasoning
   */
  generateReasoning(sources, moodScores) {
    const reasons = [];
    
    if (sources.ysTags.tags.length > 0) {
      reasons.push(`YS tags: ${sources.ysTags.tags.slice(0, 3).join(', ')}`);
    }
    
    if (sources.behavioralSignals.mood) {
      reasons.push(`Behavioral: ${sources.behavioralSignals.reasoning}`);
    }
    
    if (sources.llmEnhancement.tags.length > 0) {
      reasons.push(`LLM: ${sources.llmEnhancement.reasoning}`);
    }

    const primaryMood = this.getPrimaryMood(moodScores);
    reasons.push(`Primary mood: ${primaryMood.mood} (score: ${primaryMood.score.toFixed(2)})`);

    return reasons.join('; ');
  }

  /**
   * Process multiple songs and create unified mood profiles
   */
  createUnifiedMoodProfiles(songs) {
    return songs.map(song => this.createUnifiedMoodProfile(song));
  }

  /**
   * Get mood distribution statistics
   */
  getMoodDistribution(unifiedProfiles) {
    const distribution = {};
    Object.keys(this.moodCategories).forEach(mood => {
      distribution[mood] = 0;
    });

    unifiedProfiles.forEach(profile => {
      const primaryMood = profile.unifiedMoodProfile.primaryMood.mood;
      if (distribution.hasOwnProperty(primaryMood)) {
        distribution[primaryMood]++;
      }
    });

    return {
      distribution,
      totalSongs: unifiedProfiles.length,
      averageConfidence: unifiedProfiles.reduce((sum, p) => sum + p.unifiedMoodProfile.confidence, 0) / unifiedProfiles.length
    };
  }
}

module.exports = MultiSourceMoodMapper;
