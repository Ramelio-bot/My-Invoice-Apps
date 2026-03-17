import pkg from '@supabase/auth-helpers-nextjs';
const { createPagesServerClient } = pkg;

export default async function handler(req, res) {
  console.log('[CALLBACK] Request received');
  const { code } = req.query;

  if (code) {
    console.log('[CALLBACK] Code found, initializing Supabase client');
    
    if (typeof createPagesServerClient !== 'function') {
      console.error('[CALLBACK ERROR] createPagesServerClient is not a function. pkg type:', typeof pkg);
      return res.status(500).json({ error: 'Server initialization error' });
    }

    const supabase = createPagesServerClient({ req, res });
    
    try {
      console.log('[CALLBACK] Exchanging code for session...');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('[CALLBACK ERROR] exchangeCodeForSession:', error.message);
        return res.redirect(303, '/?error=auth_callback_failed');
      }
      console.log('[CALLBACK] Exchange success');
    } catch (err) {
      console.error('[CALLBACK CRITICAL ERROR]:', err);
      return res.redirect(303, '/?error=auth_callback_failed');
    }
  }

  console.log('[CALLBACK] Redirecting to /dashboard');
  return res.redirect(303, '/dashboard');
}
