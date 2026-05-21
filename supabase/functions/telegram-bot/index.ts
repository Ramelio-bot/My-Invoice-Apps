import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Bot, webhookCallback } from "npm:grammy";
import { createClient } from "npm:@supabase/supabase-js";

const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const bot = new Bot(botToken!);
const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

// 1. HELPER CLASSIFICATION (DEFENSIF)
const classifyTransactionType = (text: string): "income" | "expense" => {
  const lowerText = text.toLowerCase();
  const expenseKeywords = ['beli', 'bayar', 'parkir', 'pengeluaran', 'bensin', 'makan', 'utk', 'untuk', 'sewa', 'gaji', 'belanja'];
  const incomeKeywords = ['dapat', 'transferan', 'pemasukan', 'omset', 'jual', 'terima', 'masuk', 'gajian'];

  if (expenseKeywords.some(k => lowerText.includes(k))) return 'expense';
  if (incomeKeywords.some(k => lowerText.includes(k))) return 'income';
  return 'expense';
};

// 2. MIDDLEWARE AUTH + AUTOMATIC OUTLET FETCH
const checkAuthAndOutlet = async (telegramId: number) => {
  const { data: userData } = await supabase
    .from("telegram_users")
    .select("user_id")
    .eq("telegram_id", telegramId)
    .eq("is_active", true)
    .single();

  if (!userData?.user_id) return null;

  // Berburu minimal 1 outlet valid milik user agar lolos RLS
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

// 3. MASTER EVENT HANDLER (LINE BY LINE PARSING)
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
    const numbers = line.match(/\d+/g);
    if (!numbers) continue;

    const amount = parseInt(numbers.join(''), 10);
    const type = classifyTransactionType(line);

    transactionsToInsert.push({
      user_id: auth.userId,
      outlet_id: auth.outletId,
      type: type,
      amount: amount,
      description: line,
      category: type === 'income' ? 'Pemasukan Lain' : 'Operasional',
      date: new Date().toISOString().split('T')[0]
    });

    reportText += `${type === 'income' ? '🟢' : '🔴'} *${type.toUpperCase()}*: ${line}\n`;
  }

  if (transactionsToInsert.length > 0) {
    // SEKALI TEMBAK UNTUK SEMUA BARIS (BULK INSERT)
    const { error } = await supabase.from('cashbook').insert(transactionsToInsert);
    
    if (error) {
      console.error("Bulk Insert Error:", error);
      return ctx.reply("❌ Gagal menyimpan data massal akibat restriksi sistem.");
    }
    
    successCount = transactionsToInsert.length;
  }

  if (successCount === 0) {
    return ctx.reply("❌ Tidak ada nominal angka valid yang bisa dicatat.");
  }

  reportText += `\n✅ *Sukses mencatat ${successCount} transaksi sekaligus secara instan!*`;
  await ctx.reply(reportText, { parse_mode: "Markdown" });
});

const handleUpdate = webhookCallback(bot, "std/http");
serve(async (req) => {
  const url = new URL(req.url);
  
  // Endpoint rahasia untuk menyinkronkan webhook tanpa mengekspos token
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
  return new Response("Bot is running", { status: 200 });
});
