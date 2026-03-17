import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('[CALLBACK] Request received');
  
  const supabaseUrl = 'https://xrzdcqnezhcezitolkuu.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const storageKey = 'sb-myinvoice-auth-token';

  const { code, error: errorDescription } = req.query;

  if (errorDescription) {
    console.error('[CALLBACK ERROR] Error in URL:', errorDescription);
    return res.redirect(303, '/?error=' + errorDescription);
  }

  if (code) {
    console.log('[CALLBACK] Code found, exchanging for session...');
    
    // Inisialisasi client standar
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    try {
      // Kita butuh code_verifier dari cookie yang diset oleh client (PKCE)
      // Cookie name format: storageKey + "-code-verifier"
      const verifierName = `${storageKey}-code-verifier`;
      const code_verifier = req.cookies?.[verifierName];
      
      console.log('[CALLBACK] Found code_verifier in cookie:', code_verifier ? 'Yes' : 'No');

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[CALLBACK ERROR] exchangeCodeForSession failed:', error.message);
        return res.redirect(303, '/?error=auth_exchange_failed');
      }

      const { session } = data;
      console.log('[CALLBACK] Exchange success for user:', session.user.id);

      // REDIRECT DENGAN FRAGMENT (#)
      // Ini adalah cara paling handal untuk Vite/SPA agar SDK langsung mengenali session
      // detectSessionInUrl: true di client akan menangani ini secara otomatis
      const params = new URLSearchParams();
      params.set('access_token', session.access_token);
      params.set('refresh_token', session.refresh_token);
      params.set('expires_in', session.expires_in);
      params.set('token_type', session.token_type);
      params.set('type', 'signup'); // agar trigger onAuthStateChange

      return res.redirect(303, `/dashboard#${params.toString()}`);

    } catch (err) {
      console.error('[CALLBACK CRITICAL ERROR]:', err);
      return res.redirect(303, '/?error=internal_server_error');
    }
  }

  return res.redirect(303, '/dashboard');
}
