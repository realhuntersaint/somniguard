/**
 * FEATURE 2: Intelligent Sleep Programs
 * Multi-week structured programs with nightly sessions, progress tracking,
 * adaptive recommendations, and user feedback loops.
 */

const express = require('express');
const router = express.Router();

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const PROGRAMS = [
  {
    id: 'prog_001',
    title: 'Deep Sleep Reset',
    durationWeeks: 4,
    targetAudience: 'Users who struggle to reach deep, restorative sleep',
    sessionsPerWeek: 7,
    isPremium: true,
    phases: [
      { week: 1, theme: 'Foundation', focus: 'Establishing a consistent wind-down ritual' },
      { week: 2, theme: 'Deepening', focus: 'Introducing binaural delta wave sessions' },
      { week: 3, theme: 'Consolidation', focus: 'Extending deep sleep windows' },
      { week: 4, theme: 'Maintenance', focus: 'Building long-term habits' },
    ],
  },
  {
    id: 'prog_002',
    title: 'Stress & Anxiety Wind-Down',
    durationWeeks: 2,
    targetAudience: 'Users with overactive minds at bedtime',
    sessionsPerWeek: 7,
    isPremium: true,
    phases: [
      { week: 1, theme: 'Release', focus: 'Body scan and progressive muscle relaxation' },
      { week: 2, theme: 'Rewire', focus: 'Cognitive defusion and breath anchoring' },
    ],
  },
  {
    id: 'prog_003',
    title: 'Sleep Rhythm Restoration',
    durationWeeks: 3,
    targetAudience: 'Shift workers and frequent travellers',
    sessionsPerWeek: 7,
    isPremium: true,
    phases: [
      { week: 1, theme: 'Reset', focus: 'Circadian anchoring with timed audio cues' },
      { week: 2, theme: 'Stabilise', focus: 'Consistent sleep-wake audio rituals' },
      { week: 3, theme: 'Solidify', focus: 'Sustained rhythm maintenance' },
    ],
  },
  {
    id: 'prog_004',
    title: 'Children & Family Sleep',
    durationWeeks: 2,
    targetAudience: 'Parents and young children',
    sessionsPerWeek: 7,
    isPremium: false,
    phases: [
      { week: 1, theme: 'Routine', focus: 'Building predictable bedtime signals' },
      { week: 2, theme: 'Independence', focus: 'Encouraging self-soothing with audio' },
    ],
  },
];

// ─── CONTROLLERS ─────────────────────────────────────────────────────────────

// GET /api/programs — list all available programs
router.get('/', (req, res) => {
  return res.json({ total: PROGRAMS.length, programs: PROGRAMS });
});

// GET /api/programs/:programId — get a specific program
router.get('/:programId', (req, res) => {
  const program = PROGRAMS.find(p => p.id === req.params.programId);
  if (!program) return res.status(404).json({ error: 'Program not found' });
  return res.json(program);
});

// POST /api/programs/:programId/enrol — enrol a user in a program
router.post('/:programId/enrol', (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  const program = PROGRAMS.find(p => p.id === req.params.programId);
  if (!program) return res.status(404).json({ error: 'Program not found' });

  // In production: create a user_program_enrolment record in DB
  const enrolment = {
    enrolmentId: `enrol_${Date.now()}`,
    userId,
    programId: program.id,
    programTitle: program.title,
    startDate: new Date().toISOString(),
    currentWeek: 1,
    currentSession: 1,
    completedSessions: [],
    status: 'active',
  };

  return res.status(201).json({ message: 'Successfully enrolled', enrolment });
});

// GET /api/programs/user/:userId/progress — get all active program enrolments
router.get('/user/:userId/progress', (req, res) => {
  // In production: query enrolments from DB for this user
  return res.json({
    userId: req.params.userId,
    activePrograms: [],
    completedPrograms: [],
  });
});

// POST /api/programs/:programId/session/complete — log a completed nightly session
router.post('/:programId/session/complete', (req, res) => {
  const { userId, sessionNumber, durationListened, rating, notes } = req.body;

  if (!userId || !sessionNumber) {
    return res.status(400).json({ error: 'userId and sessionNumber are required' });
  }

  // In production: save to session_logs table and trigger adaptive recommendation engine
  const sessionLog = {
    logId: `log_${Date.now()}`,
    userId,
    programId: req.params.programId,
    sessionNumber,
    durationListened,   // seconds actually listened
    rating,             // 1–5 user rating
    notes,              // optional free-text
    completedAt: new Date().toISOString(),
  };

  // Adaptive logic: if rating <= 2, flag for content swap recommendation
  const recommendation = rating <= 2
    ? { action: 'suggest_alternative', reason: 'Low session rating — consider switching content type' }
    : { action: 'continue', reason: 'Session well received' };

  return res.json({ sessionLog, recommendation });
});

// GET /api/programs/:programId/next-session — get the recommended next session for a user
router.get('/:programId/next-session', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  // In production: compute based on enrolment progress and past session ratings
  return res.json({
    userId,
    programId: req.params.programId,
    nextSession: {
      sessionNumber: 1,
      week: 1,
      recommendedTrackId: 'track_004',
      recommendedStartTime: '22:00',
      estimatedDuration: 30,
    },
  });
});

module.exports = router;
