const INDEXNOW_KEY = 'e83f2a9c1d4e7b5a0f6c2e8a1d3b5c7e';
const HOST = 'myinvoice.space';
const KEY_LOCATION = `https://${HOST}/${INDEXNOW_KEY}.txt`;

const URL_LIST = [
  `https://${HOST}/`,
  `https://${HOST}/aplikasi-kasir-offline`,
  `https://${HOST}/buat-invoice-gratis`,
  `https://${HOST}/buat-kwitansi-gratis`,
  `https://${HOST}/buat-penawaran-harga-gratis`,
  `https://${HOST}/kalkulator-hpp-gratis`,
  `https://${HOST}/aplikasi-kasir-kafe`,
  `https://${HOST}/software-invoice-freelance`,
  `https://${HOST}/upgrade`,
  `https://${HOST}/about`,
  `https://${HOST}/contact`,
  `https://${HOST}/blog`,
  `https://${HOST}/affiliate`,
  `https://${HOST}/karir`
];

async function submitIndexNow() {
  console.log(`=== SUBMITTING ${URL_LIST.length} URLS TO INDEXNOW ===`);
  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    urlList: URL_LIST
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (res.status === 200 || res.status === 202) {
      console.log(`[SUCCESS] IndexNow accepted URLs (HTTP ${res.status}). Bing and partner engines will crawl shortly.`);
    } else {
      const text = await res.text();
      console.warn(`[NOTICE] IndexNow response (${res.status}):`, text);
    }
  } catch (err) {
    console.error('[ERROR] Failed to send IndexNow request:', err.message);
  }
}

submitIndexNow();
