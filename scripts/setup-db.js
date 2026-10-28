import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log('ERROR: Supabase credentials not configured');
  process.exit(1);
}

const sql = `
CREATE TABLE IF NOT EXISTS complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  normalized_description TEXT,
  category VARCHAR(50) DEFAULT 'Other',
  location TEXT,
  building VARCHAR(100),
  floor VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'Medium',
  department VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Open',
  ai_title VARCHAR(200),
  next_action TEXT,
  raw_ai_response JSONB,
  is_demo BOOLEAN DEFAULT false,
  recurring_match_ids TEXT[] DEFAULT '{}',
  recurring_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS complaints_category_idx ON complaints(category);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON complaints(status);
CREATE INDEX IF NOT EXISTS complaints_urgency_idx ON complaints(urgency);
CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS complaints_location_idx ON complaints(location);
`;

// Try Supabase SQL endpoint (available in modern Supabase)
async function createTable() {
  // Method 1: Try the /pg/query endpoint (Supabase v2+)
  const endpoints = [
    '/rest/v1/rpc/exec_sql',  // Custom RPC (unlikely unless created)
  ];

  // Use raw SQL via Supabase Management API
  const pgEndpoint = `${url}/pg`;
  console.log('Trying /pg endpoint...');
  
  try {
    const pgRes = await fetch(pgEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    
    if (pgRes.ok) {
      console.log('Table created via /pg endpoint!');
      return true;
    } else {
      const text = await pgRes.text();
      console.log('/pg response:', pgRes.status, text.slice(0, 200));
    }
  } catch (e) {
    console.log('/pg endpoint not available:', e.message?.slice(0, 100));
  }

  // Method 2: Try Supabase SQL API
  const sqlApiEndpoint = `${url}/rest/v1/rpc/`;
  console.log('\nTrying RPC list...');
  
  try {
    const rpcRes = await fetch(sqlApiEndpoint, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
    console.log('RPC list status:', rpcRes.status);
  } catch (e) {
    console.log('RPC list failed:', e.message?.slice(0, 100));
  }

  console.log('\n--- CANNOT CREATE TABLE PROGRAMMATICALLY ---');
  console.log('You need to run the SQL manually in Supabase Dashboard.');
  console.log('Go to: https://supabase.com/dashboard → Your project → SQL Editor');
  console.log('Paste the contents of supabase-schema.sql and click Run.');
  return false;
}

const created = await createTable();

// Test if the table exists now
import { createClient } from '@supabase/supabase-js';
const sb = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await sb.from('complaints').select('id').limit(1);
if (error) {
  console.log('\nTable check: DOES NOT EXIST yet — code:', error.code);
  console.log('Message:', error.message);
} else {
  console.log('\nTable check: EXISTS! Rows found:', (data || []).length);
}
