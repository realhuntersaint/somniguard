const express = require('express');
const app = express();

app.use(express.json());

// Route imports
const audioLibraryRoutes = require('./routes/audioLibrary');
const sleepProgramRoutes = require('./routes/sleepPrograms');
const sleepTimerRoutes = require('./routes/sleepTimer');
const environmentRoutes = require('./routes/environment');
const morningRitualRoutes = require('./routes/morningRitual');
const sleepInsightsRoutes = require('./routes/sleepInsights');

// Feature routes
app.use('/api/audio', audioLibraryRoutes);           // Feature 1: Immersive Audio Library
app.use('/api/programs', sleepProgramRoutes);         // Feature 2: Intelligent Sleep Programs
app.use('/api/timer', sleepTimerRoutes);              // Feature 3: Smart Sleep Timer & Fade
app.use('/api/environment', environmentRoutes);       // Feature 4: Sleep Environment Integration
app.use('/api/morning', morningRitualRoutes);         // Feature 5: Morning Ritual & Wake Experience
app.use('/api/insights', sleepInsightsRoutes);        // Feature 6: Sleep Insights & Wellness Tracking

app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Somniguard API' }));

module.exports = app;
