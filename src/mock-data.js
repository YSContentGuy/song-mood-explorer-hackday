// Mock song dataset structure based on Yousician's actual data
// This will be replaced with Pavel's real dataset of ~100k songs

const mockSongs = [
  {
    id: "song_001",
    title: "Wonderwall",
    artist: "Oasis",
    artist_popularity: 85,
    song_popularity: 92,
    genre_tags: ["rock", "britpop", "alternative"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 258, // seconds
    density: "medium", // notes/chords per musical time
    skill_requirements: ["basic_chords", "strumming_patterns"],
    difficulty_level: 3,
    style_tags: ["upbeat", "nostalgic", "sing-along"],
    energy_level: "medium",
    tempo: 87, // BPM
    key: "F#m"
  },
  {
    id: "song_002",
    title: "Hotel California",
    artist: "Eagles",
    artist_popularity: 90,
    song_popularity: 95,
    genre_tags: ["rock", "classic_rock"],
    instrument_fit: "guitar",
    instrument_style: "lead",
    duration: 391,
    density: "high",
    skill_requirements: ["fingerpicking", "lead_guitar", "advanced_chords"],
    difficulty_level: 7,
    style_tags: ["epic", "storytelling", "guitar_solo"],
    energy_level: "medium",
    tempo: 75,
    key: "Bm"
  },
  {
    id: "song_003",
    title: "Shape of You",
    artist: "Ed Sheeran",
    artist_popularity: 95,
    song_popularity: 88,
    genre_tags: ["pop", "acoustic"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 233,
    density: "low",
    skill_requirements: ["basic_chords", "fingerpicking"],
    difficulty_level: 2,
    style_tags: ["catchy", "romantic", "modern"],
    energy_level: "medium",
    tempo: 96,
    key: "C#m"
  },
  {
    id: "song_004",
    title: "Thunderstruck",
    artist: "AC/DC",
    artist_popularity: 88,
    song_popularity: 85,
    genre_tags: ["rock", "hard_rock", "metal"],
    instrument_fit: "guitar",
    instrument_style: "lead",
    duration: 292,
    density: "very_high",
    skill_requirements: ["fast_picking", "power_chords", "stamina"],
    difficulty_level: 8,
    style_tags: ["energetic", "powerful", "aggressive"],
    energy_level: "very_high",
    tempo: 133,
    key: "B"
  },
  {
    id: "song_005",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    artist_popularity: 75,
    song_popularity: 90,
    genre_tags: ["folk", "alternative", "spiritual"],
    instrument_fit: "guitar",
    instrument_style: "fingerpicking",
    duration: 274,
    density: "low",
    skill_requirements: ["fingerpicking", "emotional_expression"],
    difficulty_level: 4,
    style_tags: ["emotional", "spiritual", "melancholic"],
    energy_level: "low",
    tempo: 60,
    key: "C"
  },
  {
    id: "song_006",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    artist_popularity: 82,
    song_popularity: 91,
    genre_tags: ["funk", "pop", "dance"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 269,
    density: "high",
    skill_requirements: ["funk_rhythm", "muting", "groove"],
    difficulty_level: 5,
    style_tags: ["funky", "danceable", "upbeat"],
    energy_level: "high",
    tempo: 115,
    key: "Dm"
  },
  {
    id: "song_007",
    title: "Mad World",
    artist: "Gary Jules",
    artist_popularity: 65,
    song_popularity: 78,
    genre_tags: ["alternative", "indie", "melancholic"],
    instrument_fit: "guitar",
    instrument_style: "fingerpicking",
    duration: 186,
    density: "very_low",
    skill_requirements: ["fingerpicking", "dynamics"],
    difficulty_level: 3,
    style_tags: ["sad", "introspective", "haunting"],
    energy_level: "very_low",
    tempo: 45,
    key: "Em"
  },
  {
    id: "song_008",
    title: "Can't Stop the Feeling",
    artist: "Justin Timberlake",
    artist_popularity: 89,
    song_popularity: 86,
    genre_tags: ["pop", "dance", "feel-good"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 236,
    density: "medium",
    skill_requirements: ["pop_chords", "strumming"],
    difficulty_level: 2,
    style_tags: ["happy", "uplifting", "positive"],
    energy_level: "high",
    tempo: 113,
    key: "C"
  }
];

// Artificial user profiles for proof of concept
const mockUserProfiles = [
  {
    id: "user_beginner",
    name: "Sarah (Beginner)",
    skillLevel: 2,
    instrument: "guitar",
    genrePreferences: ["pop", "acoustic", "folk"],
    genreAvoidance: ["metal", "hard_rock"],
    playingExperience: "6 months",
    practiceFrequency: "3 times per week",
    preferredDifficulty: [1, 2, 3],
    learningGoals: ["basic_chords", "strumming_patterns"]
  },
  {
    id: "user_intermediate",
    name: "Mike (Intermediate)",
    skillLevel: 5,
    instrument: "guitar",
    genrePreferences: ["rock", "alternative", "indie"],
    genreAvoidance: ["country"],
    playingExperience: "3 years",
    practiceFrequency: "daily",
    preferredDifficulty: [4, 5, 6],
    learningGoals: ["lead_guitar", "improvisation", "song_writing"]
  },
  {
    id: "user_advanced",
    name: "Alex (Advanced)",
    skillLevel: 8,
    instrument: "guitar",
    genrePreferences: ["metal", "progressive", "jazz"],
    genreAvoidance: [],
    playingExperience: "10+ years",
    practiceFrequency: "daily",
    preferredDifficulty: [7, 8, 9, 10],
    learningGoals: ["technical_mastery", "complex_compositions"]
  }
];

// Context scenarios for testing
const mockContextScenarios = [
  {
    id: "morning_energy",
    name: "Morning Energy Boost",
    timeOfDay: "morning",
    availableTime: 15,
    mood: "tired",
    goals: "energize",
    exploreNewMoods: false
  },
  {
    id: "evening_relax",
    name: "Evening Wind Down",
    timeOfDay: "evening",
    availableTime: 30,
    mood: "stressed",
    goals: "relax",
    exploreNewMoods: true
  },
  {
    id: "weekend_challenge",
    name: "Weekend Challenge Session",
    timeOfDay: "afternoon",
    availableTime: 60,
    mood: "motivated",
    goals: "challenge",
    exploreNewMoods: true
  },
  {
    id: "quick_practice",
    name: "Quick Practice Break",
    timeOfDay: "afternoon",
    availableTime: 5,
    mood: "neutral",
    goals: "maintain",
    exploreNewMoods: false
  }
];

module.exports = {
  mockSongs,
  mockUserProfiles,
  mockContextScenarios
};
