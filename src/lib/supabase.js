import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffbjvrwkvnwocuyapajo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmYmp2cndrdm53b2N1eWFwYWpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mjc0NzE2OCwiZXhwIjoyMDk4MzIzMTY4fQ.TEvCvJkG9cNb8hH4c826o8fZ3q3qrny95Xd_58ETdPU'; // ← Paste the legacy anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);