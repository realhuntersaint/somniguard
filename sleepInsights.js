/**
 * FEATURE 6: Sleep Insights and Wellness Tracking
 * Integrates with wearables (Apple Watch, Fitbit, Garmin, Oura Ring),
 * ingests sleep data, correlates it with Somniguard audio usage,
 * and surfaces personalised plain-language insights.
 */

const express = require('express');
const router = express.Router();

// ─── SUPPORTED WEARABLES ──────────────────────────────────────────────────────

const SUPPORTED_WEARABLES = ['apple_watch', 'fitbit', 'garmin', 'oura_ring'];

// ─── INSIGHTS ENGINE ──────────────────────────────────────────────────────────

/**
 * Generates plain-language insight cards from aggregated sleep data.
 * In production this would run over a real dataset from the DB.
 *
 * @param {Object} stats - Aggregated sleep statistics
 * @returns {Array} Array of insight card objects
 */
const generateInsightCards = (stats) => {
  const insights = [];

  if (stats.avgSleepOnsetMinutes < 10) {
    insights.push({
      type: 'positive',
      icon: '🌙',
      title: 'Fast Asleep',
      body: `You're falling asleep in under 10 minutes on average — well within the healthy range.`,
    });
  } else if (stats.avgSleepOnsetMinutes > 30) {
    insights.push({
      type: 'suggestion',
      icon: '⏱',
      title: 'Slow Sleep Onset',
      body: `You're taking over 30 minutes to fall asleep. Try starting your Somniguard session 45 minutes before your target sleep time.`,
    });
  }

  if (stats.bestPerformingCategory) {
    insights.push({
      type: 'discovery',
      icon: '🎵',
      title: 'Your Best Sleep Audio',
      body: `Your sleep scores are consistently higher on nights you use ${stats.bestPerformingCategory} content. Consider making this your nightly default.`,
    });
  }

  if (stats.avgSessionStartHour > 23) {
    insights.push({
      type: 'suggestion',
      icon: '🕙',
      title: 'Late Start',
      body: `Starting your session after 11 PM is associated with lower sleep scores for you. Try beginning 30 minutes earlier.`,
    });
  }

  if (stats.streakDays >= 7) {
    insights.push({
      type: 'milestone',
      icon: '🏆',
      title: `${stats.streakDays}-Day Streak`,
      body: `You've used Somniguard for ${stats.streakDays} nights in a row. Consistent use is one of the strongest predictors of long-term improvement.`,
    });
  }

  return insights;
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET /api/insights/wearables — list supported wearable platforms
router.get('/wearables', (req, res) => {
  return res.json({ supported: SUPPORTED_WEARABLES });
});

// POST /api/insights/wearables/connect — connect a wearable for a user
router.post('/wearables/connect', (req, res) => {
  const { userId, platform, accessToken } = req.body;

  if (!userId || !platform || !accessToken) {
    return res.status(400).json({ error: 'userId, platform, and accessToken are required' });
  }
  if (!SUPPORTED_WEARABLES.includes(platform)) {
    return res.status(400).json({
      error: `Unsupported wearable. Choose from: ${SUPPORTED_WEARABLES.join(', ')}`,
    });
  }

  // In production: securely store accessToken and begin scheduled data sync
  return res.json({
    message: `${platform} connected`,
    userId,
    platform,
    syncFrequency: 'nightly',
    connectedAt: new Date().toISOString(),
  });
});

// POST /api/insights/sleep-log — ingest a nightly sleep record (from wearable sync or manual)
router.post('/sleep-log', (req, res) => {
  const {
    userId,
    date,               // YYYY-MM-DD
    source,             // 'apple_watch' | 'fitbit' | 'garmin' | 'oura_ring' | 'manual'
    bedtime,            // ISO datetime
    wakeTime,           // ISO datetime
    totalSleepMinutes,
    deepSleepMinutes,
    remSleepMinutes,
    lightSleepMinutes,
    awakenings,
    sleepScore,         // 0–100 if provided by wearable
    somniguardSessionId, // link to the audio session used that night
  } = req.body;

  if (!userId || !date) {
    return res.status(400).json({ error: 'userId and date are required' });
  }

  const sleepLog = {
    logId: `slog_${Date.now()}`,
    userId,
    date,
    source,
    bedtime,
    wakeTime,
    totalSleepMinutes,
    deepSleepMinutes,
    remSleepMinutes,
    lightSleepMinutes,
    awakenings,
    sleepScore,
    somniguardSessionId: somniguardSessionId || null,
    createdAt: new Date().toISOString(),
  };

  // In production: persist to sleep_logs table
  return res.status(201).json({ sleepLog });
});

// GET /api/insights/dashboard/:userId — get the personalised insights dashboard
router.get('/dashboard/:userId', (req, res) => {
  const { period } = req.query; // '7d' | '30d' | '90d' — default 7d

  // In production: aggregate from sleep_logs and session_logs tables for this user
  // Mock aggregated stats for demonstration
  const mockStats = {
    period: period || '7d',
    avgSleepOnsetMinutes: 22,
    avgTotalSleepHours: 6.8,
    avgDeepSleepPercent: 18,
    avgRemSleepPercent: 22,
    avgSleepScore: 74,
    bestPerformingCategory: 'nature_soundscape',
    avgSessionStartHour: 22.5,
    streakDays: 9,
    sessionsCompleted: 9,
  };

  const insights = generateInsightCards(mockStats);

  return res.json({
    userId: req.params.userId,
    period: period || '7d',
    stats: mockStats,
    insights,
  });
});

// GET /api/insights/correlations/:userId — audio-to-sleep quality correlations
router.get('/correlations/:userId', (req, res) => {
  // In production: JOIN sleep_logs ON somniguardSessionId, group by track category,
  // compute avg sleep score per category
  const mockCorrelations = [
    { category: 'nature_soundscape', avgSleepScore: 81, sessionCount: 12 },
    { category: 'binaural_beats',    avgSleepScore: 77, sessionCount: 5  },
    { category: 'guided_meditation', avgSleepScore: 74, sessionCount: 8  },
    { category: 'sleep_music',       avgSleepScore: 72, sessionCount: 6  },
  ];

  return res.json({
    userId: req.params.userId,
    correlations: mockCorrelations,
    topCategory: mockCorrelations[0].category,
  });
});

// GET /api/insights/trends/:userId — week-over-week sleep trend data
router.get('/trends/:userId', (req, res) => {
  // In production: query last N weeks of sleep_logs and return time-series data
  const mockTrends = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split('T')[0],
      sleepScore: Math.floor(65 + Math.random() * 20),
      totalSleepHours: parseFloat((5.5 + Math.random() * 2).toFixed(1)),
      sessionUsed: Math.random() > 0.2,
    };
  });

  return res.json({
    userId: req.params.userId,
    period: '7d',
    trends: mockTrends,
  });
});

module.exports = router;
