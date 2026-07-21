import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required in environment variables.");
  process.exit(1);
}

const sb = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Starting migration...");
  const { data, error } = await sb.rpc('exec_sql', { sql: `
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_url TEXT;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
  ` });
  
  if (error) {
    console.error("Migration failed:", error);
  } else {
    console.log("Migration succeeded. Columns added successfully!", data);
  }
}

run();
