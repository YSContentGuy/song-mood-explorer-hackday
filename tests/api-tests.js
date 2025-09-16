/**
 * Comprehensive API test suite for Song Mood Explorer
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class APITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    try {
      console.log(`🧪 Running: ${name}`);
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ ${name} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ ${name} - FAILED: ${error.message}`);
    }
  }

  async testHealthCheck() {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) throw new Error('Health check failed');
    if (!response.data.status || response.data.status !== 'OK') {
      throw new Error('Health check returned invalid status');
    }
  }

  async testDemoSongs() {
    const response = await axios.get(`${BASE_URL}/api/demo/songs`);
    if (response.status !== 200) throw new Error('Demo songs endpoint failed');
    if (!response.data.songs || !Array.isArray(response.data.songs)) {
      throw new Error('Demo songs should return array of songs');
    }
    if (response.data.count !== 17) {
      throw new Error(`Expected 17 songs, got ${response.data.count}`);
    }
  }

  async testDemoUsers() {
    const response = await axios.get(`${BASE_URL}/api/demo/users`);
    if (response.status !== 200) throw new Error('Demo users endpoint failed');
    if (!response.data.users || response.data.users.length !== 3) {
      throw new Error('Expected 3 demo users');
    }
  }

  async testDemoContexts() {
    const response = await axios.get(`${BASE_URL}/api/demo/contexts`);
    if (response.status !== 200) throw new Error('Demo contexts endpoint failed');
    if (!response.data.contexts || response.data.contexts.length !== 4) {
      throw new Error('Expected 4 demo contexts');
    }
  }

  async testDatasetStats() {
    const response = await axios.get(`${BASE_URL}/api/demo/dataset-stats`);
    if (response.status !== 200) throw new Error('Dataset stats endpoint failed');
    if (!response.data.stats || !response.data.stats.totalSongs) {
      throw new Error('Dataset stats should include totalSongs');
    }
    if (response.data.stats.totalSongs !== 17) {
      throw new Error(`Expected 17 total songs, got ${response.data.stats.totalSongs}`);
    }
  }

  async testContextualFlow() {
    const response = await axios.get(`${BASE_URL}/api/demo/contextual-flow`);
    if (response.status !== 200) throw new Error('Contextual flow endpoint failed');
    if (!response.data.recommendations || !Array.isArray(response.data.recommendations)) {
      throw new Error('Contextual flow should return recommendations array');
    }
    if (!response.data.demo_user || !response.data.demo_context) {
      throw new Error('Contextual flow should include demo user and context');
    }
  }

  async testSongFiltering() {
    const response = await axios.get(`${BASE_URL}/api/songs?genre=rock&difficulty_min=3`);
    if (response.status !== 200) throw new Error('Song filtering endpoint failed');
    if (!response.data.songs || !Array.isArray(response.data.songs)) {
      throw new Error('Song filtering should return songs array');
    }
    
    // Verify filtering worked
    const rockSongs = response.data.songs.filter(song => 
      song.genre_tags && song.genre_tags.includes('rock') && song.difficulty_level >= 3
    );
    if (rockSongs.length === 0) {
      throw new Error('No rock songs with difficulty >= 3 found');
    }
  }

  async testContextualRecommendations() {
    const requestBody = {
      userProfile: {
        skillLevel: 5,
        instrument: "guitar",
        genrePreferences: ["rock", "alternative"],
        preferredDifficulty: [4, 5, 6]
      },
      context: {
        timeOfDay: "evening",
        mood: "relaxed",
        availableTime: 30,
        goals: "relax",
        exploreNewMoods: false
      }
    };

    const response = await axios.post(`${BASE_URL}/api/mood/contextual-recommendations`, requestBody);
    if (response.status !== 200) throw new Error('Contextual recommendations endpoint failed');
    if (!response.data.recommendations || !Array.isArray(response.data.recommendations)) {
      throw new Error('Should return recommendations array');
    }
    
    // Verify scoring breakdown exists
    const firstRec = response.data.recommendations[0];
    if (!firstRec.scoringBreakdown) {
      throw new Error('Recommendations should include scoring breakdown');
    }
    if (!firstRec.contextualScore) {
      throw new Error('Recommendations should include contextual score');
    }
  }

  async testMoodPatterns() {
    const response = await axios.get(`${BASE_URL}/api/mood/patterns?user_id=user_intermediate`);
    if (response.status !== 200) throw new Error('Mood patterns endpoint failed');
    if (!response.data.patterns) {
      throw new Error('Should return mood patterns');
    }
  }

  async testInputValidation() {
    // Test invalid user profile
    try {
      await axios.post(`${BASE_URL}/api/mood/contextual-recommendations`, {
        userProfile: { skillLevel: 15 }, // Invalid skill level
        context: { mood: "happy" }
      });
      throw new Error('Should have rejected invalid skill level');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Expected validation error
      } else {
        throw error;
      }
    }

    // Test invalid context
    try {
      await axios.post(`${BASE_URL}/api/mood/contextual-recommendations`, {
        userProfile: { skillLevel: 5 },
        context: { timeOfDay: "invalid_time" } // Invalid time
      });
      throw new Error('Should have rejected invalid time of day');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // Expected validation error
      } else {
        throw error;
      }
    }
  }

  async testErrorHandling() {
    // Test non-existent endpoint
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      throw new Error('Should have returned 404 for non-existent endpoint');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Expected 404 error
      } else {
        throw error;
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting API Test Suite\n');

    await this.runTest('Health Check', () => this.testHealthCheck());
    await this.runTest('Demo Songs Endpoint', () => this.testDemoSongs());
    await this.runTest('Demo Users Endpoint', () => this.testDemoUsers());
    await this.runTest('Demo Contexts Endpoint', () => this.testDemoContexts());
    await this.runTest('Dataset Stats Endpoint', () => this.testDatasetStats());
    await this.runTest('Contextual Flow Demo', () => this.testContextualFlow());
    await this.runTest('Song Filtering', () => this.testSongFiltering());
    await this.runTest('Contextual Recommendations', () => this.testContextualRecommendations());
    await this.runTest('Mood Patterns', () => this.testMoodPatterns());
    await this.runTest('Input Validation', () => this.testInputValidation());
    await this.runTest('Error Handling', () => this.testErrorHandling());

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests.filter(t => t.status === 'FAILED').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }

    return this.results;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new APITester();
  tester.runAllTests().then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = APITester;
