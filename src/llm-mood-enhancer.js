/**
 * LLM-based Mood Enhancement for Song Mood Explorer
 * Generates mood tags for songs with sparse metadata using AI
 */

const axios = require('axios');
require('dotenv').config();

class LLMMoodEnhancer {
  constructor() {
    this.cache = new Map(); // Cache LLM responses to avoid duplicate calls
    this.moodTagsGenerated = 0;
    // LLM config (optional). If OPENAI_API_KEY is set, we call OpenAI; otherwise we simulate.
    this.provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
    this.openaiApiKey = process.env.OPENAI_API_KEY || null;
    this.model = process.env.LLM_MODEL || 'gpt-4o-mini';
  }

  /**
   * Generate popularity assessment for a song using LLM
   * @param {Object} song - Song object with title and artist
   * @returns {Promise<Object>} Popularity assessment data
   */
  async generatePopularityAssessment(song) {
    const cacheKey = `popularity-${song.ARTIST_NAME}-${song.SONG_TITLE}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let popularityData;
      if (this.openaiApiKey && this.provider === 'openai') {
        popularityData = await this.generatePopularityAssessmentOpenAI(song);
      } else {
        // Simulate popularity assessment
        popularityData = await this.simulatePopularityAssessment(song);
      }
      
      // Cache the result
      this.cache.set(cacheKey, popularityData);
      
      return popularityData;
    } catch (error) {
      console.error(`Error generating popularity assessment for ${song.SONG_TITLE}:`, error);
      return this.getFallbackPopularityData();
    }
  }

  /**
   * Generate mood tags for a song using LLM
   * @param {Object} song - Song object with title and artist
   * @returns {Promise<Object>} Generated mood data
   */
  async generateMoodTags(song) {
    const cacheKey = `${song.ARTIST_NAME}-${song.SONG_TITLE}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let moodData;
      if (this.openaiApiKey && this.provider === 'openai') {
        moodData = await this.generateMoodTagsOpenAI(song);
      } else {
        // Simulate LLM call with realistic mood inference
        moodData = await this.simulateLLMCall(song);
      }
      
      // Cache the result
      this.cache.set(cacheKey, moodData);
      this.moodTagsGenerated++;
      
      return moodData;
    } catch (error) {
      console.error(`Error generating mood tags for ${song.SONG_TITLE}:`, error);
      return this.getFallbackMoodData();
    }
  }

  /**
   * Generate popularity assessment using OpenAI API
   * @param {Object} song - Song object
   * @returns {Promise<Object>} Popularity assessment data
   */
  async generatePopularityAssessmentOpenAI(song) {
    const artist = song.ARTIST_NAME || 'Unknown';
    const title = song.SONG_TITLE || 'Unknown';

    const systemPrompt = `You are a music industry expert. Assess the popularity and recognition level of songs and artists. Consider:
- Artist recognition (mainstream, indie, unknown)
- Song popularity (hit, well-known, cult classic, obscure)
- Cultural impact and recognition
- Commercial success indicators

Rate popularity on a scale of 0.0 to 1.0 where:
- 0.9-1.0: Global hits, household names (Beatles, Taylor Swift, etc.)
- 0.7-0.8: Very popular, widely recognized (major artists, chart hits)
- 0.5-0.6: Moderately popular, some recognition (indie hits, regional success)
- 0.3-0.4: Niche popularity, limited recognition (underground, specialized genres)
- 0.1-0.2: Very limited recognition (local artists, very obscure)
- 0.0-0.1: Essentially unknown (demo tracks, learning exercises)`;

    const userPrompt = `Assess the popularity of:
Song: "${title}"
Artist: "${artist}"

Return a JSON object with:
{
  "artistRecognition": 0.0-1.0,
  "songPopularity": 0.0-1.0,
  "overallPopularity": 0.0-1.0,
  "recognitionLevel": "global_hit|very_popular|moderately_popular|niche|limited|unknown",
  "reasoning": "brief explanation of the assessment"
}`;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    }, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    const content = response.data.choices[0].message.content.trim();
    
    try {
      // Extract JSON from markdown code blocks if present
      const jsonContent = this.extractJSONFromMarkdown(content);
      const parsed = JSON.parse(jsonContent);
      return {
        artistRecognition: parsed.artistRecognition || 0.5,
        songPopularity: parsed.songPopularity || 0.5,
        overallPopularity: parsed.overallPopularity || 0.5,
        recognitionLevel: parsed.recognitionLevel || 'moderately_popular',
        reasoning: parsed.reasoning || 'Standard assessment',
        source: 'openai'
      };
    } catch (parseError) {
      console.warn(`Failed to parse popularity assessment for ${title}:`, parseError);
      return this.getFallbackPopularityData();
    }
  }

  /**
   * Call OpenAI Chat Completions to infer mood tags for a song.
   */
  async generateMoodTagsOpenAI(song) {
    const artist = song.ARTIST_NAME || 'Unknown';
    const title = song.SONG_TITLE || 'Unknown';
    const bpm = song.QUARTER_NOTES_PER_MINUTE || song.BEATS_PER_MINUTE || '';
    const duration = song['MAX(EXERCISE_LENGTH)'] || '';
    const key = song.SONG_KEY_ROOT || '';
    const mode = song.SONG_KEY_MODE || '';
    const playCount = song.PLAY_COUNT || 0;
    const pitchRange = (parseInt(song.HIGHEST_PITCH) || 0) - (parseInt(song.LOWEST_PITCH) || 0);
    
    // Key signature mood hints
    const keyMoodHint = mode === 'major' ? 'Generally more uplifting/positive' : 
                       mode === 'minor' ? 'Generally more emotional/melancholic' : '';

    const system = `You are a music mood analysis expert with deep knowledge of how music affects human emotions and psychology. Analyze songs comprehensively to provide rich, nuanced mood tags that capture the emotional essence, energy, and psychological impact of the music. Consider both musical elements and emotional responses.`;
    
    const user = `Analyze this song for comprehensive mood and emotional characteristics. Consider:
- Emotional impact (how it makes listeners feel)
- Energy and intensity level  
- Psychological effects (motivating, calming, energizing, etc.)
- Social context (party music, introspective, romantic, etc.)
- Temporal feel (nostalgic, futuristic, timeless)
- Musical elements (tempo, key, pitch range, popularity)

Return a JSON object with:
{
  "generatedTags": ["primary_mood", "secondary_mood", "energy_descriptor", "emotional_tone", "context_tag"],
  "energyLevel": "very_low|low|medium|high|very_high",
  "moodCategory": "happy|sad|energetic|calm|romantic|nostalgic|focused|social|neutral|uplifting|melancholic|aggressive|peaceful|motivating|introspective",
  "psychologicalEffect": "motivating|calming|energizing|introspective|social|romantic|nostalgic|rebellious|confident|vulnerable|playful|serious",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation of the mood analysis and why these tags were chosen"
}

Song: ${title}
Artist: ${artist}
Tempo_BPM: ${bpm}
Duration_sec: ${duration}
Key: ${key} ${mode}${keyMoodHint ? ` (${keyMoodHint})` : ''}
Pitch_Range: ${pitchRange} semitones
Popularity: ${playCount} plays
${song.GENRES ? `Genres: ${song.GENRES}` : ''}
${song.TAGS ? `Tags: ${song.TAGS}` : ''}`;

    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2,
      max_tokens: 500
    };

    const resp = await axios.post('https://api.openai.com/v1/chat/completions', body, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const content = resp?.data?.choices?.[0]?.message?.content || '';
    const parsed = this.parseLLMJson(content);
    if (!parsed) {
      throw new Error('Failed to parse LLM JSON');
    }

    // Normalize fields
    const allowedEnergy = ['very_low', 'low', 'medium', 'high', 'very_high'];
    const allowedMood = ['happy','sad','energetic','calm','romantic','nostalgic','focused','social','neutral'];
    if (!allowedEnergy.includes(parsed.energyLevel)) parsed.energyLevel = 'medium';
    if (!allowedMood.includes(parsed.moodCategory)) parsed.moodCategory = 'neutral';

    return {
      generatedTags: Array.isArray(parsed.generatedTags) ? parsed.generatedTags : [],
      energyLevel: parsed.energyLevel,
      moodCategory: parsed.moodCategory,
      psychologicalEffect: parsed.psychologicalEffect || 'neutral',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.8,
      reasoning: parsed.reasoning || 'Enhanced LLM-based inference',
      source: 'openai'
    };
  }

  /**
   * Extract JSON from a potentially verbose LLM response.
   */
  parseLLMJson(text) {
    if (!text) return null;
    // Try direct JSON
    try { return JSON.parse(text); } catch (_) {}
    // Try to find a JSON block
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (_) {}
    }
    return null;
  }

  /**
   * Generate personalized recommendation explanation using LLM
   * @param {Object} song - Recommended song
   * @param {Object} userProfile - User's profile and preferences
   * @param {Object} context - Current context (mood, time, goals)
   * @returns {Promise<Object>} AI-generated explanation
   */
  async generateRecommendationExplanation(song, userProfile, context) {
    try {
      if (!this.openaiApiKey) {
        return this.getFallbackExplanation(song, userProfile, context);
      }

      const system = `You are a personalized music recommendation assistant. Create engaging, personalized explanations for why a song is perfect for a specific user. Be conversational, encouraging, and specific about the match.`;
      
      const user = `Explain why "${song.SONG_TITLE}" by ${song.ARTIST_NAME} is perfect for this user:

USER PROFILE:
- Name: ${userProfile.name}
- Skill Level: ${userProfile.skillLevel}/10
- Genre Preferences: ${userProfile.genrePreferences.join(', ')}
- Experience: ${userProfile.playingExperience}
- Goals: ${userProfile.learningGoals.join(', ')}

CURRENT CONTEXT:
- Mood: ${context.mood}
- Time of Day: ${context.timeOfDay}
- Available Time: ${context.availableTime} minutes
- Goals: ${context.goals}

SONG DETAILS:
- Genre: ${song.genre_tags?.join(', ') || 'Various'}
- Difficulty: ${song.difficulty_level}/10
- Energy Level: ${song.energy_level}
- Style Tags: ${song.style_tags?.join(', ') || 'N/A'}

Return a JSON object with:
{
  "explanation": "2-3 sentence personalized explanation of why this song is perfect",
  "confidence": 0.0-1.0,
  "reasoning": "brief technical reasoning"
}`;

      const body = {
        model: this.model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.7
      };

      const resp = await axios.post('https://api.openai.com/v1/chat/completions', body, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      const content = resp?.data?.choices?.[0]?.message?.content || '';
      const parsed = this.parseLLMJson(content);
      
      return {
        explanation: parsed?.explanation || this.getFallbackExplanation(song, userProfile, context).explanation,
        confidence: parsed?.confidence || 0.8,
        reasoning: parsed?.reasoning || 'AI-generated personalized explanation',
        source: 'openai'
      };
    } catch (error) {
      console.warn(`Error generating explanation for ${song.SONG_TITLE}:`, error.message);
      return this.getFallbackExplanation(song, userProfile, context);
    }
  }

  /**
   * Fallback explanation when LLM is unavailable
   */
  getFallbackExplanation(song, userProfile, context) {
    const skillMatch = Math.abs(song.difficulty_level - userProfile.skillLevel) <= 2;
    const genreMatch = song.genre_tags?.some(genre => userProfile.genrePreferences.includes(genre));
    
    let explanation = `"${song.SONG_TITLE}" is a great choice for your ${context.mood} ${context.timeOfDay} practice session.`;
    
    if (skillMatch) {
      explanation += ` The ${song.difficulty_level}/10 difficulty level matches your ${userProfile.skillLevel}/10 skill perfectly.`;
    }
    
    if (genreMatch) {
      explanation += ` It's ${song.genre_tags?.join(' and ')} music, which aligns with your preferences.`;
    }
    
    return {
      explanation,
      confidence: 0.7,
      reasoning: 'Fallback explanation based on skill and genre matching',
      source: 'fallback'
    };
  }

  /**
   * Simulate LLM call with realistic mood inference
   * In production, this would call ChatGPT/Claude API
   */
  async simulateLLMCall(song) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const artist = song.ARTIST_NAME || 'Unknown';
    const title = song.SONG_TITLE || 'Unknown';
    
    // Rule-based mood inference based on artist/title patterns
    const moodInference = this.inferMoodFromTitleAndArtist(artist, title);
    
    return {
      generatedTags: moodInference.tags,
      energyLevel: moodInference.energy,
      moodCategory: moodInference.mood,
      confidence: moodInference.confidence,
      reasoning: moodInference.reasoning,
      source: 'llm_simulation'
    };
  }

  /**
   * Simulate popularity assessment for songs
   * @param {Object} song - Song object
   * @returns {Promise<Object>} Simulated popularity data
   */
  async simulatePopularityAssessment(song) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const artist = song.ARTIST_NAME || 'Unknown';
    const title = song.SONG_TITLE || 'Unknown';
    
    // Rule-based popularity inference
    const popularityInference = this.inferPopularityFromTitleAndArtist(artist, title);
    
    return {
      artistRecognition: popularityInference.artistRecognition,
      songPopularity: popularityInference.songPopularity,
      overallPopularity: popularityInference.overallPopularity,
      recognitionLevel: popularityInference.recognitionLevel,
      reasoning: popularityInference.reasoning,
      source: 'llm_simulation'
    };
  }

  /**
   * Infer popularity from song title and artist using pattern matching
   */
  inferPopularityFromTitleAndArtist(artist, title) {
    const titleLower = title.toLowerCase();
    const artistLower = artist.toLowerCase();
    
    // Well-known artists (high recognition)
    const famousArtists = [
      'van morrison', 'moby', 'hanson', 'zendaya', 'georges brassens',
      'beatles', 'rolling stones', 'led zeppelin', 'pink floyd', 'queen',
      'taylor swift', 'ed sheeran', 'adele', 'beyonce', 'drake',
      'coldplay', 'radiohead', 'nirvana', 'oasis', 'u2'
    ];
    
    // Yousician artists (learning-focused, lower recognition)
    const yousicianArtists = ['yousician', 'the yousicians'];
    
    // Check if it's a Yousician song
    if (yousicianArtists.some(ys => artistLower.includes(ys))) {
      return {
        artistRecognition: 0.1,
        songPopularity: 0.1,
        overallPopularity: 0.1,
        recognitionLevel: 'unknown',
        reasoning: 'Yousician learning song - designed for practice, not commercial popularity'
      };
    }
    
    // Check for famous artists
    const isFamousArtist = famousArtists.some(famous => artistLower.includes(famous));
    
    if (isFamousArtist) {
      return {
        artistRecognition: 0.8,
        songPopularity: 0.7,
        overallPopularity: 0.75,
        recognitionLevel: 'very_popular',
        reasoning: 'Well-known artist with commercial recognition'
      };
    }
    
    // Default to moderate popularity for other commercial songs
    return {
      artistRecognition: 0.4,
      songPopularity: 0.3,
      overallPopularity: 0.35,
      recognitionLevel: 'niche',
      reasoning: 'Commercial song with moderate recognition'
    };
  }

  /**
   * Extract JSON from markdown code blocks or return content as-is
   * @param {string} content - Content that may contain markdown-wrapped JSON
   * @returns {string} Extracted JSON string
   */
  extractJSONFromMarkdown(content) {
    // Check if content is wrapped in markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    
    // Check for other common patterns
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      return content.substring(jsonStart, jsonEnd + 1);
    }
    
    // Return content as-is if no patterns found
    return content;
  }

  /**
   * Get fallback popularity data when LLM fails
   */
  getFallbackPopularityData() {
    return {
      artistRecognition: 0.5,
      songPopularity: 0.5,
      overallPopularity: 0.5,
      recognitionLevel: 'moderately_popular',
      reasoning: 'Standard fallback assessment',
      source: 'fallback'
    };
  }

  /**
   * Infer mood from song title and artist using pattern matching
   */
  inferMoodFromTitleAndArtist(artist, title) {
    const titleLower = title.toLowerCase();
    const artistLower = artist.toLowerCase();
    
    // Emotional keywords in titles
    const moodPatterns = {
      happy: {
        keywords: ['happy', 'joy', 'smile', 'sunshine', 'bright', 'celebration', 'party', 'dance', 'fun'],
        tags: ['upbeat', 'positive', 'energetic', 'happy'],
        energy: 'high',
        confidence: 0.8
      },
      sad: {
        keywords: ['sad', 'cry', 'tears', 'lonely', 'blue', 'goodbye', 'lost', 'broken', 'hurt'],
        tags: ['melancholic', 'sad', 'emotional', 'introspective'],
        energy: 'low',
        confidence: 0.8
      },
      romantic: {
        keywords: ['love', 'heart', 'kiss', 'romance', 'together', 'forever', 'baby', 'honey', 'darling'],
        tags: ['romantic', 'gentle', 'warm', 'intimate'],
        energy: 'medium',
        confidence: 0.7
      },
      energetic: {
        keywords: ['rock', 'power', 'fire', 'energy', 'wild', 'crazy', 'loud', 'fast', 'run'],
        tags: ['energetic', 'powerful', 'intense', 'driving'],
        energy: 'very_high',
        confidence: 0.7
      },
      peaceful: {
        keywords: ['peace', 'calm', 'quiet', 'still', 'gentle', 'soft', 'whisper', 'dream', 'sleep'],
        tags: ['peaceful', 'calm', 'gentle', 'dreamy'],
        energy: 'very_low',
        confidence: 0.7
      },
      nostalgic: {
        keywords: ['memory', 'remember', 'yesterday', 'old', 'time', 'past', 'again', 'back'],
        tags: ['nostalgic', 'reflective', 'wistful', 'emotional'],
        energy: 'medium',
        confidence: 0.6
      }
    };

    // Genre-based inference from artist names
    const artistPatterns = {
      rock: {
        keywords: ['rock', 'metal', 'punk', 'grunge'],
        tags: ['powerful', 'aggressive', 'energetic'],
        energy: 'high',
        confidence: 0.6
      },
      folk: {
        keywords: ['folk', 'acoustic', 'country'],
        tags: ['gentle', 'storytelling', 'warm'],
        energy: 'medium',
        confidence: 0.6
      },
      jazz: {
        keywords: ['jazz', 'blues', 'swing'],
        tags: ['sophisticated', 'smooth', 'cool'],
        energy: 'medium',
        confidence: 0.6
      }
    };

    // Check title patterns
    for (const [mood, pattern] of Object.entries(moodPatterns)) {
      for (const keyword of pattern.keywords) {
        if (titleLower.includes(keyword)) {
          return {
            mood,
            tags: pattern.tags,
            energy: pattern.energy,
            confidence: pattern.confidence,
            reasoning: `Title contains "${keyword}" suggesting ${mood} mood`
          };
        }
      }
    }

    // Check artist patterns
    for (const [genre, pattern] of Object.entries(artistPatterns)) {
      for (const keyword of pattern.keywords) {
        if (artistLower.includes(keyword)) {
          return {
            mood: genre,
            tags: pattern.tags,
            energy: pattern.energy,
            confidence: pattern.confidence,
            reasoning: `Artist name suggests ${genre} genre characteristics`
          };
        }
      }
    }

    // Default neutral inference
    return {
      mood: 'neutral',
      tags: ['moderate', 'balanced'],
      energy: 'medium',
      confidence: 0.3,
      reasoning: 'No clear mood indicators found, using neutral classification'
    };
  }

  /**
   * Enhance songs with missing or sparse metadata
   */
  async enhanceSongsWithLLM(songs, options = {}) {
    const { 
      maxSongs = 100, 
      onlySparseTags = true,
      progressCallback = null 
    } = options;

    const songsToEnhance = songs.filter(song => {
      if (!onlySparseTags) return true;
      
      // Consider song to have sparse tags if TAGS or GENRES are empty/minimal
      const tags = song.TAGS || '';
      const genres = song.GENRES || '';
      
      return tags.length < 10 || genres.length < 10;
    }).slice(0, maxSongs);

    console.log(`Enhancing ${songsToEnhance.length} songs with LLM-generated mood tags...`);

    const enhancedSongs = [];
    
    for (let i = 0; i < songsToEnhance.length; i++) {
      const song = songsToEnhance[i];
      
      try {
        const moodData = await this.generateMoodTags(song);
        
        const enhancedSong = {
          ...song,
          llmEnhancement: moodData,
          enhancedTags: this.mergeTags(song.TAGS, moodData.generatedTags),
          enhancedEnergyLevel: moodData.energyLevel
        };
        
        enhancedSongs.push(enhancedSong);
        
        if (progressCallback && (i + 1) % 10 === 0) {
          progressCallback(i + 1, songsToEnhance.length);
        }
      } catch (error) {
        console.error(`Failed to enhance song ${song.SONG_TITLE}:`, error);
        enhancedSongs.push(song); // Add original song if enhancement fails
      }
    }

    console.log(`Successfully enhanced ${this.moodTagsGenerated} songs with LLM mood tags`);
    return enhancedSongs;
  }

  /**
   * Merge existing tags with LLM-generated tags
   */
  mergeTags(existingTags, generatedTags) {
    const existing = this.parseTags(existingTags);
    const generated = Array.isArray(generatedTags) ? generatedTags : [];
    
    // Combine and deduplicate
    const combined = [...existing, ...generated];
    return [...new Set(combined)];
  }

  /**
   * Parse tags from various formats (JSON array, comma-separated, etc.)
   */
  parseTags(tagsString) {
    if (!tagsString || tagsString.trim() === '') return [];
    
    try {
      // Try parsing as JSON array
      if (tagsString.trim().startsWith('[')) {
        const parsed = JSON.parse(tagsString);
        return Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      // Not JSON, try other formats
    }
    
    // Try comma-separated
    if (tagsString.includes(',')) {
      return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    
    // Single tag
    return [tagsString.trim()];
  }

  /**
   * Get fallback mood data when LLM fails
   */
  getFallbackMoodData() {
    return {
      generatedTags: ['unknown'],
      energyLevel: 'medium',
      moodCategory: 'neutral',
      confidence: 0.1,
      reasoning: 'LLM enhancement failed, using fallback',
      source: 'fallback'
    };
  }

  /**
   * Get enhancement statistics
   */
  getStats() {
    return {
      totalEnhanced: this.moodTagsGenerated,
      cacheSize: this.cache.size,
      cacheHitRate: this.cache.size > 0 ? (this.cache.size / this.moodTagsGenerated) : 0
    };
  }

  /**
   * Clear cache to free memory
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = LLMMoodEnhancer;
