import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native .env parser without dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const localEnv = loadEnv();
const REPLIZ_BASE_URL = 'https://api.repliz.com/public';

export const REPLIZ_CONFIG = {
  accessKey: process.env.REPLIZ_ACCESS_KEY || localEnv.REPLIZ_ACCESS_KEY || '',
  secretKey: process.env.REPLIZ_SECRET_KEY || localEnv.REPLIZ_SECRET_KEY || '',
  accounts: {
    instagram: process.env.REPLIZ_IG_ACCOUNT_ID || localEnv.REPLIZ_IG_ACCOUNT_ID || '6aea049efc43f81b78528ba0',
    facebook: process.env.REPLIZ_FB_ACCOUNT_ID || localEnv.REPLIZ_FB_ACCOUNT_ID || '6aea0527fc43f81b78528c4b'
  }
};

/**
 * Basic Auth Header for Repliz
 */
function getAuthHeader(accessKey = REPLIZ_CONFIG.accessKey, secretKey = REPLIZ_CONFIG.secretKey) {
  const token = Buffer.from(`${accessKey}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Fetch connected Repliz accounts
 */
export async function getReplizAccounts() {
  const res = await fetch(`${REPLIZ_BASE_URL}/account?page=1&limit=20`, {
    headers: {
      'Authorization': getAuthHeader()
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch accounts (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Fetch scheduled posts from Repliz
 */
export async function getReplizSchedules(page = 1, limit = 10) {
  const res = await fetch(`${REPLIZ_BASE_URL}/schedule?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': getAuthHeader()
    }
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch schedules (${res.status}): ${err}`);
  }

  return await res.json();
}

/**
 * Schedule a single post on Repliz
 * @param {Object} params
 * @param {string} params.accountId - Repliz Account ID
 * @param {string} params.type - 'text' | 'image' | 'video' | 'reel' | 'album' | 'link'
 * @param {string} [params.title] - Title (required for Youtube/Facebook Video)
 * @param {string} params.description - Post caption / copy text
 * @param {Array<{url: string, type?: string, alt?: string}>} [params.medias] - Array of media objects
 * @param {string|Date} [params.scheduleAt] - ISO 8601 string or Date (defaults to 3 minutes from now)
 */
export async function createSchedule({
  accountId,
  type = 'image',
  title = '',
  description = '',
  medias = [],
  scheduleAt = null
}) {
  if (!accountId) throw new Error('accountId is required');
  if (!description) throw new Error('description (caption) is required');

  // Format schedule date (Repliz requires ISO 8601 string in the future)
  const targetDate = scheduleAt
    ? (typeof scheduleAt === 'string' ? new Date(scheduleAt) : scheduleAt)
    : new Date(Date.now() + 3 * 60 * 1000); // 3 minutes ahead

  // HARD RULE: REPLIZ 72-HOUR BATCHING WINDOW
  const now = Date.now();
  const diffHours = (targetDate.getTime() - now) / (1000 * 60 * 60);

  if (diffHours <= 0) {
    throw new Error(`[REPLIZ RULE VIOLATION] Target schedule time (${targetDate.toISOString()}) is in the past! (diff_hours: ${diffHours.toFixed(2)})`);
  }

  if (diffHours > 72.0) {
    throw new Error(
      `[HARD RULE: REPLIZ 72-HOUR BATCHING WINDOW VIOLATION]\n` +
      `Target scheduleAt (${targetDate.toISOString()}) is ${diffHours.toFixed(1)} hours ahead (> 72.0 hours).\n` +
      `Hosting file berisiko hangus (404) sebelum jam tayang.\n` +
      `STATUS: HOLD LOCALLY di disk, dan jadwalkan ke Repliz saat rentang waktu <= 72.0 jam!`
    );
  }

  // Normalize medias array (ensure customThumbnail is never true for shorts/video)
  const formattedMedias = (medias || []).map(m => {
    if (typeof m === 'string') {
      return { url: m, type: 'image', alt: title || 'MyInvoice Post', customThumbnail: false };
    }
    return {
      url: m.url,
      type: m.type || 'image',
      alt: m.alt || title || 'MyInvoice Post',
      customThumbnail: false
    };
  });

  const payload = {
    accountId,
    type,
    description,
    scheduleAt: targetDate.toISOString(),
    medias: formattedMedias
  };

  if (title) {
    payload.title = title;
  }

  const res = await fetch(`${REPLIZ_BASE_URL}/schedule`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Repliz Schedule Error (${res.status}): ${JSON.stringify(data)}`);
  }

  return data;
}

/**
 * Upload local media file to temporary direct hosting (Uguu) for Repliz
 * Files on Uguu are valid for 48-72 hours (strictly complying with 72-Hour Rule)
 * @param {string} filePath - Absolute or relative path to local media file
 * @returns {Promise<string>} Direct public URL
 */
export async function uploadMediaToUguu(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File does not exist: ${resolvedPath}`);
  }

  const fileBuffer = fs.readFileSync(resolvedPath);
  const fileName = path.basename(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : (ext === '.mp4') ? 'video/mp4' : 'application/octet-stream';

  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  formData.append('files[]', blob, fileName);

  const res = await fetch('https://uguu.se/upload.php', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Uguu upload failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  if (!data.success || !data.files?.[0]?.url) {
    throw new Error(`Uguu upload response invalid: ${JSON.stringify(data)}`);
  }

  const publicUrl = data.files[0].url;

  // Pre-flight check: verify URL returns HTTP 200
  const checkRes = await fetch(publicUrl, { method: 'HEAD' });
  if (!checkRes.ok) {
    throw new Error(`Pre-flight URL verification failed (${checkRes.status}) for ${publicUrl}`);
  }

  return publicUrl;
}

/**
 * Convenience method to schedule a post for both MyInvoice Instagram and Facebook Page
 */
export async function scheduleMyInvoicePost({
  title = '',
  caption = '',
  imageUrl = '',
  imagePath = '',
  scheduleAt = null
}) {
  const results = {};

  let finalUrl = imageUrl;
  if (!finalUrl && imagePath) {
    console.log(`Uploading local media ${imagePath} to temporary host...`);
    finalUrl = await uploadMediaToUguu(imagePath);
    console.log(`Media uploaded successfully: ${finalUrl}`);
  }

  const medias = finalUrl ? [{ url: finalUrl, type: 'image', alt: title }] : [];

  // 1. Post to Instagram
  try {
    results.instagram = await createSchedule({
      accountId: REPLIZ_CONFIG.accounts.instagram,
      type: 'image',
      title,
      description: caption,
      medias,
      scheduleAt
    });
  } catch (err) {
    results.instagram = { error: err.message };
  }

  // 2. Post to Facebook Page
  try {
    results.facebook = await createSchedule({
      accountId: REPLIZ_CONFIG.accounts.facebook,
      type: medias.length > 0 ? 'image' : 'text',
      title,
      description: caption,
      medias,
      scheduleAt
    });
  } catch (err) {
    results.facebook = { error: err.message };
  }

  return results;
}

// CLI Tester
if (process.argv[1]?.endsWith('repliz_service.mjs')) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'status') {
    console.log('=== REPLIZ INTEGRATION STATUS ===');
    console.log('Access Key         :', REPLIZ_CONFIG.accessKey);
    console.log('Target IG ID       :', REPLIZ_CONFIG.accounts.instagram);
    console.log('Target FB Page ID  :', REPLIZ_CONFIG.accounts.facebook);

    getReplizAccounts().then(accs => {
      console.log('\nConnected Accounts Verified:');
      const myAccounts = accs.docs.filter(a =>
        a._id === REPLIZ_CONFIG.accounts.instagram ||
        a._id === REPLIZ_CONFIG.accounts.facebook
      );
      myAccounts.forEach(a => {
        console.log(`- [${a.type.toUpperCase()}] ${a.name} (@${a.username}) -> ID: ${a._id} (Connected: ${a.isConnected})`);
      });
      console.log('\nIntegration Status: READY TO POST AND SCHEDULE!');
    }).catch(console.error);
  }
}
