import { createClient } from '@supabase/supabase-js';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// HARDCODED: Base URL diatur ke domain sendiri agar proksi Vercel aktif (Branding)
const siteUrl = "https://www.myinvoice.space";

export const supabase = createClient(siteUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true
  }
});
