import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Bot, webhookCallback } from "npm:grammy";
import { createClient } from "npm:@supabase/supabase-js";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const bot = new Bot(botToken!);
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// 1. SMART AMOUNT RESOLVER (KONVERSI SINGKATAN & DESIMAL)
const parseIndonesianAmount = (text: string): number | null => {
  const lowerText = text.toLowerCase();
  // Regex cerdas yang membaca angka desimal/ribuan berserta singkatan (jt, rb, k)
  const regex = /(?:rp\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(jt|juta|rb|ribu|k|m|miliar)?/gi;
  let match;
  let maxAmount = 0;

  while ((match = regex.exec(lowerText)) !== null) {
    let numStr = match[1];
    
    // Deteksi jika koma/titik berfungsi sebagai penanda desimal (contoh: 4.5 atau 4,5)
    if (/^\d+[.,]\d{1,2}$/.test(numStr)) {
      numStr = numStr.replace(',', '.'); // Standarisasi ke desimal
    } else {
      // Buang seluruh titik dan koma yang difungsikan sebagai separator ribuan (contoh 25.000 -> 25000)
      numStr = numStr.replace(/[.,]/g, '');
    }

    let num = parseFloat(numStr);
    if (isNaN(num)) continue;

    const suffix = match[2];
    if (suffix === 'jt' || suffix === 'juta') num *= 1000000;
    else if (suffix === 'rb' || suffix === 'ribu' || suffix === 'k') num *= 1000;
    else if (suffix === 'm' || suffix === 'miliar') num *= 1000000000;

    // Menangani baris kalimat yang memiliki banyak angka, rekam nominal teringgi
    if (num > maxAmount) maxAmount = num;
  }
  
  return maxAmount > 0 ? maxAmount : null;
};

// 2. TOLERANT CLASSIFIER (PRIORITAS INCOME & TYPO SAFE)
const classifyTransactionType = (text: string): "income" | "expense" => {
  const lowerText = text.toLowerCase();
  
  // PRIORITAS 1: Cek Income terlebih dahulu menggunakan Word Boundary (\b)
  // Menangkap variasi kata presisi dan typo wajar seperti masuj, tramsfer, dpt
  const incomeRegex = /\b(dapat|dpt|transfer|trf|tramsfer|transferan|masuk|msuk|masuj|omset|omzet|terima|jual|laku|gajian|cair|dp)\b/i;
  if (incomeRegex.test(lowerText)) return 'income';

  // PRIORITAS 2: Cek Expense
  const expenseRegex = /\b(beli|bayar|byr|parkir|keluar|pengeluaran|bensin|makan|sewa|gaji|belanja|blnj|kasbon|utang|potongan|langganan|tagihan)\b/i;
  if (expenseRegex.test(lowerText)) return 'expense';

  // DEFAULT FALLBACK yang terisolasi
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

    reportText += `${type === 'income' ? '🟢' : '🔴'} *${type.toUpperCase()}*: ${line} (Rp ${amount.toLocaleString('id-ID')})\n`;
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

  reportText += `\n✅ *Sukses mencatat ${successCount} transaksi (Anti-Crash Terverifikasi)!*`;
  await ctx.reply(reportText, { parse_mode: "Markdown" });
});

// 5. WEBHOOK & RUNTIME SERVER
const handleUpdate = webhookCallback(bot, "std/http");
serve(async (req) => {
  const url = new URL(req.url);
  
  if (req.method === "GET" && url.searchParams.get("setup") === "webhook") {
    const webhookUrl = "https://xrzdcqnezhcezitolkuu.supabase.co/functions/v1/telegram-bot";
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  if (req.method === "POST") {
    try { return await handleUpdate(req); } catch (err) { console.error(err); }
  }
  return new Response("MyInvoice Secure Bot Engine is Running", { status: 200 });
});
