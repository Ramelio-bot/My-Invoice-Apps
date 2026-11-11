import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleMyInvoicePost, uploadMediaToUguu } from './repliz_service.mjs';

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

export async function runScheduleFeed06(customImagePath = null) {
  console.log('=== SCHEDULING FEED-06 FOR MY INVOICE (IG & FB) ===');
  console.log(`Current Time (WIB): ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);

  const title = 'MASIH PAKAI BUKU KWITANSI SOBEK MANUAL?';
  const captionFile = 'Feed-06_Caption.txt';
  const targetDate = new Date('2026-11-11T12:30:00.000Z'); // 19:30 WIB

  const diffHours = (targetDate.getTime() - Date.now()) / (3600 * 1000);
  console.log(`Target Time: ${targetDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
  console.log(`Hours Ahead: ${diffHours.toFixed(2)} hours`);

  if (diffHours <= 0) {
    throw new Error(`Target time is in the past!`);
  }
  if (diffHours > 72.0) {
    throw new Error(`Exceeds 72h rule!`);
  }

  const imagePath = customImagePath || path.join(KONTEN_DIR, 'Feed-06_Masih_Pakai_Buku_Kwitansi_Manual.jpg');
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found: ${imagePath}`);
  }

  console.log(`Local image file: ${imagePath}`);
  console.log(`Uploading to direct host with HTTP 200 verification...`);
  const mediaUrl = await uploadMediaToUguu(imagePath);
  console.log(`Media URL verified: ${mediaUrl}`);

  const caption = readCaption(captionFile);

  console.log(`Submitting to Repliz API for Instagram (@myinvoice.space) and Facebook...`);
  const result = await scheduleMyInvoicePost({
    title,
    caption,
    imageUrl: mediaUrl,
    scheduleAt: targetDate
  });

  console.log('\n=== SCHEDULE RESULT ===');
  console.log('Instagram Schedule:', JSON.stringify(result.instagram, null, 2));
  console.log('Facebook Schedule :', JSON.stringify(result.facebook, null, 2));

  return { mediaUrl, result };
}

if (process.argv[1]?.endsWith('schedule_feed_06.mjs')) {
  runScheduleFeed06().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
  });
}
