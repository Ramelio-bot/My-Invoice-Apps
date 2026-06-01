import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function createHmac(text: string, secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, otp, hash, expiry, password, name, activateTrial } = await req.json();
    if (!email || !otp || !hash || !expiry || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: corsHeaders });
    }

    const OTP_SECRET = Deno.env.get("OTP_SECRET_KEY") || "SUPER_SECRET_FALLBACK_IF_MISSING_39829";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check Brute-force Limiter in DB
    const { data: attemptData } = await supabase
      .from('otp_attempts')
      .select('*')
      .eq('email', email)
      .single();

    if (attemptData && attemptData.locked_until && new Date(attemptData.locked_until).getTime() > Date.now()) {
      return new Response(JSON.stringify({ error: "Akun terkunci sementara karena terlalu banyak kegagalan. Coba lagi dalam 15 menit." }), { status: 429, headers: corsHeaders });
    }

    // 2. Check Expiry
    if (Date.now() > expiry) {
      return new Response(JSON.stringify({ error: "Kode OTP telah kedaluwarsa. Silakan minta kode baru." }), { status: 400, headers: corsHeaders });
    }

    // 3. Verify HMAC Hash
    const dataToHash = `${email}.${otp}.${expiry}`;
    const calculatedHash = await createHmac(dataToHash, OTP_SECRET);

    if (calculatedHash !== hash) {
      // Failed attempt, record in DB
      const attempts = (attemptData?.attempts || 0) + 1;
      const updates: any = { 
        email, 
        attempts, 
        last_attempt_at: new Date().toISOString() 
      };
      
      if (attempts >= 3) {
        // Lock for 15 minutes
        updates.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
      
      await supabase.from('otp_attempts').upsert(updates);

      return new Response(JSON.stringify({ error: "Kode OTP tidak valid." }), { status: 400, headers: corsHeaders });
    }

    // Success! Clear attempts
    await supabase.from('otp_attempts').delete().eq('email', email);

    // 4. Create Confirmed User via Admin API
    const { data: userRecord, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        activate_trial: activateTrial || false
      }
    });

    if (userError) {
        if (userError.message.includes('already exists')) {
            return new Response(JSON.stringify({ error: "Email sudah terdaftar." }), { status: 400, headers: corsHeaders });
        }
        return new Response(JSON.stringify({ error: userError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ success: true, user: userRecord.user }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
});
