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

const BATCH_ITEMS = [
  {
    code: 'Feed-05',
    title: 'KIRIM TOTALAN CUMA DI CHAT WA?',
    imageFile: 'Feed-05_Kirim_Totalan_Cuma_Di_Chat_WA.jpg',
    imageUrl: 'https://raw.githubusercontent.com/Ramelio-bot/My-Invoice-Apps/main/public/images/feed_05_kirim_totalan_chat_wa.jpg',
    captionFile: 'Feed-05_Caption.txt',
    // Selasa, 10 Nov 2026 @ 19:30 WIB (12:30 UTC)
    scheduleDate: new Date('2026-11-10T12:30:00.000Z')
  }
];

async function runBatch() {
  console.log('=== STARTING 72-HOUR ROLLING BATCH SCHEDULING ===');
  console.log(`Current Time (WIB): ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
  console.log(`Items in Queue: ${BATCH_ITEMS.length}\n`);

  const report = [];

  for (const item of BATCH_ITEMS) {
    const diffHours = (item.scheduleDate.getTime() - Date.now()) / (3600 * 1000);
    console.log(`------------------------------------------------------------`);
    console.log(`[${item.code}] ${item.title}`);
    console.log(`Target Time: ${item.scheduleDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
    console.log(`Hours Ahead: ${diffHours.toFixed(2)} hours`);

    if (diffHours <= 0) {
      console.warn(`[SKIP] Target time has already passed.`);
      continue;
    }

    if (diffHours > 72.0) {
      console.error(`[HARD RULE VIOLATION] ${diffHours.toFixed(1)}h > 72.0h. HOLDING LOCALLY.`);
      continue;
    }

    // 1. Verify media URL
    let mediaUrl = item.imageUrl;
    if (mediaUrl) {
      const headRes = await fetch(mediaUrl, { method: 'HEAD' });
      if (!headRes.ok) {
        throw new Error(`Media URL not accessible (${headRes.status}): ${mediaUrl}`);
      }
      console.log(`Media URL (Permanent GitHub Raw HTTP 200 verified): ${mediaUrl}`);
    } else {
      const imgPath = path.join(KONTEN_DIR, item.imageFile);
      console.log(`Uploading ${item.imageFile} to temporary host...`);
      mediaUrl = await uploadMediaToUguu(imgPath);
      console.log(`Media URL (HTTP 200 verified): ${mediaUrl}`);
    }

    // 2. Read formatted caption
    const caption = readCaption(item.captionFile);

    // 3. Schedule via Repliz
    console.log(`Registering to Repliz API for Instagram & Facebook...`);
    const res = await scheduleMyInvoicePost({
      title: item.title,
      caption,
      imageUrl: mediaUrl,
      scheduleAt: item.scheduleDate
    });

    console.log(`Repliz IG Schedule ID:`, res.instagram?.scheduleId || res.instagram?.error);
    console.log(`Repliz FB Schedule ID:`, res.facebook?.scheduleId || res.facebook?.error);

    report.push({
      code: item.code,
      title: item.title,
      targetWIB: item.scheduleDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB',
      hoursAhead: diffHours.toFixed(1) + 'h',
      mediaUrl,
      igId: res.instagram?.scheduleId || res.instagram?.error,
      fbId: res.facebook?.scheduleId || res.facebook?.error
    });

    // Small delay between calls
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log('\n================ BATCH EXECUTION REPORT ================');
  console.table(report);
  return report;
}

runBatch().catch(console.error);
