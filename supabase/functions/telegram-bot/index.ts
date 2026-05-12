import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.21.1/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Ambil Environment Variables
const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // WAJIB service_role untuk bypass RLS

if (!botToken || !supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Environment Variables");
}

const bot = new Bot(botToken!);
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// Command: /start
bot.command("start", (ctx) => {
  ctx.reply("Selamat datang di MyInvoice Asisten! 🤖\n\nUntuk mulai, hubungkan akun Anda dari menu Settings di web, lalu ketik perintah:\n`/login [kode_6_digit]`", { parse_mode: "Markdown" });
});

// Command: /login <code>
bot.command("login", async (ctx) => {
  const code = ctx.match;
  const telegramId = ctx.from?.id;

  if (!code || !telegramId) return ctx.reply("Format salah. Contoh: /login 123456");

  // Cek apakah kode valid dan belum expired
  const { data: authCode, error: codeErr } = await supabase
    .from("telegram_auth_codes")
    .select("user_id")
    .eq("code", code)
    .gte("expires_at", new Date().toISOString())
    .single();

  if (codeErr || !authCode) {
    return ctx.reply("❌ Kode tidak valid atau sudah kedaluwarsa. Silakan generate ulang di web.");
  }

  // Simpan ke telegram_users (Upsert)
  const { error: insertErr } = await supabase
    .from("telegram_users")
    .upsert({ telegram_id: telegramId, user_id: authCode.user_id, is_active: true });

  if (insertErr) return ctx.reply("❌ Terjadi kesalahan sistem saat menautkan akun.");

  // Hapus kode yang sudah terpakai
  await supabase.from("telegram_auth_codes").delete().eq("code", code);

  ctx.reply("✅ Berhasil! Akun Telegram Anda kini terhubung dengan MyInvoice.\n\nCoba catat pengeluaran:\n`/bayar 25000 beli es batu`", { parse_mode: "Markdown" });
});

// Middleware: Pengecekan Akun (Hanya yang sudah login yang bisa pakai command di bawah)
const checkAuth = async (telegramId: number) => {
  const { data } = await supabase.from("telegram_users").select("user_id").eq("telegram_id", telegramId).eq("is_active", true).single();
  return data?.user_id || null;
};

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
    category: "Pengeluaran Kasir",
    amount: amount,
    description: description,
    date: new Date().toISOString().split("T")[0]
  });

  if (error) return ctx.reply("❌ Gagal mencatat pengeluaran.");
  ctx.reply(`✅ Pengeluaran dicatat: Rp${amount.toLocaleString("id-ID")} untuk ${description}.`);
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
    category: "Pemasukan Kasir",
    amount: amount,
    description: description,
    date: new Date().toISOString().split("T")[0]
  });

  if (error) return ctx.reply("❌ Gagal mencatat pemasukan.");
  ctx.reply(`✅ Pemasukan dicatat: Rp${amount.toLocaleString("id-ID")} dari ${description}.`);
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
