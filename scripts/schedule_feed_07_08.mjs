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

const ITEMS = [
  {
    code: 'Feed-07',
    title: 'PENAWARAN DEAL TAPI MASIH KETIK ULANG INVOICE?',
    captionFile: 'Feed-07_Caption.txt',
    imageFile: 'Feed-07_Penawaran_Deal_Konversi_Invoice.jpg',
    targetDate: new Date('2026-11-12T12:30:00.000Z') // Kamis, 12 Nov 2026 @ 19:30 WIB
  },
  {
    code: 'Feed-08',
    title: 'PUSING REKAP OMSET & PAJAK UMKM AKHIR BULAN?',
    captionFile: 'Feed-08_Caption.txt',
    imageFile: 'Feed-08_Pusing_Rekap_Omset_Pajak_UMKM.jpg',
    targetDate: new Date('2026-11-13T12:30:00.000Z') // Jumat, 13 Nov 2026 @ 19:30 WIB
  }
];

async function run() {
  console.log('=== SCHEDULING FEED-07 & FEED-08 FOR MY INVOICE (IG & FB) ===');
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
      throw new Error(`[HARD RULE VIOLATION] Target time is > 72 hours ahead!`);
    }

    const imagePath = path.join(KONTEN_DIR, item.imageFile);
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found: ${imagePath}`);
    }

    console.log(`Uploading ${item.imageFile} to direct host with HTTP 200 verification...`);
    const mediaUrl = await uploadMediaToUguu(imagePath);
    console.log(`Media URL verified: ${mediaUrl}`);

    const caption = readCaption(item.captionFile);

    console.log(`Submitting to Repliz API for Instagram (@myinvoice.space) and Facebook Page...`);
    const res = await scheduleMyInvoicePost({
      title: item.title,
      caption,
      imageUrl: mediaUrl,
      scheduleAt: item.targetDate
    });

    console.log(`Instagram Schedule ID:`, res.instagram?.scheduleId || res.instagram?.error);
    console.log(`Facebook Schedule ID :`, res.facebook?.scheduleId || res.facebook?.error);

    results.push({
      item,
      mediaUrl,
      instagram: res.instagram,
      facebook: res.facebook
    });

    // Pause between calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n============================================================');
  console.log('ALL ITEMS SCHEDULED SUCCESSFULLY!');
  console.log('============================================================');
  return results;
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
