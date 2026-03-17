import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  const { code } = req.query;

  if (code) {
    // Inisialisasi Supabase client khusus server-side dengan auth-helpers
    // Ini akan menangani Cookie secara otomatis jika domain-nya sama (myinvoice.space)
    const supabase = createPagesServerClient({ req, res });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Error exchanging code for session:', error.message);
        return res.redirect(303, '/?error=auth_callback_failed');
      }
    } catch (err) {
      console.error('Unexpected error during auth callback:', err);
      return res.redirect(303, '/?error=auth_callback_failed');
    }
  }

  // Setelah session didapat (dan cookie diset), arahkan user ke dashboard
  return res.redirect(303, '/dashboard');
}
