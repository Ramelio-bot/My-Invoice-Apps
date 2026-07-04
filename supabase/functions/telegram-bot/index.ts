import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Bot, webhookCallback } from "npm:grammy";
import { createClient } from "npm:@supabase/supabase-js";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!botToken || !supabaseUrl || !supabaseServiceKey) {
  console.error("MISSING_ENV", {
    botToken: !!botToken,
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
  });
  throw new Error("TELEGRAM_BOT_TOKEN, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are required");
}

const bot = new Bot(botToken);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── GLOBAL RATE LIMIT GUARD ──────────────────────────────────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds

async function isRateLimited(userId: number): Promise<boolean> {
  const telegram_id = userId.toString();
  
  const { data: hitCount, error } = await supabase.rpc('increment_telegram_rate_limit', { 
    p_telegram_id: telegram_id 
  });

  if (error) {
    console.error("Rate Limit Error:", error);
    return false; // Fail open if error
  }

  if (hitCount > RATE_LIMIT_MAX) {
    return true; // Blocked
  }
  
  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

// 1. SMART AMOUNT RESOLVER (KONVERSI SINGKATAN & DESIMAL)
const parseIndonesianAmount = (text: string): number | null => {
  const lowerText = text.toLowerCase();
  // Regex yang aman: menangkap seluruh kelompok angka yang terpisahkan titik/koma secara utuh
  const regex = /(?:rp\s*)?(\d+(?:[.,]\d+)*)\s*(jt|juta|rb|ribu|k|m|miliar)?/gi;
  let match;
  let maxAmount = 0;

  while ((match = regex.exec(lowerText)) !== null) {
    let numStr = match[1];
    
    // Amankan bagian desimal jika diakhiri dengan titik/koma dan 1-2 digit (contoh: ,50 atau .5)
    let decimalPart = "";
    const decimalMatch = numStr.match(/[.,](\d{1,2})$/);
    
    if (decimalMatch) {
      decimalPart = "." + decimalMatch[1];
      numStr = numStr.substring(0, numStr.length - decimalMatch[0].length);
    }
    
    // Bersihkan semua titik/koma yang bertindak sebagai pemisah ribuan
    numStr = numStr.replace(/[.,]/g, '');
    numStr = numStr + decimalPart;

    let num = parseFloat(numStr);
    if (isNaN(num)) continue;

    const suffix = match[2];
    if (suffix === 'jt' || suffix === 'juta') num *= 1000000;
    else if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') num *= 1000;
    else if (suffix === 'm' || suffix === 'miliar') num *= 1000000000;

    // Menangani baris kalimat yang memiliki banyak angka, rekam nominal tertinggi
    if (num > maxAmount) maxAmount = num;
  }
  
  return maxAmount > 0 ? maxAmount : null;
};

// 2. TOLERANT CLASSIFIER (LEXICAL ALIAS ENGINE)
const classifyTransactionType = (text: string): "income" | "expense" => {
  const lowerText = text.toLowerCase().trim();
  
  // PRIORITAS MUTLAK 1: "KATA PERTAMA ADALAH RAJA"
  const firstWord = lowerText.split(/\s+/)[0];
  
  const incomeKeywords = ['pemasukan', 'masuk', 'qris', 'transfer', 'terima', 'omset', 'omzet', 'bunga', 'dapat', 'dpt', 'jual', 'laku', 'gajian', 'cair', 'dp'];
  const expenseKeywords = ['pengeluaran', 'beban', 'bayar', 'byr', 'belanja', 'blnj', 'gaji', 'beli', 'kasbon', 'biaya', 'parkir', 'keluar', 'bensin', 'makan', 'sewa', 'utang', 'potongan', 'langganan', 'tagihan'];
  
  if (incomeKeywords.includes(firstWord)) return 'income';
  if (expenseKeywords.includes(firstWord)) return 'expense';

  // PRIORITAS 2: Jika kata pertama tidak dikenali (fallback ke regex lama di tengah kalimat)
  const incomeRegex = /\b(dapat|dpt|transfer|trf|tramsfer|transferan|masuk|msuk|masuj|omset|omzet|terima|jual|laku|gajian|cair|dp)\b/i;
  const expenseRegex = /\b(beli|bayar|byr|parkir|keluar|pengeluaran|bensin|makan|sewa|gaji|belanja|blnj|kasbon|utang|potongan|langganan|tagihan)\b/i;

  if (expenseRegex.test(lowerText)) return 'expense';
  if (incomeRegex.test(lowerText)) return 'income';

  // DEFAULT FALLBACK
  return 'expense';
};

// 3. MIDDLEWARE AUTH + AUTOMATIC OUTLET FETCH
const checkAuthAndOutlet = async (telegramId: number) => {
  const { data: userData } = await supabase
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();

  if (!userData?.user_id) return null;

  const { data: outletData } = await supabase
    .from("outlets")
    .select("id")
    .eq("user_id", userData.user_id)
    .limit(1)
    .single();

  return {
    userId: userData.user_id,
    outletId: outletData?.id || null
  };
};

// 4. MASTER EVENT HANDLER
bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;

  // ── RATE LIMIT CHECK ──────────────────────────────────────────────────────
  if (await isRateLimited(ctx.from.id)) {
    return ctx.reply("⚠️ Terlalu banyak pesan. Tunggu sebentar dan coba lagi dalam 1 menit.");
  }
  // ─────────────────────────────────────────────────────────────────────────

  const auth = await checkAuthAndOutlet(ctx.from.id);
  if (!auth) return ctx.reply("❌ Akun Telegram belum terhubung atau tidak aktif.");
  if (!auth.outletId) return ctx.reply("❌ Database Error: Kamu belum memiliki Outlet aktif di aplikasi web.");

  const lines = ctx.message.text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let reportText = "📊 *Laporan Rekap Catatan Telegram*:\n\n";
  let successCount = 0;

  const transactionsToInsert = [];

  for (const line of lines) {
    // Memanggil Smart Resolver untuk mengonversi nilai
    const amount = parseIndonesianAmount(line);
    if (!amount) continue; // Abaikan baris jika tidak ada nilai valid (Mencegah DB Rollback)

    const type = classifyTransactionType(line);

    transactionsToInsert.push({
      user_id: auth.userId,
      outlet_id: auth.outletId,
      type: type,
      amount: amount, // Nilai riil bebas bug
      description: line,
      category: type === 'income' ? 'Penjualan Kasir' : 'Operasional', // Mapping standar Cashbook MyInvoice
      date: new Date().toISOString().split('T')[0]
    });

    reportText += `${type === 'income' ? '🟢 [INC]' : '🔴 [EXP]'} ${line}: Rp ${amount.toLocaleString('id-ID')}\n`;
  }

  if (transactionsToInsert.length > 0) {
    const { error } = await supabase.from('cashbook').insert(transactionsToInsert);
    
    if (error) {
      console.error("Bulk Insert Error:", error);
      return ctx.reply(`❌ Gagal menyimpan data massal. Error: ${error.code}`);
    }
    successCount = transactionsToInsert.length;
  }

  if (successCount === 0) {
    return ctx.reply("❌ Tidak ada nominal angka riil yang bisa dicatat dari kalimatmu.");
  }

  reportText += `\n✅ *Sukses mencatat ${successCount} transaksi (Sinkron Terverifikasi)!*`;
  
  // Pisahkan pesan jika melebihi batas 4096 karakter (fallback aman)
  if (reportText.length > 4000) {
    const firstPart = reportText.substring(0, 4000);
    await ctx.reply(firstPart, { parse_mode: "Markdown" });
    await ctx.reply(reportText.substring(4000), { parse_mode: "Markdown" });
  } else {
    await ctx.reply(reportText, { parse_mode: "Markdown" });
  }
});

// 5. WEBHOOK & RUNTIME SERVER (SYNCHRONOUS)
const handleUpdate = webhookCallback(bot, "std/http");
serve(async (req) => {
  const url = new URL(req.url);
  
  if (req.method === "GET" && url.searchParams.get("setup") === "webhook") {
    // Dynamic URL — no hardcoded project ref
    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  if (req.method === "POST") {
    try {
      // Tunggu hingga proses .insert() dan ctx.reply() selesai agar respons terkirim utuh
      return await handleUpdate(req);
    } catch (err) { 
      console.error(err); 
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  return new Response("MyInvoice Secure Sync Bot Engine is Running", { status: 200 });
});
