# MASTER PROMPT UNTUK ANTIGRAVITY — TUGAS MY INVOICE + JARVIS
*Disusun oleh Hermes (auditor), 18 Jul 2026. Lu (Antigravity) yg eksekusi & test.*

Kamu adalah engineer full-stack (Supabase/Postgres + Python). Ada 2 tugas:
(1) FIX bug kritis My Invoice, (2) UPGRADE Jarvis secara additive. Lakukan terpisah,
jangan campur. Report ke user/Hermes setelah tiap tugas.

==================================================================
## TUGAS 1: FIX BUG KRITIS MY INVOICE (upgrade RPC tanpa payment check)
==================================================================
Lokasi: C:\My Invoice Apps\
File bermasalah: update_pricing_rpcs.sql (baris 5-47)
Fungsi: upgrade_to_pro(p_trx_id, p_is_yearly), upgrade_to_ultimate(p_trx_id, p_is_yearly)

MASALAH: RPC pakai SECURITY DEFINER (bypass RLS) tapi TIDAK cek apakah p_trx_id
ada di tabel payments status='paid'. -> user bisa naik plan GRATIS tanpa bayar.

YANG SUDAH AMAN (JANGAN UBAH):
- process_sale SUDAH punya server-side price validation (base_schema_staging.sql:279-309)
- Trigger tr_protect_profiles_plan SUDAH ada (security_hardening.sql:101-122)
- Frontend cuma anon key, gak ada service_role di client.

TUGAS 1:
1. Baca update_pricing_rpcs.sql + security_hardening.sql
2. Perbaiki upgrade_to_pro & upgrade_to_ultimate: TAMBAH
   SELECT EXISTS(SELECT 1 FROM payments WHERE trx_id=p_trx_id AND status='paid') INTO v_paid;
   IF NOT v_paid THEN RAISE EXCEPTION 'Unauthorized: payment not verified'; END IF;
   (tetap SECURITY DEFINER + WHERE id=auth.uid())
3. Buat migrasi BARU: supabase/migrations/fix_upgrade_payment_verify.sql
4. JANGAN ubah process_sale / trigger protect_profiles_plan
5. Test staging: RPC trx acak -> GAGAL; trx valid paid -> SUKSES
6. Laporkan, JANGAN auto-apply production tanpa konfirmasi user.

==================================================================
## TUGAS 2: UPGRADE JARVIS (ADDITIVE ONLY — JANGAN UBAH YANG JALAN)
==================================================================
Lokasi: C:\Users\Donny\JarvisAI\
ATURAN BESI: JANGAN edit app.py, telegram_bot.py, run.py, server.py.
JANGAN hapus file (termasuk ggml-tiny.en.bin). Semua = FILE BARU.

DALeman: core/app.py (whisper tiny.en + Ollama llama3:8b + pyttsx3),
telegram_bot.py (TG voice->wav->whisper->llm), skills/ KOSONG.

BUAT FILE BARU:
1. core/persona.py -> SYSTEM_PROMPT "Jarvis, asisten Daniel, Indonesia, taktis, CoT"
2. core/memory.py -> load/save MEMORY.md, get_context()
3. core/skills_loader.py -> scan skills/, match relevan dgn keyword
4. ISI skills/ dgn 100 skill dari E:/HERMES ASSISSTANT AI/skills/openclaw-converted/ + 20 skill inti
5. core/tools.py -> web_search + run_cmd (dangerous gated, try/except)
6. core/tts_piper.py -> wrap PiperVoice (sudah keinstall)
7. core/cleanup.py -> hapus temp ogg/wav di uploads/ >1 jam
8. core/whisper_id.py -> transcribe_id dgn model Indo (tiny.en fallback)

INTEGRASI OPSIONAL (gak wajib ubah app.py):
  from core.persona import get_prompt
  from core.memory import get_context
  # prefix ke ask_llm
DELIVERABLE: semua file baru + MEMORY.md template + UPGRADE_README.md (cara test).
JANGAN jalankan app.py kecuali user bilang "laksanakan".

==================================================================
## BOUNDARY
Hermes = auditor (gak edit code). Kamu yg tulis + test. User yg setuju production.
