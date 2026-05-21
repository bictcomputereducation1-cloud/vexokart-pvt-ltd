import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await sb.rpc('exec_sql', { sql: `
    ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS weight TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS speciality TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS shelf_life TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS highlights JSONB;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications JSONB;
  ` });
  console.log("Alter diff:", data, error);
}
run();
