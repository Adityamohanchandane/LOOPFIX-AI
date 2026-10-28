import express from 'express';
import { analyzeComplaint, isConfigured as groqConfigured } from '../lib/groq.js';
import { ruleBasedClassify, detectRecurringIssues } from '../lib/similarity.js';
import { supabase, isConfigured as supabaseConfigured } from '../lib/supabase.js';

const router = express.Router();

// POST /api/analysis/analyze — analyze a complaint with AI or fallback
router.post('/analyze', async (req, res) => {
  try {
    const { description, location, building, floor } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' });
    }

    const effectiveLocation = location || [building, floor].filter(Boolean).join(', ') || '';

    let result;
    let analysisSource;

    if (groqConfigured) {
      const aiResult = await analyzeComplaint(description.trim(), effectiveLocation);

      if (aiResult.success) {
        result = aiResult.data;
        analysisSource = 'ai';
      } else {
        // AI failed — use rule-based fallback
        result = ruleBasedClassify(description.trim(), effectiveLocation);
        analysisSource = 'fallback';
        console.warn('[Analysis] AI failed, using fallback:', aiResult.error);
      }
    } else {
      // No AI configured — use rule-based fallback
      result = ruleBasedClassify(description.trim(), effectiveLocation);
      analysisSource = 'fallback';
    }

    // Get historical complaints for recurring detection
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    let historical = [];

    if (supabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('complaints')
          .select('id, description, normalized_description, category, location, building, status, urgency, ai_title, created_at, resolved_at, recurring_match_ids')
          .gte('created_at', ninetyDaysAgo)
          .limit(200);
        historical = data || [];
      } catch (dbErr) {
        console.warn('[Analysis] Could not fetch historical complaints:', dbErr.message);
      }
    } else {
      // Use demo store if available (imported from complaints router)
      // Historical matching will be limited to what's in memory
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
      configured: groqConfigured,
      provider: groqConfigured ? 'Groq (llama-3.1-8b-instant)' : null,
      fallback: 'Rule-based classification',
    },
    database: {
      configured: supabaseConfigured,
      provider: supabaseConfigured ? 'Supabase PostgreSQL' : null,
      mode: supabaseConfigured ? 'live' : 'demo',
    },
  });
});

export default router;
