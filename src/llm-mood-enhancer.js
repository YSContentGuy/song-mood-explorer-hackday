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

    const system = `You are a music tagging assistant. Output concise JSON only.`;
    const user = `Infer mood tags for the song below. Return a JSON object with:
{
  "generatedTags": ["..."],
  "energyLevel": "very_low|low|medium|high|very_high",
  "moodCategory": "happy|sad|energetic|calm|romantic|nostalgic|focused|social|neutral",
  "confidence": 0..1,
  "reasoning": "one short sentence"
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
      temperature: 0.3
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
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.6,
      reasoning: parsed.reasoning || 'LLM-based inference',
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
