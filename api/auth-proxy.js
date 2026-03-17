export default async function handler(req, res) {
  console.log('[PROXY] Request URL:', req.url);
  console.log('[PROXY] Request Method:', req.method);

  const supabaseBase = 'https://xrzdcqnezhcezitolkuu.supabase.co';
  const targetUrl = `${supabaseBase}${req.url}`;
  
  const options = {
    method: req.method,
    headers: { ...req.headers },
    redirect: 'manual', 
  };

  delete options.headers.host;
  delete options.headers.connection; 

  console.log('[PROXY] Incoming Cookies:', req.headers.cookie ? 'Present' : 'None');
  if (req.headers.cookie) {
    const hasVerifier = req.headers.cookie.includes('code-verifier');
    console.log('[PROXY] PKCE code-verifier present in incoming cookie:', hasVerifier);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  }

  try {
    console.log('[PROXY] Fetching from Supabase:', targetUrl);
    const response = await fetch(targetUrl, options);
    const status = response.status;
    const resHeaders = response.headers;

    console.log('[PROXY] Supabase Response Status:', status);

    // Salin semua header balik ke client
    resHeaders.forEach((value, key) => {
      if (key.toLowerCase() === 'location') {
        let location = value;
        
        console.log('[PROXY] Original Location Header:', location);

        if (location.includes('xrzdcqnezhcezitolkuu.supabase.co')) {
          location = location.replace('https://xrzdcqnezhcezitolkuu.supabase.co', 'https://www.myinvoice.space');
        }

        if (location.includes('accounts.google.com') && location.includes('redirect_uri=')) {
          location = location.replace(
            /redirect_uri=https%3A%2F%2Fxrzdcqnezhcezitolkuu\.supabase\.co%2Fauth%2Fv1%2Fcallback/g,
            'redirect_uri=https%3A%2F%2Fwww.myinvoice.space%2Fapi%2Fauth%2Fcallback'
          );
        }

        console.log('[PROXY] Modified Location Header:', location);
        res.setHeader('Location', location);
      } else if (key.toLowerCase() === 'set-cookie') {
        // AMBIL SEMUA COOKIE DAN REWRITE DOMAIN
        // Gunakan getSetCookie() (Node.js 18+) untuk multiple headers
        const rawCookies = response.headers.getSetCookie 
          ? response.headers.getSetCookie() 
          : resHeaders.get('set-cookie')?.split(', ') || [];

        const processedCookies = rawCookies.map(cookie => {
          // Ganti domain supabase ke domain kita
          return cookie.replace(/domain=\.xrzdcqnezhcezitolkuu\.supabase\.co/gi, 'domain=.myinvoice.space')
                       .replace(/domain=xrzdcqnezhcezitolkuu\.supabase\.co/gi, 'domain=www.myinvoice.space');
        });

        console.log('[PROXY] Processed Cookies:', processedCookies);
        res.setHeader('Set-Cookie', processedCookies);
      } else if (!['transfer-encoding', 'content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    res.status(status);

    const buffer = await response.arrayBuffer();
    console.log('[PROXY] Sending Response Body, size:', buffer.byteLength);
    return res.send(Buffer.from(buffer));

  } catch (error) {
    console.error('[PROXY CRITICAL ERROR]:', error);
    return res.status(500).json({ 
      error: 'Auth Proxy Error', 
      message: error.message,
      stack: error.stack 
    });
  }
}
