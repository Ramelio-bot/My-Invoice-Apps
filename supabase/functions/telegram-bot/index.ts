import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Bot, webhookCallback } from "npm:grammy";
import { createClient } from "npm:@supabase/supabase-js";

// Ambil Environment Variables
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // WAJIB service_role untuk bypass RLS

if (!botToken || !supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Environment Variables");
}

const bot = new Bot(botToken!);
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const classifyTransactionType = (text: string): "income" | "expense" => {
  const lowerText = text.toLowerCase();
  
  // Daftar kata kunci mutlak untuk PENGELUARAN (EXPENSE)
  const expenseKeywords = ['beli', 'bayar', 'parkir', 'pengeluaran', 'bensin', 'makan', 'utk', 'untuk', 'sewa', 'gaji', 'belanja'];
  
  // Daftar kata kunci mutlak untuk PEMASUKAN (INCOME)
  const incomeKeywords = ['dapat', 'transferan', 'pemasukan', 'omset', 'jual', 'terima', 'masuk', 'gajian'];

  // Cek apakah teks mengandung salah satu kata kunci pengeluaran
  if (expenseKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'expense';
  }
  
  // Cek apakah teks mengandung salah satu kata kunci pemasukan
  if (incomeKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'income';
  }

  // Default fallback jika tidak ada kata kunci yang cocok
  return 'expense'; // Lebih aman default ke expense untuk kehati-hatian keuangan
};

const handleIncomingTelegramMessage = async (inputText: string, userId: string, outletId: string | null) => {
  // 1. Pecah teks menjadi array per baris, bersihkan spasi atau baris kosong
  const lines = inputText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let successCount = 0;
  let summaryMessage = "📊 *Laporan Rekap Catatan Telegram*:\n\n";

  for (const line of lines) {
    // A. Ekstrak angka dari baris ini saja
    const numbers = line.match(/\d+/g);
    if (!numbers) continue; // Skip jika baris tidak mengandung nominal
    
    const amount = parseInt(numbers.join(''), 10);
    
    // B. Klasifikasikan tipe transaksi khusus untuk baris ini
    const type = classifyTransactionType(line);
    
    // C. Tentukan kategori fallback sederhana
    const category = type === 'income' ? 'Pemasukan Lain' : 'Operasional';

    // D. Insert secara independen ke database Supabase
    const { error } = await supabase.from('cashbook').insert({
      user_id: userId,
      outlet_id: outletId,
      type: type,
      amount: amount,
      description: line,
      category: category,
      date: new Date().toISOString().split('T')[0] // Tanggal hari ini
    });

    if (!error) {
      successCount++;
      summaryMessage += `${type === 'income' ? '🟢' : '🔴'} *${type.toUpperCase()}*: ${line} (Berhasil)\n`;
    } else {
      summaryMessage += `❌ *Gagal*: ${line}\n`;
    }
  }

  // E. Kirim balik respon rekapitulasi terstruktur ke Telegram
  return {
    success: successCount > 0,
    message: summaryMessage
  };
};

// Middleware: Pengecekan Akun
const checkAuth = async (telegramId: number) => {
  const { data } = await supabase.from("telegram_users").select("user_id").eq("telegram_id", telegramId).eq("is_active", true).single();
  return data?.user_id || null;
};

// Command: /start
bot.command("start", (ctx) => {
  ctx.reply("Selamat datang di MyInvoice Asisten! 🤖\n\nUntuk mulai, hubungkan akun Anda dari menu Settings di web, lalu ketik perintah:\n`/login [kode_6_digit]`", { parse_mode: "Markdown" });
});

// Command: /login <code>
bot.command("login", async (ctx) => {
  const code = ctx.match;
  const telegramId = ctx.from?.id;

  if (!code || !telegramId) return ctx.reply("Format salah. Contoh: /login 123456");

  const { data: authCode, error: codeErr } = await supabase
    .from("telegram_auth_codes")
    .select("user_id")
    .eq("code", code)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (codeErr || !authCode) {
    return ctx.reply("❌ Kode tidak valid atau sudah kedaluwarsa. Silakan generate ulang di web.");
  }

  const { error: insertErr } = await supabase
    .from("telegram_users")
    .upsert({ telegram_id: telegramId, user_id: authCode.user_id, is_active: true });

  if (insertErr) return ctx.reply("❌ Terjadi kesalahan sistem saat menautkan akun.");

  await supabase.from("telegram_auth_codes").delete().eq("code", code);

  ctx.reply("✅ Berhasil! Akun Telegram Anda kini terhubung dengan MyInvoice.\n\nCoba catat pengeluaran:\n`beli kopi 15rb` atau `/bayar 25000 beli es batu`", { parse_mode: "Markdown" });
});

// Command: /bayar <nominal> <keterangan>
bot.command("bayar", async (ctx) => {
  if (!ctx.from?.id) return;
  const userId = await checkAuth(ctx.from.id);
  if (!userId) return ctx.reply("❌ Akun belum terhubung. Ketik /login [kode].");

  const text = ctx.match;
  const match = text.match(/^(\d+)\s+(.+)$/);
  if (!match) return ctx.reply("❌ Format salah. Contoh:\n`/bayar 50000 beli galon`", { parse_mode: "Markdown" });

  const amount = parseInt(match[1], 10);
  const description = match[2];

  const { error } = await supabase.from("cashbook").insert({
    user_id: userId,
    type: "expense",
    category: "Operasional",
    amount: amount,
    description: description,
    date: new Date().toISOString().split("T")[0]
  });

  if (error) return ctx.reply("❌ Gagal mencatat pengeluaran.");
  ctx.reply(`✅ Berhasil mencatat Pengeluaran "${description}" sebesar Rp ${amount.toLocaleString("id-ID")}${amount >= 10000000 ? " 🚀" : (amount >= 1000000 ? " 💰" : "")}`);
});

// Command: /masuk <nominal> <keterangan>
bot.command("masuk", async (ctx) => {
  if (!ctx.from?.id) return;
  const userId = await checkAuth(ctx.from.id);
  if (!userId) return ctx.reply("❌ Akun belum terhubung. Ketik /login [kode].");

  const text = ctx.match;
  const match = text.match(/^(\d+)\s+(.+)$/);
  if (!match) return ctx.reply("❌ Format salah. Contoh:\n`/masuk 150000 dari gofood`", { parse_mode: "Markdown" });

  const amount = parseInt(match[1], 10);
  const description = match[2];

  const { error } = await supabase.from("cashbook").insert({
    user_id: userId,
    type: "income",
    category: "Pemasukan Lain",
    amount: amount,
    description: description,
    date: new Date().toISOString().split("T")[0]
  });

  if (error) return ctx.reply("❌ Gagal mencatat pemasukan.");
  ctx.reply(`✅ Berhasil mencatat Pemasukan "${description}" sebesar Rp ${amount.toLocaleString("id-ID")}${amount >= 10000000 ? " 🚀" : (amount >= 1000000 ? " 💰" : "")}`);
});

// Handler Natural Language (Non-Command)
bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return; // Biarkan command handler yang bekerja

  const userId = await checkAuth(ctx.from.id);
  if (!userId) return ctx.reply("❌ Akun Telegram belum terhubung. Silakan /login dulu.");

  // Memanggil fungsi baru dengan baris per baris
  const result = await handleIncomingTelegramMessage(ctx.message.text, userId, null);
  
  if (!result.success) {
    return ctx.reply("❌ Tidak ada transaksi yang valid untuk dicatat dari pesan Anda.");
  }

  ctx.reply(result.message, { parse_mode: "Markdown" });
});

// Jalankan Server
const handleUpdate = webhookCallback(bot, "std/http");

serve(async (req) => {
  if (req.method === "POST") {
    try {
      return await handleUpdate(req);
    } catch (err) {
      console.error("Webhook Error:", err);
    }
  }
  return new Response("Bot is running", { status: 200 });
});

