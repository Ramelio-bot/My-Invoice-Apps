export default async function handler(req, res) {
  // Ambil path dari URL asli (misal: /auth/v1/authorize)
  // req.url biasanya mencakup query params
  const supabaseBase = 'https://xrzdcqnezhcezitolkuu.supabase.co';
  const targetUrl = `${supabaseBase}${req.url}`;
  
  const options = {
    method: req.method,
    headers: { ...req.headers },
    redirect: 'manual', // Sangat penting: jangan biarkan server-side fetch otomatis redirect
  };

  // Hapus host agar tidak konflik
  delete options.headers.host;

  // Forward Body jika ada
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, options);
    const status = response.status;
    const resHeaders = response.headers;

    // Salin semua header balik ke client
    resHeaders.forEach((value, key) => {
      // Kita perlu rewrite Location header jika ada redirect
      if (key.toLowerCase() === 'location') {
        let location = value;
        
        // 1. Ganti domain Supabase ke domain kita sendiri
        if (location.includes('xrzdcqnezhcezitolkuu.supabase.co')) {
          location = location.replace('https://xrzdcqnezhcezitolkuu.supabase.co', 'https://www.myinvoice.space');
        }

        // 2. Ganti redirect_uri jika ini adalah redirect ke Google
        // Kita paksa Google melihat redirect_uri tertuju ke domain kita
        if (location.includes('accounts.google.com') && location.includes('redirect_uri=')) {
          // Cari redirect_uri di dalam Location string dan ganti secara paksa
          // Supabase biasanya mengirim: redirect_uri=https://xrz...supabase.co/auth/v1/callback
          location = location.replace(
            /redirect_uri=https%3A%2F%2Fxrzdcqnezhcezitolkuu\.supabase\.co%2Fauth%2Fv1%2Fcallback/g,
            'redirect_uri=https%3A%2F%2Fwww.myinvoice.space%2Fapi%2Fauth%2Fcallback'
          );
        }

        res.setHeader('Location', location);
      } else if (key.toLowerCase() !== 'transfer-encoding' && key.toLowerCase() !== 'content-encoding') {
        // Lewati encoding agar tidak double-compressed
        res.setHeader(key, value);
      }
    });

    res.status(status);

    // Forward body response balik ke client
    const buffer = await response.arrayBuffer();
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('[PROXY ERROR]:', error);
    return res.status(500).json({ error: 'Auth Proxy Error', details: error.message });
  }
}
