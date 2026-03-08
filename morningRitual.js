/**
 * FEATURE 5: Morning Ritual and Wake Experience
 * Manages gentle audio alarms with sunrise simulation, morning grounding
 * sessions, and the calm wake-up transition system.
 */

const express = require('express');
const router = express.Router();

// ─── MOCK MORNING CONTENT ─────────────────────────────────────────────────────

const MORNING_SESSIONS = [
  {
    id: 'morning_001',
    title: 'Gentle Dawn Breathwork',
    type: 'breathwork',
    durationSeconds: 300,
    description: '5-minute 4-7-8 breathing sequence to oxygenate and centre',
    audioUrl: 'https://cdn.somniguard.com/morning/dawn-breathwork.mp3',
  },
  {
    id: 'morning_002',
    title: 'Morning Intention Setting',
    type: 'mindfulness',
    durationSeconds: 600,
    description: '10-minute guided mindfulness check-in with a soft ambient score',
    audioUrl: 'https://cdn.somniguard.com/morning/intention-setting.mp3',
  },
  {
    id: 'morning_003',
    title: 'Body Awakening Stretch Guide',
    type: 'movement',
    durationSeconds: 480,
    description: '8-minute voiced gentle stretch sequence for a grounded start',
    audioUrl: 'https://cdn.somniguard.com/morning/body-awakening.mp3',
  },
];

// ─── ALARM BUILDER ────────────────────────────────────────────────────────────

/**
 * Builds a sunrise audio alarm schedule.
 * Volume rises gradually from silence to full over the riseMinutes window,
 * using an inverse of the sleep fade curve (ease-out cubic).
 *
 * @param {number} riseMinutes - Duration of the gradual rise (5–30 min)
 * @param {number} steps
 * @returns {Array} Volume schedule checkpoints
 */
const buildSunriseSchedule = (riseMinutes, steps = 8) => {
  const duration = riseMinutes * 60;
  const schedule = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Ease-out cubic: fast initial rise, plateaus toward full volume
    const volume = parseFloat((1 - Math.pow(1 - t, 3)).toFixed(3));
    schedule.push({
      timeOffset: Math.round(t * duration),
      volume,
    });
  }
  return schedule;
};

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// POST /api/morning/alarm — create or update a user's gentle alarm
router.post('/alarm', (req, res) => {
  const {
    userId,
    wakeTime,           // ISO time string e.g. "07:00"
    riseMinutes,        // How long the audio sunrise takes (5–30)
    alarmTrackId,       // Which audio track to use as the alarm tone
    smartHomeScene,     // Optional: 'gentle_wake' scene ID
    isRecurring,
    recurringDays,      // e.g. ["Mon","Tue","Wed","Thu","Fri"]
  } = req.body;

  if (!userId || !wakeTime) {
    return res.status(400).json({ error: 'userId and wakeTime are required' });
  }

  const rise = Math.min(Math.max(riseMinutes || 20, 5), 30); // clamp 5–30

  const alarm = {
    alarmId: `alarm_${Date.now()}`,
    userId,
    wakeTime,
    riseMinutes: rise,
    alarmTrackId: alarmTrackId || 'track_001', // default to a gentle nature track
    sunriseSchedule: buildSunriseSchedule(rise),
    smartHomeScene: smartHomeScene || null,
    isRecurring: isRecurring || false,
    recurringDays: recurringDays || [],
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  // In production: persist to alarms table
  return res.status(201).json({ alarm });
});

// GET /api/morning/alarm/:userId — get a user's active alarm
router.get('/alarm/:userId', (req, res) => {
  // In production: query alarms table for this user
  return res.json({
    userId: req.params.userId,
    alarms: [], // populated from DB in production
  });
});

// DELETE /api/morning/alarm/:alarmId — deactivate an alarm
router.delete('/alarm/:alarmId', (req, res) => {
  return res.json({
    message: 'Alarm deactivated',
    alarmId: req.params.alarmId,
  });
});

// GET /api/morning/sessions — list available morning grounding sessions
router.get('/sessions', (req, res) => {
  const { type } = req.query;
  const results = type
    ? MORNING_SESSIONS.filter(s => s.type === type)
    : MORNING_SESSIONS;
  return res.json({ total: results.length, sessions: results });
});

// GET /api/morning/sessions/:sessionId — get a specific morning session
router.get('/sessions/:sessionId', (req, res) => {
  const session = MORNING_SESSIONS.find(s => s.id === req.params.sessionId);
  if (!session) return res.status(404).json({ error: 'Morning session not found' });
  return res.json(session);
});

// POST /api/morning/sessions/:sessionId/complete — log a completed morning session
router.post('/sessions/:sessionId/complete', (req, res) => {
  const { userId, moodBefore, moodAfter, notes } = req.body;

  if (!userId) return res.status(400).json({ error: 'userId is required' });

  return res.json({
    logId: `mlog_${Date.now()}`,
    userId,
    sessionId: req.params.sessionId,
    moodBefore,   // 1–5 scale
    moodAfter,    // 1–5 scale — delta used to track session effectiveness
    notes,
    completedAt: new Date().toISOString(),
  });
});

// GET /api/morning/sunrise-schedule — preview a sunrise schedule
router.get('/sunrise-schedule', (req, res) => {
  const minutes = parseInt(req.query.minutes) || 20;
  if (minutes < 5 || minutes > 30) {
    return res.status(400).json({ error: 'minutes must be between 5 and 30' });
  }
  return res.json({
    riseMinutes: minutes,
    schedule: buildSunriseSchedule(minutes),
  });
});

module.exports = router;
