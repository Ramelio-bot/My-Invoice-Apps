import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleMyInvoicePost } from './repliz_service.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const KONTEN_DIR = path.resolve(__dirname, '../Konten Upload');

function readCaption(fileName) {
  const fullPath = path.join(KONTEN_DIR, fileName);
  const text = fs.readFileSync(fullPath, 'utf-8');
  const captionMatch = text.match(/CAPTION:\r?\n([\s\S]*?)\r?\nHASHTAGS:\r?\n([\s\S]*)$/);
  if (captionMatch) {
    return `${captionMatch[1].trim()}\n\n${captionMatch[2].trim()}`;
  }
  return text;
}

const ITEMS = [
  {
    code: 'Feed-09',
    title: 'JUALAN LARIS TAPI NGGAK TAHU MODAL ASLI PER PORSI?',
    captionFile: 'Feed-09_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=17N08QXS9AuF2IWt9OgpHjWqR9M6oQbMO&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-14T12:30:00.000Z') // Sabtu, 14 Nov 2026 @ 19:30 WIB
  },
  {
    code: 'Feed-10',
    title: 'TAGIHAN SERING MACET KARENA KLIEN LUPA TRANSFER?',
    captionFile: 'Feed-10_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=1A2Z5laWTX-K1W2dNtCSyAFz4HkbXpFjr&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-15T12:30:00.000Z') // Minggu, 15 Nov 2026 @ 19:30 WIB
  },
  {
    code: 'Feed-11',
    title: 'PUNYA BANYAK CABANG TAPI HARUS TUNGGU REKAP MANUAL?',
    captionFile: 'Feed-11_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=1OgePTDvHyLcF994Cau0R0u8sp53THNa9&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-16T12:30:00.000Z') // Senin, 16 Nov 2026 @ 19:30 WIB
  }
];

async function run() {
  console.log('=== SCHEDULING FEED-09, FEED-10, FEED-11 (72H ROLLING BATCH) ===');
  console.log(`Current Time (WIB): ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`);

  const results = [];

  for (const item of ITEMS) {
    const diffHours = (item.targetDate.getTime() - Date.now()) / (3600 * 1000);
    console.log(`------------------------------------------------------------`);
    console.log(`[${item.code}] ${item.title}`);
    console.log(`Target Time: ${item.targetDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
    console.log(`Hours Ahead: ${diffHours.toFixed(2)} hours`);

    if (diffHours <= 0) {
      throw new Error(`[ERROR] Target time is in the past!`);
    }
    if (diffHours > 72.0) {
      throw new Error(`[HARD RULE VIOLATION] Target time is > 72 hours ahead! (${diffHours.toFixed(1)}h)`);
    }

    // Pre-flight check on direct GDrive URL
    console.log(`Checking GDrive direct URL: ${item.gdriveUrl}`);
    const checkRes = await fetch(item.gdriveUrl, { method: 'HEAD' });
    if (!checkRes.ok) {
      throw new Error(`GDrive pre-flight failed (${checkRes.status}): ${item.gdriveUrl}`);
    }
    console.log(`GDrive URL verified HTTP 200 OK.`);

    const caption = readCaption(item.captionFile);

    console.log(`Submitting to Repliz API for Instagram (@myinvoice.space) and Facebook Page (My Invoice)...`);
    const res = await scheduleMyInvoicePost({
      title: item.title,
      caption,
      imageUrl: item.gdriveUrl,
      scheduleAt: item.targetDate
    });

    console.log(`Instagram Schedule ID:`, res.instagram?.scheduleId || res.instagram?.error);
    console.log(`Facebook Schedule ID :`, res.facebook?.scheduleId || res.facebook?.error);

    results.push({
      item,
      instagram: res.instagram,
      facebook: res.facebook
    });

    // Pause between calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n============================================================');
  console.log('ALL 3 FEEDS SCHEDULED SUCCESSFULLY!');
  console.log('============================================================');
  return results;
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
