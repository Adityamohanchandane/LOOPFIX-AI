import { createClient } from '@supabase/supabase-js';

let supabase = null;
let isConfigured = false;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });
    isConfigured = true;
    console.log('[Supabase] Client initialized');
  } catch (err) {
    console.warn('[Supabase] Failed to initialize:', err.message);
  }
} else {
  console.warn('[Supabase] Not configured — running in demo mode');
}

export { supabase, isConfigured };

// Initialize the database schema
export async function initDatabase() {
  if (!supabase) return false;

  try {
    // Create complaints table if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS complaints (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          description TEXT NOT NULL,
          normalized_description TEXT,
          category VARCHAR(50) DEFAULT 'Other',
          location TEXT NOT NULL,
          building VARCHAR(100),
          floor VARCHAR(50),
          urgency VARCHAR(20) DEFAULT 'Medium',
          department VARCHAR(100),
          status VARCHAR(20) DEFAULT 'Open',
          ai_title VARCHAR(200),
          ai_next_action TEXT,
          raw_ai_response JSONB,
          is_demo BOOLEAN DEFAULT false,
          recurring_match_ids UUID[],
          recurring_reason TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          resolved_at TIMESTAMPTZ
        );
        
        CREATE INDEX IF NOT EXISTS complaints_category_idx ON complaints(category);
        CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status);
        CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON complaints(created_at DESC);
        CREATE INDEX IF NOT EXISTS complaints_location_idx ON complaints(location);
      `
    });

    if (error && !error.message.includes('already exists')) {
      // Try a simpler approach - just query to test connectivity
      const { error: testError } = await supabase.from('complaints').select('id').limit(1);
      if (testError && testError.code === '42P01') {
        console.warn('[Supabase] complaints table does not exist. Please create it manually.');
        return false;
      }
    }

    return true;
  } catch (err) {
    console.warn('[Supabase] initDatabase error:', err.message);
    return false;
  }
}
