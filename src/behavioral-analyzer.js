/**
 * Behavioral Signal Analysis for Song Mood Explorer
 * Analyzes play patterns to identify "comfort zone" vs "challenge" songs
 */

const fs = require('fs');
const path = require('path');

class BehavioralAnalyzer {
  constructor() {
    this.songs = [];
    this.behavioralProfiles = new Map();
  }

  /**
   * Load and parse the YS dataset
   */
  async loadYSDataset(csvPath = 'data/yousician_songs.csv') {
    try {
      const fullPath = path.join(process.cwd(), csvPath);
      const csvData = fs.readFileSync(fullPath, 'utf8');
      
      // Parse CSV with proper handling of multiline quoted fields
      const records = this.parseCSV(csvData);
      
      if (records.length === 0) {
        throw new Error('No data found in CSV file');
      }
      
      const headers = records[0];
      this.songs = [];
      
      for (let i = 1; i < records.length; i++) {
        const values = records[i];
        if (values.length >= headers.length) {
          const song = this.createSongObject(headers, values);
          if (song.SONG_ID && song.SONG_TITLE) {
            this.songs.push(song);
          }
        }
      }
      
      console.log(`Loaded ${this.songs.length} songs from YS dataset`);
      return this.songs;
    } catch (error) {
      console.error('Error loading YS dataset:', error);
      throw error;
    }
  }

  /**
   * Parse CSV with proper handling of multiline quoted fields
   */
  parseCSV(csvData) {
    const records = [];
    const lines = csvData.split('\n');
    let currentRecord = [];
    let currentField = '';
    let inQuotes = false;
    let recordComplete = false;
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          currentRecord.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      
      // Add newline if we're inside quotes (multiline field)
      if (inQuotes) {
        currentField += '\n';
      } else {
        // End of record
        currentRecord.push(currentField.trim());
        if (currentRecord.length > 0 && currentRecord.some(field => field.length > 0)) {
          records.push(currentRecord);
        }
        currentRecord = [];
        currentField = '';
      }
    }
    
    // Handle last record if not completed
    if (currentRecord.length > 0 || currentField.length > 0) {
      if (currentField.length > 0) {
        currentRecord.push(currentField.trim());
      }
      if (currentRecord.some(field => field.length > 0)) {
        records.push(currentRecord);
      }
    }
    
    return records;
  }

  /**
   * Create song object from CSV data
   */
  createSongObject(headers, values) {
    const song = {};
    
    for (let i = 0; i < headers.length && i < values.length; i++) {
      const header = headers[i].trim();
      let value = values[i].trim();
      
      // Parse numeric fields
      if (['CUMULATIVE_PLAY_TIME', 'PLAY_COUNT', 'BEATS_PER_MINUTE', 'QUARTER_NOTES_PER_MINUTE'].includes(header)) {
        value = parseFloat(value) || 0;
      }
      
      // Parse array fields
      if (header === 'AVAILABLE_ARRAGEMENTS' && value.startsWith('[')) {
        try {
          value = JSON.parse(value.replace(/"/g, '"'));
        } catch (e) {
          value = [];
        }
      }
      
      song[header] = value;
    }
    
    return song;
  }

  /**
   * Calculate behavioral signals for comfort zone vs challenge classification
   */
  calculateBehavioralSignals(song) {
    const playTime = song.CUMULATIVE_PLAY_TIME || 0;
    const playCount = song.PLAY_COUNT || 0;
    const exerciseLength = song['MAX(EXERCISE_LENGTH)'] || 0;
    
    // Avoid division by zero
    if (playCount === 0 || exerciseLength === 0) {
      return {
        engagementRatio: 0,
        averageSessionLength: 0,
        completionRate: 0,
        behavioralType: 'unknown',
        confidence: 0
      };
    }
    
    // Key behavioral metrics
    const averageSessionLength = playTime / playCount;
    const completionRate = averageSessionLength / exerciseLength;
    const engagementRatio = playTime / exerciseLength; // Total engagement vs song length
    
    // Classify behavioral type
    let behavioralType = 'unknown';
    let confidence = 0;
    
    if (playCount >= 2 && completionRate > 0.8) {
      // High replay + high completion = comfort zone
      behavioralType = 'comfort_zone';
      confidence = Math.min(0.9, (playCount - 1) * 0.2 + completionRate * 0.5);
    } else if (playCount === 1 && completionRate < 0.5) {
      // Single play + low completion = challenge/abandoned
      behavioralType = 'challenge_abandoned';
      confidence = (1 - completionRate) * 0.7;
    } else if (playCount === 1 && completionRate > 0.8) {
      // Single play + high completion = appropriate difficulty
      behavioralType = 'appropriate_challenge';
      confidence = completionRate * 0.6;
    } else if (playCount >= 2 && completionRate < 0.6) {
      // Multiple attempts + low completion = persistent challenge
      behavioralType = 'persistent_challenge';
      confidence = Math.min(0.8, playCount * 0.1 + (1 - completionRate) * 0.4);
    }
    
    return {
      engagementRatio: Math.round(engagementRatio * 100) / 100,
      averageSessionLength: Math.round(averageSessionLength * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      behavioralType,
      confidence: Math.round(confidence * 100) / 100,
      playCount,
      totalPlayTime: playTime
    };
  }

  /**
   * Analyze all songs and generate behavioral profiles
   */
  analyzeBehavioralPatterns() {
    const analysis = {
      totalSongs: this.songs.length,
      behavioralTypes: {},
      engagementStats: {
        high: 0,
        medium: 0,
        low: 0,
        none: 0
      },
      insights: []
    };
    
    this.songs.forEach(song => {
      const signals = this.calculateBehavioralSignals(song);
      
      // Store behavioral profile
      this.behavioralProfiles.set(song.SONG_ID, {
        ...song,
        behavioralSignals: signals
      });
      
      // Aggregate statistics
      const type = signals.behavioralType;
      analysis.behavioralTypes[type] = (analysis.behavioralTypes[type] || 0) + 1;
      
      // Engagement categorization
      if (signals.engagementRatio === 0) {
        analysis.engagementStats.none++;
      } else if (signals.engagementRatio < 1) {
        analysis.engagementStats.low++;
      } else if (signals.engagementRatio < 3) {
        analysis.engagementStats.medium++;
      } else {
        analysis.engagementStats.high++;
      }
    });
    
    // Generate insights
    const comfortZoneCount = analysis.behavioralTypes.comfort_zone || 0;
    const challengeCount = (analysis.behavioralTypes.challenge_abandoned || 0) + 
                          (analysis.behavioralTypes.persistent_challenge || 0);
    
    analysis.insights.push(
      `${comfortZoneCount} songs (${Math.round(comfortZoneCount/analysis.totalSongs*100)}%) show comfort zone behavior`,
      `${challengeCount} songs (${Math.round(challengeCount/analysis.totalSongs*100)}%) show challenge behavior`,
      `${analysis.engagementStats.high} songs have high engagement (3+ replays worth)`,
      `${analysis.engagementStats.none} songs have no play data`
    );
    
    return analysis;
  }

  /**
   * Get mood inference based on behavioral patterns
   */
  inferMoodFromBehavior(song) {
    const profile = this.behavioralProfiles.get(song.SONG_ID);
    if (!profile || !profile.behavioralSignals) {
      return { mood: 'unknown', confidence: 0, reasoning: 'No behavioral data' };
    }
    
    const signals = profile.behavioralSignals;
    
    switch (signals.behavioralType) {
      case 'comfort_zone':
        return {
          mood: 'familiar_positive',
          confidence: signals.confidence,
          reasoning: `High replay (${signals.playCount}x) + completion (${Math.round(signals.completionRate*100)}%) suggests comfort/enjoyment`
        };
        
      case 'challenge_abandoned':
        return {
          mood: 'challenging_negative',
          confidence: signals.confidence,
          reasoning: `Single attempt with ${Math.round(signals.completionRate*100)}% completion suggests difficulty/frustration`
        };
        
      case 'appropriate_challenge':
        return {
          mood: 'engaging_positive',
          confidence: signals.confidence,
          reasoning: `Single complete playthrough suggests appropriate difficulty and satisfaction`
        };
        
      case 'persistent_challenge':
        return {
          mood: 'determined_challenging',
          confidence: signals.confidence,
          reasoning: `Multiple attempts (${signals.playCount}x) despite difficulty suggests determination/growth mindset`
        };
        
      default:
        return {
          mood: 'neutral',
          confidence: 0.3,
          reasoning: 'Insufficient behavioral data for mood inference'
        };
    }
  }

  /**
   * Get songs by behavioral type
   */
  getSongsByBehavioralType(type, limit = 10) {
    return Array.from(this.behavioralProfiles.values())
      .filter(profile => profile.behavioralSignals.behavioralType === type)
      .sort((a, b) => b.behavioralSignals.confidence - a.behavioralSignals.confidence)
      .slice(0, limit);
  }

  /**
   * Get behavioral insights for a specific song
   */
  getSongBehavioralInsights(songId) {
    const profile = this.behavioralProfiles.get(songId);
    if (!profile) return null;
    
    const moodInference = this.inferMoodFromBehavior(profile);
    
    return {
      song: {
        id: profile.SONG_ID,
        title: profile.SONG_TITLE,
        artist: profile.ARTIST_NAME
      },
      behavioralSignals: profile.behavioralSignals,
      moodInference,
      recommendations: this.generateRecommendations(profile)
    };
  }

  /**
   * Generate recommendations based on behavioral patterns
   */
  generateRecommendations(profile) {
    const signals = profile.behavioralSignals;
    const recommendations = [];
    
    if (signals.behavioralType === 'comfort_zone') {
      recommendations.push('Consider similar songs for consistent positive experience');
      recommendations.push('Good candidate for relaxation/confidence-building sessions');
    } else if (signals.behavioralType === 'challenge_abandoned') {
      recommendations.push('May need easier arrangement or more practice time');
      recommendations.push('Consider revisiting after skill improvement');
    } else if (signals.behavioralType === 'persistent_challenge') {
      recommendations.push('Shows growth mindset - good for skill development sessions');
      recommendations.push('Consider similar difficulty level for continued challenge');
    }
    
    return recommendations;
  }
}

module.exports = BehavioralAnalyzer;
