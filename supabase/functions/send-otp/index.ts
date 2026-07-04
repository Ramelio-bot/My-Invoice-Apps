import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://myinvoice.space',
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
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: corsHeaders });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("CRITICAL SECURITY ERROR: RESEND_API_KEY is missing in environment variables!");
    }
    const OTP_SECRET = Deno.env.get("OTP_SECRET_KEY");
    if (!OTP_SECRET) {
      throw new Error("CRITICAL SECURITY ERROR: OTP_SECRET_KEY is missing in environment variables!");
    }

    // Generate 6-digit OTP using cryptographically secure random
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    const otp = (100000 + (arr[0] % 900000)).toString();
    
    // Expiry: 5 minutes from now
    const expiry = Date.now() + 5 * 60 * 1000;

    // Hash: email + otp + expiry
    const dataToHash = `${email}.${otp}.${expiry}`;
    const hash = await createHmac(dataToHash, OTP_SECRET);

    // Send email via Resend HTTP API
    {
        const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: "MyInvoice Assistant <noreply@myinvoice.space>",
            to: email,
            subject: "Kode OTP Pendaftaran Akun MyInvoice Anda",
            html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #FAFAFA; border-radius: 12px; overflow: hidden; border: 1px solid #E2E8F0;">
            <div style="background-color: #0F172A; padding: 40px 30px; text-align: center;">
                <h1 style="color: #E2E8F0; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">MyInvoice</h1>
            </div>
            <div style="padding: 40px 30px; background-color: #FFFFFF;">
                <p style="color: #334155; font-size: 16px; line-height: 1.6; margin-top: 0;">Halo,</p>
                <p style="color: #334155; font-size: 16px; line-height: 1.6;">Terima kasih telah mendaftar di MyInvoice Apps. Kode OTP untuk melanjutkan dan memverifikasi pendaftaran Anda adalah:</p>
                
                <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 24px; text-align: center; border-radius: 12px; margin: 32px 0;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0F172A;">${otp}</span>
                </div>
                
                <p style="color: #64748B; font-size: 14px; line-height: 1.6;">Kode ini berlaku selama <strong style="color: #0F172A;">5 menit</strong>. Demi keamanan akun Anda, jangan sebarkan kode ini kepada pihak manapun termasuk tim MyInvoice.</p>
                
                <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #F1F5F9;">
                <p style="color: #94A3B8; font-size: 13px; margin: 0;">Salam Hangat,<br><strong style="color: #475569;">Tim Pengembang MyInvoice.space</strong></p>
                </div>
            </div>
            </div>
            `
        })
        });

        if (!res.ok) {
            const errTxt = await res.text();
            console.error("Resend API Error:", errTxt);
        }
    }

    return new Response(JSON.stringify({ hash, expiry }), {
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
