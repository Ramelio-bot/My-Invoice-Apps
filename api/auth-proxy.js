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
  delete options.headers.connection; // Seringkali bermasalah di proxy

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
        // Khusus Set-Cookie, gunakan array jika ada multiple
        const cookies = resHeaders.get('set-cookie');
        if (cookies) {
          // split by comma but respect dates in cookies
          res.setHeader('Set-Cookie', cookies);
        }
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
