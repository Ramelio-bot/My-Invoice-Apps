import pkg from '@supabase/auth-helpers-nextjs';
const { createPagesServerClient } = pkg;

export default async function handler(req, res) {
  console.log('[CALLBACK] Request received at /api/auth/callback');
  
  const supabaseUrl = 'https://xrzdcqnezhcezitolkuu.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const { code } = req.query;

  if (code) {
    console.log('[CALLBACK] PKCE Code detected, initializing auth-helpers client');
    
    try {
      // Inisialisasi client dengan cookieOptions explisit agar cookie tersimpan di domain kita
      const supabase = createPagesServerClient({ req, res }, {
        supabaseOptions: {
          supabaseUrl: supabaseUrl,
          supabaseKey: supabaseAnonKey,
          auth: {
            persistSession: true,
          }
        },
        cookieOptions: {
          domain: '.myinvoice.space',
          path: '/',
          sameSite: 'lax',
          secure: true,
        }
      });

      console.log('[CALLBACK] Attempting exchangeCodeForSession...');
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[CALLBACK EXCHANGE ERROR]:', error.message);
        // Tetap arahkan ke dashboard dengan error param agar user tahu
        return res.redirect(303, '/?error=exchange_failed&msg=' + encodeURIComponent(error.message));
      }

      console.log('[CALLBACK] Exchange SUCCESS for user:', data.user?.id);
      
      // Pastikan cookie sudah diset di response header oleh auth-helpers
      const cookiesAfter = res.getHeader('Set-Cookie');
      console.log('[CALLBACK] Set-Cookie headers in response:', cookiesAfter ? 'Yes' : 'No');

      // Sukses! Redirect ke dashboard
      return res.redirect(303, '/dashboard');

    } catch (err) {
      console.error('[CALLBACK CRITICAL ERROR]:', err);
      return res.redirect(303, '/?error=internal_callback_error');
    }
  }

  console.log('[CALLBACK] No code found in URL, redirecting to home');
  return res.redirect(303, '/');
}
