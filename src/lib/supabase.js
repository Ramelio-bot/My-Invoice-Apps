import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Site URL untuk branding origin (Auth Proxy)
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Diperlukan untuk proses exchange code di server-side (Proxy Callback)
    persistSession: true,
    detectSessionInUrl: true
  }
});
