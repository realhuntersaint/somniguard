/**
 * Audio Library Controller
 * Manages the Somniguard immersive audio content library.
 * Categories: nature_soundscape | sleep_music | binaural_beats | guided_meditation
 */

// In production, these would be fetched from a database (e.g. PostgreSQL)
// and audio URLs would be pre-signed S3 links.
const MOCK_TRACKS = [
  {
    id: 'track_001',
    title: 'Amazon Rainforest Night',
    category: 'nature_soundscape',
    duration: 3600,       // seconds
    tags: ['rain', 'forest', 'insects', 'calm'],
    tempo: null,          // not applicable for soundscapes
    mood: 'deep_calm',
    audioUrl: 'https://cdn.somniguard.com/audio/amazon-night.mp3',
    isPremium: false,
  },
  {
    id: 'track_002',
    title: 'Delta Wave Journey',
    category: 'binaural_beats',
    duration: 2400,
    tags: ['delta', 'deep_sleep', 'brainwave'],
    binauralFrequency: { left: 200, right: 203.5 }, // 3.5Hz delta difference
    mood: 'deep_sleep',
    audioUrl: 'https://cdn.somniguard.com/audio/delta-journey.mp3',
    isPremium: true,
  },
  {
    id: 'track_003',
    title: 'Midnight Piano Drift',
    category: 'sleep_music',
    duration: 1800,
    tags: ['piano', 'ambient', 'slow'],
    tempo: 62,            // BPM — within 60–80 sleep-safe range
    mood: 'gentle',
    audioUrl: 'https://cdn.somniguard.com/audio/midnight-piano.mp3',
    isPremium: false,
  },
  {
    id: 'track_004',
    title: 'Body Scan for Deep Rest',
    category: 'guided_meditation',
    duration: 1200,
    tags: ['body_scan', 'relaxation', 'voice'],
    narrator: 'Amara Cole',
    mood: 'grounding',
    audioUrl: 'https://cdn.somniguard.com/audio/body-scan-rest.mp3',
    isPremium: true,
  },
];

// GET /api/audio
const getLibrary = (req, res) => {
  const { category, mood, duration, isPremium } = req.query;

  let results = [...MOCK_TRACKS];

  if (category) {
    results = results.filter(t => t.category === category);
  }
  if (mood) {
    results = results.filter(t => t.mood === mood);
  }
  if (duration) {
    // Return tracks at or under the requested duration (in minutes)
    results = results.filter(t => t.duration <= parseInt(duration) * 60);
  }
  if (isPremium !== undefined) {
    results = results.filter(t => t.isPremium === (isPremium === 'true'));
  }

  return res.json({
    total: results.length,
    tracks: results,
  });
};

// GET /api/audio/:trackId
const getTrack = (req, res) => {
  const track = MOCK_TRACKS.find(t => t.id === req.params.trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  return res.json(track);
};

// GET /api/audio/:trackId/stream
const streamTrack = (req, res) => {
  const track = MOCK_TRACKS.find(t => t.id === req.params.trackId);
  if (!track) {
    return res.status(404).json({ error: 'Track not found' });
  }
  // In production: generate a time-limited pre-signed S3 URL
  return res.json({
    trackId: track.id,
    streamUrl: track.audioUrl,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
  });
};

// GET /api/audio/meta/categories
const getCategories = (req, res) => {
  const categories = [
    {
      id: 'nature_soundscape',
      label: 'Nature Soundscapes',
      description: 'Immersive recordings from natural environments',
    },
    {
      id: 'sleep_music',
      label: 'Sleep Music',
      description: 'Original compositions at sleep-safe tempos (60–80 BPM)',
    },
    {
      id: 'binaural_beats',
      label: 'Binaural Beats',
      description: 'Brainwave entrainment for delta and theta wave states',
    },
    {
      id: 'guided_meditation',
      label: 'Guided Meditations',
      description: 'Voice-led body scans, visualisations, and breathwork',
    },
  ];
  return res.json({ categories });
};

// GET /api/audio/search/query?q=rain
const searchTracks = (req, res) => {
  const query = (req.query.q || '').toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  const results = MOCK_TRACKS.filter(t =>
    t.title.toLowerCase().includes(query) ||
    t.tags.some(tag => tag.includes(query))
  );
  return res.json({ query, total: results.length, tracks: results });
};

// POST /api/audio/:trackId/favourite
const favouriteTrack = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  // In production: persist to user_favourites table
  return res.json({
    message: 'Track added to favourites',
    userId,
    trackId: req.params.trackId,
  });
};

// DELETE /api/audio/:trackId/favourite
const unfavouriteTrack = (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  return res.json({
    message: 'Track removed from favourites',
    userId,
    trackId: req.params.trackId,
  });
};

// GET /api/audio/user/favourites
const getUserFavourites = (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  // In production: query user_favourites joined with tracks table
  return res.json({ userId, favourites: [] });
};

module.exports = {
  getLibrary,
  getTrack,
  streamTrack,
  getCategories,
  searchTracks,
  favouriteTrack,
  unfavouriteTrack,
  getUserFavourites,
};
