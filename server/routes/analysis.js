import express from 'express';
import {
  analyzeComplaint,
  aiConfigured,
  isConfigured as groqConfigured,
  isGeminiConfigured,
} from '../lib/groq.js';
import { detectRecurringIssues } from '../lib/similarity.js';
import { firestore, isConfigured as firestoreConfigured } from '../lib/firestore.js';
import { demoStore } from './complaints.js';

const router = express.Router();

// POST /api/analysis/analyze — analyze a complaint with AI or fallback
router.post('/analyze', async (req, res) => {
  try {
    const { description, location, building, floor } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const effectiveLocation = location || [building, floor].filter(Boolean).join(', ') || '';

    const aiResult = await analyzeComplaint(description.trim(), effectiveLocation);
    const result = aiResult.data;
    const analysisSource = aiResult.usedFallback ? 'fallback' : 'ai';
    const analysisProvider = aiResult.provider || null;

    // Get historical complaints for recurring detection
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let historical = [];

    if (firestoreConfigured && firestore) {
      try {
        const snapshot = await firestore.collection('complaints')
          .where('created_at', '>=', ninetyDaysAgo)
          .orderBy('created_at', 'desc')
          .limit(200)
          .get();
        historical = snapshot.docs.map((doc) => doc.data());
      } catch (dbErr) {
        console.warn('[Analysis] Could not fetch historical complaints:', dbErr.message);
      }
    } else {
      historical = demoStore.complaints.filter(c => c.created_at >= ninetyDaysAgo);
    }

    // Detect recurring issues
    const tempComplaint = {
      description,
      normalized_description: result.normalized_description,
      category: result.category,
      location: result.location || effectiveLocation,
    };

    const recurringMatches = detectRecurringIssues(tempComplaint, historical);

    res.json({
      analysis: result,
      analysisSource, // 'ai' | 'fallback'
      analysisProvider,
      recurring: {
        matches: recurringMatches,
        count: recurringMatches.length,
        hasRecurring: recurringMatches.some(m => m.matchType === 'recurring'),
        hasDuplicate: recurringMatches.some(m => m.matchType === 'duplicate'),
      },
    });
  } catch (err) {
    console.error('[POST /analysis/analyze]', err.message);
    res.status(500).json({ error: 'Analysis failed: ' + err.message });
  }
});

// GET /api/analysis/status — check AI and DB service status
router.get('/status', (req, res) => {
  res.json({
    ai: {
      configured: aiConfigured,
      provider: groqConfigured
        ? 'Groq (openai/gpt-oss-20b)'
        : isGeminiConfigured ? 'Google Gemini (gemini-2.5-flash)' : null,
      backupProvider: groqConfigured && isGeminiConfigured
        ? 'Google Gemini (gemini-2.5-flash)'
        : 'Rule-based classification',
      fallback: 'Rule-based classification',
    },
    database: {
      configured: firestoreConfigured,
      provider: firestoreConfigured ? 'Firebase Cloud Firestore' : null,
      mode: firestoreConfigured ? 'live' : 'demo',
    },
  });
});

export default router;
