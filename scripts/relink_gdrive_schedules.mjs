import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { scheduleMyInvoicePost, REPLIZ_CONFIG } from './repliz_service.mjs';

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

const OLD_IDS = [
  '6af42279b9d03745801ef0ce',
  '6af42279b9d03745801ef0d8',
  '6af4235b23f8c2a2a55be6f0',
  '6af4235ba38e2b07d7621357',
  '6af4236108b071314a9eccc0',
  '6af4236108b071314a9eccc9'
];

const NEW_BATCH = [
  {
    code: 'Feed-06',
    title: 'MASIH PAKAI BUKU KWITANSI SOBEK MANUAL?',
    captionFile: 'Feed-06_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=1Sn-vnlJW9aONRaKVpWqo20VV_lBKhyBI&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-11T12:30:00.000Z') // Rabu, 11 Nov @ 19:30 WIB
  },
  {
    code: 'Feed-07',
    title: 'PENAWARAN DEAL TAPI MASIH KETIK ULANG INVOICE?',
    captionFile: 'Feed-07_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=1l_QsqnhFnUu0hIALobRJPcQPspAIJdAN&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-12T12:30:00.000Z') // Kamis, 12 Nov @ 19:30 WIB
  },
  {
    code: 'Feed-08',
    title: 'PUSING REKAP OMSET & PAJAK UMKM AKHIR BULAN?',
    captionFile: 'Feed-08_Caption.txt',
    gdriveUrl: 'https://drive.usercontent.google.com/download?id=1fetUUN33kZTIFX1dBxbrOmZRWnu4EpN-&export=download&confirm=t&ext=.jpg',
    targetDate: new Date('2026-11-13T12:30:00.000Z') // Jumat, 13 Nov @ 19:30 WIB
  }
];

async function relink() {
  const auth = 'Basic ' + Buffer.from(`${REPLIZ_CONFIG.accessKey}:${REPLIZ_CONFIG.secretKey}`).toString('base64');

  console.log('=== 1. DELETING OLD TEMPORARY (UGUU) SCHEDULES ===');
  for (const id of OLD_IDS) {
    try {
      const res = await fetch(`https://api.repliz.com/public/schedule/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': auth }
      });
      console.log(`Deleted schedule ${id}: HTTP ${res.status}`);
    } catch (err) {
      console.error(`Failed to delete ${id}:`, err.message);
    }
  }

  console.log('\n=== 2. REGISTERING NEW GOOGLE DRIVE VAULT SCHEDULES ===');
  const results = [];

  for (const item of NEW_BATCH) {
    console.log(`------------------------------------------------------------`);
    console.log(`[${item.code}] ${item.title}`);
    console.log(`Target: ${item.targetDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`);
    console.log(`GDrive URL: ${item.gdriveUrl}`);

    // Pre-flight check
    const checkRes = await fetch(item.gdriveUrl, { method: 'HEAD' });
    if (!checkRes.ok) {
      throw new Error(`GDrive URL failed pre-flight (${checkRes.status}): ${item.gdriveUrl}`);
    }
    console.log(`GDrive Direct URL verified HTTP 200 OK.`);

    const caption = readCaption(item.captionFile);
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

    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n=== SUCCESS: ALL 3 FEEDS ARE NOW LINKED TO PERMANENT GOOGLE DRIVE VAULT ===');
  return results;
}

relink().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
