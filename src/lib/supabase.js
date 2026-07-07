import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ffbjvrwkvnwocuyapajo.supabase.co';
const supabaseAnonKey = 'sb_publishable_ufEz20LhJXOkvNUBfWT-GQ_ZK-e75fo'; // ← Paste the legacy anon key here

export const supabase = createClient(supabaseUrl, supabaseAnonKey);