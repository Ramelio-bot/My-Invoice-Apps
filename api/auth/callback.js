import pkg from '@supabase/auth-helpers-nextjs';
const { createPagesServerClient } = pkg;

export default async function handler(req, res) {
  console.log('[CALLBACK] Request received');
  
  // HARDCODED: Gunakan URL asli Supabase untuk menghindari loop domain custom
  const supabaseUrl = 'https://xrzdcqnezhcezitolkuu.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const { code } = req.query;

  if (code) {
    console.log('[CALLBACK] Code found, initializing Supabase client');
    
    try {
      const supabase = createPagesServerClient({ req, res }, {
        supabaseOptions: {
          supabaseUrl: supabaseUrl,
          supabaseKey: supabaseAnonKey
        }
      });

      console.log('[CALLBACK] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[CALLBACK ERROR] exchangeCodeForSession:', error.message);
        return res.redirect(303, '/?error=auth_callback_failed');
      }
      console.log('[CALLBACK] Exchange success');
    } catch (err) {
      console.error('[CALLBACK CRITICAL ERROR]:', err);
      return res.redirect(303, '/dashboard?fallback=1');
    }
  }

  return res.redirect(303, '/dashboard');
}
