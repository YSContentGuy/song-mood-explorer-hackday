/**
 * Comprehensive test of the Multi-Source Mood Mapping System
 * Tests integration of YS tags, behavioral signals, and LLM enhancement
 */

const YousicianClient = require('./src/yousician-client');

async function testMultiSourceMoodSystem() {
  console.log('🎵 Testing Multi-Source Mood Mapping System\n');
  
  const client = new YousicianClient();
  await client.ensureDatasetLoaded();
  
  // Test 1: Get songs with rich YS metadata and behavioral signals
  console.log('📊 Step 1: Finding songs with rich metadata...');
  const comfortZoneSongs = client.datasetLoader.getSongsByBehavioralType('comfort_zone', 3);
  const challengeSongs = client.datasetLoader.getSongsByBehavioralType('persistent_challenge', 2);
  
  const richMetadataSongs = [...comfortZoneSongs, ...challengeSongs].filter(song => {
    const tags = song.TAGS || '';
    const genres = song.GENRES || '';
    return tags.length > 10 && genres.length > 10; // Has meaningful YS metadata
  });
  
  console.log(`Found ${richMetadataSongs.length} songs with rich YS metadata and behavioral signals`);
  richMetadataSongs.forEach(song => {
    console.log(`  - "${song.SONG_TITLE}" by ${song.ARTIST_NAME}`);
    console.log(`    YS Tags: ${song.TAGS.replace(/\n/g, ' ')}`);
    console.log(`    Behavioral: ${song.behavioralSignals?.behavioralType} (confidence: ${song.behavioralSignals?.confidence})`);
  });
  
  // Test 2: Enhance these songs with LLM
  console.log('\n🤖 Step 2: Adding LLM mood enhancement...');
  const enhancedSongs = await client.datasetLoader.llmMoodEnhancer.enhanceSongsWithLLM(
    richMetadataSongs, 
    { maxSongs: richMetadataSongs.length, onlySparseTags: false }
  );
  
  console.log(`Enhanced ${enhancedSongs.length} songs with LLM-generated mood tags`);
  
  // Test 3: Create unified mood profiles
  console.log('\n🎯 Step 3: Creating unified mood profiles...');
  const unifiedProfiles = client.datasetLoader.moodMapper.createUnifiedMoodProfiles(enhancedSongs);
  
  // Test 4: Display comprehensive results
  console.log('\n📈 Step 4: Multi-Source Mood Analysis Results\n');
  
  unifiedProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. "${profile.title}" by ${profile.artist}`);
    console.log(`   Song ID: ${profile.songId}`);
    
    // Show all data sources
    const sources = profile.originalSources;
    console.log(`   📋 Data Sources Used: ${profile.unifiedMoodProfile.sources.join(', ')}`);
    
    if (sources.ysTags.tags.length > 0) {
      console.log(`   🏷️  YS Tags: ${sources.ysTags.tags.join(', ')} (confidence: ${sources.ysTags.confidence})`);
    }
    
    if (sources.behavioralSignals.mood) {
      console.log(`   🧠 Behavioral: ${sources.behavioralSignals.mood} (confidence: ${sources.behavioralSignals.confidence})`);
      console.log(`      Reasoning: ${sources.behavioralSignals.reasoning}`);
    }
    
    if (sources.llmEnhancement.tags.length > 0) {
      console.log(`   🤖 LLM Tags: ${sources.llmEnhancement.tags.join(', ')} (confidence: ${sources.llmEnhancement.confidence})`);
      console.log(`      LLM Reasoning: ${sources.llmEnhancement.reasoning}`);
    }
    
    // Show unified results
    const unified = profile.unifiedMoodProfile;
    console.log(`   🎯 UNIFIED RESULT:`);
    console.log(`      Primary Mood: ${unified.primaryMood.mood} (score: ${unified.primaryMood.score.toFixed(3)})`);
    console.log(`      Energy Level: ${unified.energyLevel}/5`);
    console.log(`      Overall Confidence: ${(unified.confidence * 100).toFixed(1)}%`);
    
    // Show mood score breakdown
    const topMoods = Object.entries(unified.moodScores)
      .filter(([mood, score]) => score > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topMoods.length > 0) {
      console.log(`      Mood Scores: ${topMoods.map(([mood, score]) => `${mood}(${score.toFixed(3)})`).join(', ')}`);
    }
    
    console.log(`      Reasoning: ${unified.reasoning}`);
    console.log('');
  });
  
  // Test 5: Show mood distribution
  const distribution = client.datasetLoader.moodMapper.getMoodDistribution(unifiedProfiles);
  console.log('📊 Mood Distribution Summary:');
  Object.entries(distribution.distribution).forEach(([mood, count]) => {
    if (count > 0) {
      const percentage = ((count / distribution.totalSongs) * 100).toFixed(1);
      console.log(`   ${mood}: ${count} songs (${percentage}%)`);
    }
  });
  console.log(`   Average Confidence: ${(distribution.averageConfidence * 100).toFixed(1)}%`);
  
  // Test 6: Demonstrate contextual recommendations
  console.log('\n🎵 Step 5: Contextual Mood-Based Recommendations');
  
  const testContexts = [
    { mood: 'peaceful', scenario: 'Evening relaxation after work' },
    { mood: 'energetic', scenario: 'Morning workout motivation' },
    { mood: 'focused', scenario: 'Deep work concentration' }
  ];
  
  testContexts.forEach(context => {
    const matchingSongs = unifiedProfiles.filter(profile => 
      profile.unifiedMoodProfile.primaryMood.mood === context.mood
    );
    
    console.log(`\n   ${context.scenario}:`);
    if (matchingSongs.length > 0) {
      matchingSongs.forEach(song => {
        console.log(`     ✓ "${song.title}" by ${song.artist} (confidence: ${(song.unifiedMoodProfile.confidence * 100).toFixed(1)}%)`);
      });
    } else {
      console.log(`     No songs found for ${context.mood} mood in current sample`);
    }
  });
  
  console.log('\n✅ Multi-Source Mood Mapping System Test Complete!');
  console.log(`\nSummary:`);
  console.log(`- Processed ${unifiedProfiles.length} songs with comprehensive metadata`);
  console.log(`- Combined YS tags, behavioral signals, and LLM enhancement`);
  console.log(`- Average confidence: ${(distribution.averageConfidence * 100).toFixed(1)}%`);
  console.log(`- Ready for contextual music recommendations! 🎉`);
}

// Run the test
if (require.main === module) {
  testMultiSourceMoodSystem().catch(console.error);
}

module.exports = testMultiSourceMoodSystem;
