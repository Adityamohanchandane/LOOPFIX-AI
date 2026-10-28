import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { firestore, isConfigured as firestoreConfigured } from './lib/firestore.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', async (req, res) => {
  let firestoreConnected = false;

  if (firestoreConfigured && firestore) {
    try {
      await firestore.collection('complaints').limit(1).get();
      firestoreConnected = true;
    } catch (err) {
      console.error('[Health] Firestore check failed:', err.message);
    }
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      firestore: {
        configured: firestoreConfigured,
        connected: firestoreConnected,
      },
      groq: !!process.env.GROQ_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    }
  });
});

// Routes
import complaintsRouter from './routes/complaints.js';
import analysisRouter from './routes/analysis.js';

app.use('/api/complaints', complaintsRouter);
app.use('/api/analysis', analysisRouter);

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`\n🔧 LoopFix AI Server running on http://localhost:${PORT}`);
  console.log(`   Firestore: ${firestoreConfigured ? '✅ configured' : '⚠️  not configured (demo mode)'}`);
  console.log(`   Groq AI:  ${process.env.GROQ_API_KEY ? '✅ configured' : '⚠️  not configured'}`);
  console.log(`   Gemini AI: ${process.env.GEMINI_API_KEY
    ? process.env.GROQ_API_KEY ? '✅ configured as backup' : '✅ configured as primary provider'
    : '⚠️  not configured'}\n`);
});

export default app;
