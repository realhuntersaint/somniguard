/**
 * FEATURE 1: Immersive Sleep Soundscapes and Music
 * Handles the audio library: soundscapes, compositions, binaural beats,
 * guided meditations. Supports browsing, filtering, and streaming.
 */

const express = require('express');
const router = express.Router();
const audioController = require('../controllers/audioController');

// Browse the full audio library with optional filters
// GET /api/audio?category=nature&mood=calm&duration=30
router.get('/', audioController.getLibrary);

// Get a single audio track by ID
// GET /api/audio/:trackId
router.get('/:trackId', audioController.getTrack);

// Stream or fetch a track's audio URL (pre-signed URL in production)
// GET /api/audio/:trackId/stream
router.get('/:trackId/stream', audioController.streamTrack);

// Get all available categories (nature, music, binaural, meditation)
// GET /api/audio/categories
router.get('/meta/categories', audioController.getCategories);

// Search tracks by keyword
// GET /api/audio/search?q=rain
router.get('/search/query', audioController.searchTracks);

// Mark a track as a user favourite
// POST /api/audio/:trackId/favourite
router.post('/:trackId/favourite', audioController.favouriteTrack);

// Remove a track from favourites
// DELETE /api/audio/:trackId/favourite
router.delete('/:trackId/favourite', audioController.unfavouriteTrack);

// Get user's favourited tracks
// GET /api/audio/user/favourites
router.get('/user/favourites', audioController.getUserFavourites);

module.exports = router;
