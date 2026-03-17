import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createPagesServerClient } = require('@supabase/auth-helpers-nextjs');

export default async function handler(req, res) {
  console.log('[CALLBACK] Request received');
  const { code } = req.query;

  if (code) {
    console.log('[CALLBACK] Code found, initializing Supabase client');
    
    if (typeof createPagesServerClient !== 'function') {
      console.error('[CALLBACK ERROR] createPagesServerClient is not a function.');
      return res.status(500).json({ error: 'Server initialization error' });
    }

    try {
      const supabase = createPagesServerClient({ req, res });
      console.log('[CALLBACK] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[CALLBACK ERROR] exchangeCodeForSession:', error.message);
        return res.redirect(303, '/?error=auth_callback_failed');
      }
      console.log('[CALLBACK] Exchange success');
    } catch (err) {
      console.error('[CALLBACK CRITICAL ERROR]:', err);
      // Fallback: Jika auth-helpers gagal, coba arahkan saja ke dashboard
      // User mungkin sudah punya session dari proxy
      return res.redirect(303, '/dashboard?fallback=1');
    }
  }

  console.log('[CALLBACK] Redirecting to /dashboard');
  return res.redirect(303, '/dashboard');
}
