#!/usr/bin/env node
// Build a single-file static demo with three users and one suggestion each.
// Usage:
//   node scripts/build-static-story.js              # uses data/yousician_songs.csv
//   node scripts/build-static-story.js "song metadata (2).csv"  # use your CSV

const fs = require('fs');
const path = require('path');

process.env.USE_REAL_YS_DATA = 'true';

const DatasetLoader = require('../src/dataset-loader');
const MoodExplorer = require('../src/mood-explorer');

async function build() {
  const csvArg = process.argv[2];
  const outPath = path.join(process.cwd(), 'public', 'story-static.html');

  const dl = new DatasetLoader();
  global.__YS_SHARED_DATASET_LOADER = dl;

  try {
    if (csvArg) {
      await dl.loadFromLocalCsv(csvArg);
    } else {
      await dl.loadSongDataset();
    }
  } catch (e) {
    console.error('Failed to load dataset:', e.message);
    process.exit(1);
  }

  const me = new MoodExplorer();
  const users = dl.getMockUserProfiles();

  function pickMoodFromSummary(summary) {
    switch (summary.dominantEnergy) {
      case 'very_high':
      case 'high': return 'energetic';
      case 'very_low':
      case 'low': return 'relaxed';
      default: {
        const tags = (summary.topStyleTags || []).join(',').toLowerCase();
        if (tags.includes('peace') || tags.includes('calm') || tags.includes('dream')) return 'calm';
        if (tags.includes('happy') || tags.includes('upbeat') || tags.includes('positive')) return 'happy';
        if (tags.includes('melanch')) return 'sad';
        return 'neutral';
      }
    }
  }

  const timeOfDay = me.getTimeSlot(new Date().getHours());
  const results = [];

  for (const u of users) {
    const summary = dl.summarizeForGenres(u.genrePreferences);
    const mood = pickMoodFromSummary(summary);
    const goals = summary.dominantEnergy && (summary.dominantEnergy === 'high' || summary.dominantEnergy === 'very_high') ? 'challenge' : 'relax';
    const context = { mood, timeOfDay, availableTime: 20, goals, exploreNewMoods: true };
    const recs = await me.getContextualRecommendations(u, context);
    const top = recs[0] || null;
    const blurb = `${u.name.split('(')[1]?.replace(')', '') || 'Player'} · Likes ${u.genrePreferences.join(', ')} · ` +
      (summary.count > 0 ? `${summary.count} matching songs (avg diff ${summary.avgDifficulty ?? 'n/a'}), energy: ${summary.dominantEnergy || 'n/a'}` : 'no direct matches');

    results.push({
      id: u.id,
      name: u.name,
      blurb,
      derivedMood: mood,
      context,
      suggestion: top,
      user: {
        skillLevel: u.skillLevel,
        genrePreferences: u.genrePreferences
      }
    });
  }

  const dataScript = `window.__USERS_OVERVIEW__ = ${JSON.stringify({ users: results })};`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mood Explorer — Static Story</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f6f7fb; margin:0; padding:24px; }
    .wrap { max-width: 1100px; margin: 0 auto; }
    h1 { margin:0 0 8px; }
    .sub { color:#666; margin-bottom: 16px; }
    .grid { display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; }
    .card { background:#fff; border:1px solid #eee; border-radius:12px; padding:14px; box-shadow:0 6px 18px rgba(0,0,0,0.04); }
    .name { font-weight:700; margin-bottom:4px; }
    .blurb { color:#444; font-size:14px; min-height: 44px; }
    .muted { color:#777; font-size:12px; }
    .song { margin-top:10px; border-left:4px solid #667eea; padding-left:10px; }
    .why { margin-top:6px; font-size:12px; color:#444; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  </style>
  <script>${dataScript}</script>
</head>
<body>
  <div class="wrap">
    <h1>Right‑Now Picks for Three Players</h1>
    <div class="sub">Static export — open this file without a server.</div>
    <div id="grid" class="grid"></div>
  </div>
  <script>
    function whyLine(item){
      const s = item.suggestion || {};
      const b = s.scoringBreakdown || {};
      const parts = [];
      if (item.context) parts.push(item.context.timeOfDay + ", " + item.context.goals);
      if (typeof s.duration === 'number' && item.context && item.context.availableTime) {
        const mins = Math.round(s.duration/60);
        parts.push(mins + " min fits ~" + item.context.availableTime + " min");
      }
      if (s.energy_level) parts.push(s.energy_level + " energy");
      if (typeof s.difficulty_level === 'number' && item.user && item.user.skillLevel) {
        const diff = s.difficulty_level - item.user.skillLevel;
        const rel = diff === 0 ? 'at your level' : (diff > 0 ? ('+'+diff+' harder') : (Math.abs(diff) + ' easier'));
        parts.push(rel);
      }
      if (typeof b.moodAlignment === 'number') {
        parts.push('mood match ' + Math.round(b.moodAlignment*100) + '%');
      }
      return parts.join(' · ');
    }
    (function init(){
      const data = window.__USERS_OVERVIEW__ || { users: [] };
      const grid = document.getElementById('grid');
      grid.innerHTML = '';
      data.users.forEach(u => {
        const c = document.createElement('div');
        c.className = 'card';
        const s = u.suggestion;
        c.innerHTML = "<div class='name'>"+u.name+"</div>"+
          "<div class='blurb'>"+u.blurb+"</div>"+
          "<div class='muted'>Mood: "+u.derivedMood+" · Time: "+u.context.timeOfDay+" · Goal: "+u.context.goals+"</div>"+
          "<div class='song'>"+
          (s ? ("<div><strong>"+(s.title || s.SONG_TITLE)+"</strong> — "+(s.artist || s.ARTIST_NAME || 'Unknown')+"</div>"+
          "<div class='muted'>Score: "+(s.contextualScore ?? 'N/A')+"</div>"+
          "<div class='why'>"+whyLine(u)+"</div>") : '<em>No suggestion</em>')+
          "</div>";
        grid.appendChild(c);
      });
    })();
  </script>
</body>
</html>`;

  fs.writeFileSync(outPath, html, 'utf8');
  console.log('Wrote static demo to', outPath);
}

build();

