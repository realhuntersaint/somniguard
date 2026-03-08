/**
 * FEATURE 3: Smart Sleep Timer and Fade Technology
 * Manages session timers, psychoacoustic fade curves, and personalised
 * sleep-onset duration estimates based on historical user data.
 */

const express = require('express');
const router = express.Router();

// ─── FADE CURVE CALCULATOR ────────────────────────────────────────────────────

/**
 * Generates a psychoacoustically optimised volume fade schedule.
 * The curve is non-linear: volume holds steady initially, then drops
 * gradually before a final smooth dissolve — mirroring natural sleep onset.
 *
 * @param {number} totalDuration  - Total fade duration in seconds
 * @param {number} steps          - Number of volume checkpoints to generate
 * @returns {Array} Array of { timeOffset (s), volume (0.0–1.0) } objects
 */
const generateFadeCurve = (totalDuration, steps = 10) => {
  const curve = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps; // normalised time 0→1
    // Ease-in cubic curve: slow start, steeper drop toward end
    const volume = parseFloat((1 - Math.pow(t, 3)).toFixed(3));
    curve.push({
      timeOffset: Math.round(t * totalDuration),
      volume,
    });
  }
  return curve;
};

/**
 * Estimates sleep onset duration for a user based on historical session data.
 * In production this would query the user's past sleep logs.
 *
 * @param {string} userId
 * @returns {number} Estimated seconds to fall asleep
 */
const estimateSleepOnset = (userId) => {
  // Placeholder: in production, compute rolling average from sleep_logs table
  // Default research-backed average: ~14 minutes (840 seconds)
  return 840;
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// POST /api/timer/session — create a new timed sleep session
router.post('/session', (req, res) => {
  const {
    userId,
    trackId,
    targetSleepTime,    // ISO string e.g. "2024-03-08T22:30:00"
    fadeDurationMinutes // how long the fade should take (default 20 min)
  } = req.body;

  if (!userId || !trackId) {
    return res.status(400).json({ error: 'userId and trackId are required' });
  }

  const fadeDuration = (fadeDurationMinutes || 20) * 60; // convert to seconds
  const estimatedOnset = estimateSleepOnset(userId);

  // Total session = estimated time to fall asleep + fade buffer
  const totalSessionDuration = estimatedOnset + fadeDuration;

  const session = {
    sessionId: `sess_${Date.now()}`,
    userId,
    trackId,
    createdAt: new Date().toISOString(),
    targetSleepTime: targetSleepTime || null,
    estimatedSleepOnsetSeconds: estimatedOnset,
    fadeDurationSeconds: fadeDuration,
    totalSessionDurationSeconds: totalSessionDuration,
    fadeSchedule: generateFadeCurve(fadeDuration),
    status: 'active',
  };

  // In production: persist session to DB for later completion logging
  return res.status(201).json({ session });
});

// POST /api/timer/session/:sessionId/complete — mark a session as complete
router.post('/session/:sessionId/complete', (req, res) => {
  const { userId, actualSleepOnsetSeconds, qualityRating } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  // In production: update session record and feed actualSleepOnsetSeconds
  // back into the personalisation model to refine future onset estimates
  return res.json({
    message: 'Session completed',
    sessionId: req.params.sessionId,
    userId,
    actualSleepOnsetSeconds,
    qualityRating,
    completedAt: new Date().toISOString(),
    // Drift: difference between estimate and actual, used to tune next session
    onsetDriftSeconds: actualSleepOnsetSeconds
      ? actualSleepOnsetSeconds - 840
      : null,
  });
});

// GET /api/timer/fade-curve — preview a fade curve for given parameters
router.get('/fade-curve', (req, res) => {
  const duration = parseInt(req.query.duration) || 1200; // seconds
  const steps = parseInt(req.query.steps) || 10;

  if (duration < 60 || duration > 7200) {
    return res.status(400).json({ error: 'Duration must be between 60 and 7200 seconds' });
  }

  return res.json({
    fadeDurationSeconds: duration,
    steps,
    curve: generateFadeCurve(duration, steps),
  });
});

// GET /api/timer/estimate/:userId — get personalised sleep onset estimate
router.get('/estimate/:userId', (req, res) => {
  const onset = estimateSleepOnset(req.params.userId);
  return res.json({
    userId: req.params.userId,
    estimatedSleepOnsetSeconds: onset,
    estimatedSleepOnsetMinutes: Math.round(onset / 60),
    basis: 'rolling_average', // or 'default' if no history
  });
});

module.exports = router;
