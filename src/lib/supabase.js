import { createClient } from '@supabase/supabase-js';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Site URL sebagai base URL untuk proxying Supabase (Branding)
// Pastikan VITE_SITE_URL diisi "https://www.myinvoice.space" di Vercel
const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;

export const supabase = createClient(siteUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce', // Wajib untuk exchange code di server-side callback
    persistSession: true,
    detectSessionInUrl: true
  }
});
