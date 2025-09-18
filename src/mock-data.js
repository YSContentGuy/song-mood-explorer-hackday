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
  },
  {
    id: "song_009",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    artist_popularity: 95,
    song_popularity: 98,
    genre_tags: ["rock", "progressive", "opera"],
    instrument_fit: "guitar",
    instrument_style: "lead",
    duration: 355,
    density: "very_high",
    skill_requirements: ["advanced_chords", "dynamic_playing", "tempo_changes"],
    difficulty_level: 9,
    style_tags: ["epic", "dramatic", "complex"],
    energy_level: "variable",
    tempo: 72,
    key: "Bb"
  },
  {
    id: "song_010",
    title: "Billie Jean",
    artist: "Michael Jackson",
    artist_popularity: 98,
    song_popularity: 94,
    genre_tags: ["pop", "funk", "dance"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 294,
    density: "medium",
    skill_requirements: ["funk_rhythm", "palm_muting", "groove"],
    difficulty_level: 4,
    style_tags: ["groovy", "mysterious", "danceable"],
    energy_level: "medium",
    tempo: 117,
    key: "F#m"
  },
  {
    id: "song_011",
    title: "Take Five",
    artist: "Dave Brubeck",
    artist_popularity: 72,
    song_popularity: 85,
    genre_tags: ["jazz", "instrumental"],
    instrument_fit: "guitar",
    instrument_style: "fingerpicking",
    duration: 324,
    density: "high",
    skill_requirements: ["jazz_chords", "odd_time_signatures", "improvisation"],
    difficulty_level: 8,
    style_tags: ["sophisticated", "cool", "intellectual"],
    energy_level: "medium",
    tempo: 174,
    key: "Eb"
  },
  {
    id: "song_012",
    title: "Clair de Lune",
    artist: "Claude Debussy",
    artist_popularity: 85,
    song_popularity: 88,
    genre_tags: ["classical", "impressionist"],
    instrument_fit: "guitar",
    instrument_style: "fingerpicking",
    duration: 300,
    density: "low",
    skill_requirements: ["classical_technique", "dynamics", "expression"],
    difficulty_level: 7,
    style_tags: ["peaceful", "dreamy", "elegant"],
    energy_level: "very_low",
    tempo: 46,
    key: "Db"
  },
  {
    id: "song_013",
    title: "Lose Yourself",
    artist: "Eminem",
    artist_popularity: 92,
    song_popularity: 89,
    genre_tags: ["hip-hop", "rap"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 326,
    density: "medium",
    skill_requirements: ["power_chords", "palm_muting", "rhythm"],
    difficulty_level: 3,
    style_tags: ["intense", "motivational", "aggressive"],
    energy_level: "high",
    tempo: 86,
    key: "Bb"
  },
  {
    id: "song_014",
    title: "Stairway to Heaven",
    artist: "Led Zeppelin",
    artist_popularity: 96,
    song_popularity: 97,
    genre_tags: ["rock", "progressive", "folk"],
    instrument_fit: "guitar",
    instrument_style: "both",
    duration: 482,
    density: "variable",
    skill_requirements: ["fingerpicking", "lead_guitar", "dynamics", "build_up"],
    difficulty_level: 8,
    style_tags: ["epic", "building", "spiritual"],
    energy_level: "variable",
    tempo: 82,
    key: "Am"
  },
  {
    id: "song_015",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    artist_popularity: 88,
    song_popularity: 95,
    genre_tags: ["reggaeton", "latin", "pop"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 229,
    density: "medium",
    skill_requirements: ["latin_rhythm", "strumming_patterns"],
    difficulty_level: 3,
    style_tags: ["sensual", "tropical", "catchy"],
    energy_level: "medium",
    tempo: 89,
    key: "Bm"
  },
  {
    id: "song_016",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    artist_popularity: 91,
    song_popularity: 92,
    genre_tags: ["grunge", "alternative", "rock"],
    instrument_fit: "guitar",
    instrument_style: "rhythm",
    duration: 301,
    density: "high",
    skill_requirements: ["power_chords", "distortion", "dynamics"],
    difficulty_level: 4,
    style_tags: ["rebellious", "raw", "angsty"],
    energy_level: "very_high",
    tempo: 117,
    key: "F"
  },
  {
    id: "song_017",
    title: "What a Wonderful World",
    artist: "Louis Armstrong",
    artist_popularity: 87,
    song_popularity: 90,
    genre_tags: ["jazz", "traditional", "vocal"],
    instrument_fit: "guitar",
    instrument_style: "fingerpicking",
    duration: 137,
    density: "very_low",
    skill_requirements: ["jazz_chords", "gentle_strumming"],
    difficulty_level: 2,
    style_tags: ["peaceful", "optimistic", "warm"],
    energy_level: "low",
    tempo: 76,
    key: "F"
  }
];

// Artificial user profiles for proof of concept
const mockUserProfiles = [
  {
    id: "user_beginner",
    name: "Sarah (Beginner Guitar Player)",
    age: 15,
    skillLevel: 3,
    instrument: "guitar",
    genrePreferences: ["pop", "acoustic", "r&b"],
    genreAvoidance: ["metal", "hard_rock"],
    playingExperience: "9 months",
    practiceFrequency: "3 times per week",
    preferredDifficulty: [1, 2, 3],
    learningGoals: ["basic_chords", "strumming_patterns"],
    popularityPreference: 0.7, // Prefers well-known songs for motivation
    // Realistic behavioral data for a casual player who REQUIRES comfort zone
    totalSongsPlayed: 35,
    subscriptionTime: "6 months",
    songsReturnedTo: 6, // Fewer songs in comfort zone - casual player
    typicalDifficulty: 2.1, // Stays in beginner range
    comfortZoneDifficulty: [1, 2], // Only comfortable with very easy songs
    comfortZoneStyles: ["acoustic", "pop", "r&b"], // Styles they're comfortable with
    learningStyle: "comfort_zone_required", // NEEDS to stay in comfort zone to stay motivated
    dominantEnergy: "medium",
    topStyleTags: ["acoustic", "pop", "r&b"]
  },
  {
    id: "user_intermediate",
    name: "Mike (Intermediate Guitar Player)",
    age: 20,
    skillLevel: 6,
    instrument: "guitar",
    genrePreferences: ["country", "folk", "alternative"],
    genreAvoidance: ["classical"],
    playingExperience: "3 years",
    practiceFrequency: "daily",
    preferredDifficulty: [4, 5, 6],
    learningGoals: ["lead_guitar", "improvisation", "song_writing"],
    popularityPreference: 0.8, // Prefers commercial/popular songs
    // Realistic behavioral data for an adventurous player who LEAST needs comfort zone
    totalSongsPlayed: 420,
    subscriptionTime: "2.5 years",
    songsReturnedTo: 45, // More songs in comfort zone - dedicated player
    typicalDifficulty: 4.8, // Comfortable with intermediate songs
    comfortZoneDifficulty: [3, 4, 5], // Comfortable with intermediate range
    comfortZoneStyles: ["country", "folk", "alternative", "acoustic"], // Styles they're comfortable with
    learningStyle: "comfort_zone_least_important", // LEAST needs comfort zone - loves challenges
    dominantEnergy: "high",
    topStyleTags: ["country", "folk", "alternative"]
  },
  {
    id: "user_advanced",
    name: "Alex (Advanced Guitar Player)",
    age: 32,
    skillLevel: 8,
    instrument: "guitar",
    genrePreferences: ["metal", "hard_rock", "progressive"],
    genreAvoidance: ["country"],
    playingExperience: "10+ years",
    practiceFrequency: "daily",
    preferredDifficulty: [7, 8, 9, 10],
    learningGoals: ["technical_mastery", "complex_compositions"],
    popularityPreference: 0.2, // Prefers challenging, niche songs over mainstream hits
    // Realistic behavioral data for a player who likes comfort zone but has become more adventurous over time
    totalSongsPlayed: 1800,
    subscriptionTime: "4 years",
    songsReturnedTo: 120, // Many songs in comfort zone - very focused player
    typicalDifficulty: 7.2, // Comfortable with advanced songs
    comfortZoneDifficulty: [6, 7, 8], // Comfortable with advanced range
    comfortZoneStyles: ["metal", "progressive", "technical", "hard_rock"], // Styles they're comfortable with
    learningStyle: "comfort_zone_preferred_but_adventurous", // Likes comfort zone but has played so much he's become more adventurous
    dominantEnergy: "very_high",
    topStyleTags: ["metal", "progressive", "technical"]
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
