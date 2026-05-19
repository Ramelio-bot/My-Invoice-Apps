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

// Helper: Parsing Natural Language (Advanced Version)
function parseNaturalLanguage(text: string) {
  const lowerText = text.toLowerCase();
  const cleanText = lowerText.replace(/(rp|idr|\$)/g, "").trim();

  let totalAmount = 0;
  const nominalsFound: string[] = [];

  // 1. Ekstraksi dan Penjumlahan Nominal (Mendukung banyak nominal dalam satu pesan)
  // Regex untuk menangkap angka dengan suffix: 15rb, 1.5jt, 50k, dll
  const suffixRegex = /(\d+(?:[.,]\d+)?)\s*(rb|k|jt|juta|ribu|ratus|m|milyar)/gi;
  let match;
  while ((match = suffixRegex.exec(cleanText)) !== null) {
    const rawNum = match[1].replace(",", ".");
    const suffix = match[2].toLowerCase();
    let multiplier = 1;

    if (["rb", "k", "ribu"].includes(suffix)) multiplier = 1000;
    else if (["jt", "juta"].includes(suffix)) multiplier = 1000000;
    else if (suffix === "ratus") multiplier = 100;
    else if (["m", "milyar"].includes(suffix)) multiplier = 1000000000;

    totalAmount += parseFloat(rawNum) * multiplier;
    nominalsFound.push(match[0]);
  }

  // Cari nominal sisa (angka murni tanpa suffix)
  // Kita hilangkan dulu bagian yang sudah terdeteksi agar tidak double count
  let remainingText = cleanText;
  nominalsFound.forEach(n => {
    remainingText = remainingText.replace(n.toLowerCase(), "");
  });

  const plainNumbers = remainingText.match(/\d+(?:[.,]\d+)*/g) || [];
  plainNumbers.forEach(num => {
    // Hanya ambil angka yang cukup besar (> 100) atau berada di akhir kalimat 
    // untuk menghindari mengambil angka dari deskripsi seperti "Warteg 21"
    const val = parseInt(num.replace(/[.,]/g, ""), 10);
    const isAtEnd = cleanText.endsWith(num);
    const isOnlyNumber = plainNumbers.length === 1 && nominalsFound.length === 0;

    if (val > 100 || isAtEnd || isOnlyNumber) {
      totalAmount += val;
      nominalsFound.push(num);
    }
  });

  if (totalAmount <= 0) {
    return { error: "❌ Nominal tidak ditemukan. Contoh: \"beli kopi 15000\"" };
  }

  // 2. Klasifikasi Tipe Transaksi
  const transactionType = classifyTransactionType(text);
  const isIncome = transactionType === "income";

  // 3. Ekstraksi Deskripsi Bersih
  let description = text;
  nominalsFound.forEach(n => {
    const idx = description.toLowerCase().indexOf(n.toLowerCase());
    if (idx !== -1) {
      description = description.substring(0, idx) + description.substring(idx + n.length);
    }
  });
  description = description.replace(/\s+/g, " ").trim();

  return {
    type: transactionType,
    amount: Math.floor(totalAmount),
    description: description || (isIncome ? "Pemasukan" : "Pengeluaran"),
    category: isIncome ? "Pemasukan Lain" : "Operasional"
  };
}

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

  const result = parseNaturalLanguage(ctx.message.text);

  if ("error" in result) {
    return ctx.reply(result.error);
  }

  const { type, amount, description, category } = result;

  const { error } = await supabase.from("cashbook").insert({
    user_id: userId,
    type,
    category,
    amount,
    description,
    date: new Date().toISOString().split("T")[0]
  });

  if (error) {
    console.error("DB Error:", error);
    return ctx.reply("❌ Terjadi kesalahan saat menyimpan data.");
  }

  const typeLabel = type === "income" ? "Pemasukan" : "Pengeluaran";
  const emoji = amount >= 10000000 ? " 🚀" : (amount >= 1000000 ? " 💰" : "");
  
  ctx.reply(`✅ Berhasil mencatat ${typeLabel} "${description}" sebesar Rp ${amount.toLocaleString("id-ID")}${emoji}`);
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

