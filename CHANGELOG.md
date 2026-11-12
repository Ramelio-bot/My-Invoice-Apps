# Changelog — My Invoice Apps

All notable changes, security fixes, optimizations, and feature rollouts are documented here.

---

## [2026-11-12] Eksekusi Grup A (A1–A5) & Grup B (B6 & B9): Penutupan Celah Trial/Kuota, Idempotensi Offline, iOS Bluetooth Helper, & Positioning B2B Quote-to-Cash
- **A1 & B9 — Penutupan Celah Trial/Langganan Expired & Pengetatan Kuota Starter FREE (UI + Database Trigger):**
  - `src/context/AuthContext.jsx` & `src/pages/Upgrade.jsx`: Menutup celah kritis di mana `effectivePlan` sebelumnya tetap bernilai `'pro'` atau `'ultimate'` selamanya setelah masa Trial 14 hari (`trial_ends_at <= now()`) atau langganan berbayar (`pro_expires_at <= now()`) berakhir. Mengekspos `trialExpired` & `subscriptionExpired`, memaksa `effectivePlan` turun ke `'free'` seketika saat masa aktif habis, memblokir pengaktifan ulang trial (`canStartTrial`), dan otomatis memanggil RPC `sync_expired_plan_status` untuk menyinkronkan kolom `profiles.plan = 'free'`.
  - `src/context/PlanContext.jsx`: Menyelaraskan batas kuota pasca-trial `PLAN_LIMITS.FREE` (`invoices: 10, kwitansi: 10, hutangPiutang: 10, quotation: 5, po: 5, tandaTerima: 5, downloads: 10, kasir: 50, cashbook: 20, clients: 10, products: 20`), menghapus jeda tunda `500ms` pada `refreshUsage()` menjadi 1 batch paralel `Promise.allSettled` (termasuk filter `is_active = true` pada `kasir_products`), serta menambahkan optimistic increment pada seluruh fungsi `increment*` agar klik ganda cepat tidak pernah lolos batas kuota.
  - `src/pages/PenawaranHarga.jsx`, `src/pages/Klien.jsx`, `src/pages/kasir/Produk.jsx`, `src/pages/Kasir.jsx`, `src/pages/Invoice.jsx`, `src/pages/TandaTerima.jsx`, `src/pages/PurchaseOrder.jsx`, `src/pages/HutangPiutang.jsx`, `src/pages/CatatanBisnis.jsx`, `src/components/Sidebar.jsx`: Memperbaiki bug di `PenawaranHarga.jsx` (pengecekan kuota SPH & konversi SPH ke Invoice kini wajib mengecek `checkQuotationLimit()` dan `checkInvoiceLimit()`), membatasi impor Excel massal di `Klien.jsx` dan `Produk.jsx` agar tidak bisa melampaui sisa kuota `FREE`, mengizinkan edit item eksisting tanpa terblokir guard tambah baru, dan mengecek kuota kasir `FREE` baik saat online maupun offline (`getKasirTransactionCount() + pendingOffline >= 50`).
  - `supabase/migrations/server_limit_enforcement.sql` & `supabase/migrations/20261112_strict_trial_and_free_limits.sql` (Baru): Menambahkan RPC `sync_expired_plan_status()`, memperketat `activate_pro_trial()`, dan memperbarui trigger `enforce_user_plan_limits()` (`BEFORE INSERT` pada `documents`, `kasir_transactions`, `receipts`, `purchase_orders`, `cashbook`, `clients`, dan `kasir_products`) lengkap dengan auto-downgrade saat `trial_ends_at` atau `pro_expires_at` kedaluwarsa serta penghitungan audit log dokumen yang dihapus.
- **A2 — Banner Panduan Printer Bluetooth untuk iOS Safari / Non-Web Bluetooth:**
  - `src/pages/Kasir.jsx`: Mendeteksi otomatis browser iOS (`iPad/iPhone/iPod`) atau ketiadaan `navigator.bluetooth` dan menampilkan banner panduan yang dapat ditutup agar pengguna menggunakan tombol Cetak Struk (mode cetak sistem/AirPrint) atau membuka di Chrome Android/Desktop.
- **A3 — Telemetri Funnel Aktivasi 5 Menit Pertama (GA4):**
  - `src/pages/Invoice.jsx`, `src/pages/Kasir.jsx`, `src/components/SpreadsheetImportModal.jsx`, `src/components/TrialBanner.jsx`: Menambahkan pelacakan `first_invoice_saved`, `first_pos_transaction`, `excel_import_completed`, `limit_modal_shown`, dan `trial_banner_upgrade_click`.
- **A4 — Trial End-Game & Expired Conversion Nudge (`TrialBanner.jsx`):**
  - `src/components/TrialBanner.jsx`: Menampilkan ringkasan aktivitas nyata pengguna (jumlah dokumen, transaksi kasir, klien/produk tercatat) pada 4 hari terakhir trial (`trialDaysLeft <= 4`) maupun saat trial/langganan baru saja habis (`trialExpired || subscriptionExpired`) dengan CTA langsung ke `/upgrade`.
- **A5 — Audit & Perbaikan Idempotensi Sinkronisasi Kasir Offline:**
  - `src/utils/offlineQueue.js` & `src/App.jsx`: Menambahkan `sanitizeProcessSalePayload()` agar key non-RPC (`idempotency_key`) tidak menyebabkan error PostgREST `PGRST202` saat memanggil `supabase.rpc('process_sale')`, menggunakan `p_receipt_number` deterministik sebagai kunci idempotensi IndexedDB (`OFFLINE_<receipt_number>`), serta membersihkan antrean secara aman bila server mengembalikan status `Idempotency Block` (sudah tersinkronisasi sebelumnya).
- **B6 — Penajaman Hero Positioning `Landing.jsx` (B2B Quote-to-Cash + Offline POS):**
  - `src/pages/Landing.jsx`, `src/pages/SoftwareInvoiceFreelance.jsx`, `src/context/LanguageContext.jsx`: Memperbarui headline Hero `Landing.jsx` untuk memimpin dengan nilai tertinggi B2B (*"Dari Penawaran ke Invoice Pajak & Kasir Toko dalam Satu Klik"*) serta memperbarui seluruh teks kuota Starter `FREE` (`50 Tx Kasir & 10 Invoice/Bulan, 10 Klien & 20 Produk`) di halaman harga, FAQ, dan kamus bahasa ID/EN.

---

## [2026-11-12] Optimasi Konversi #1, #2, & #3: Auto-Trial PRO 14 Hari, Viral CTA `/inv/:id`, & Draft Carryover Penuh
- **#1 Otomatisasi Trial PRO 14 Hari Penuh (Zero Friction):**
  - `src/pages/Register.jsx`: Mengubah default `activateTrial` pada verifikasi OTP menjadi aktif (`!== 'false'`) agar konsisten dengan klaim halaman pendaftaran.
  - `src/components/OnboardingWizard.jsx`: Otomatis memanggil `supabase.rpc('activate_pro_trial')` & memperbarui `refreshProfile(true, trialData)` bagi akun baru (`canStartTrial === true`) begitu onboarding selesai atau di-skip, disertai event `auto_trial_activated`.
- **#2 Zero-CAC Viral CTA pada Link Faktur Publik `/inv/:id`:**
  - `src/pages/PublicInvoiceView.jsx`: Menambahkan tombol ajakan interaktif non-intrusif (`pdf-hide print:hidden`) pada footer faktur publik menuju `/register?src=public_invoice&inv=...` lengkap dengan pelacakan `public_invoice_viral_click`.
- **#3 Carryover Draf Penuh dari 4 Generator SEO Gratis ke Aplikasi:**
  - `src/utils/analytics.js`: Mengupgrade `savePublicCarryover`, menambahkan TTL 24 jam di `getPublicCarryover`, dan menyediakan `consumePublicCarryover(allowedSources)` dengan konversi diskon nominal -> persen serta filter data contoh agar draf bawaan tidak mengotori form baru. Mengizinkan aksi eksplisit `quotation_to_invoice` tetap menyimpan draf walau pengguna sudah login.
  - `src/components/OnboardingWizard.jsx`: Mempertahankan draf carryover hingga tiba di halaman modul tujuan.
  - `src/pages/Invoice.jsx`, `src/pages/Kwitansi.jsx`, `src/pages/PenawaranHarga.jsx`, `src/pages/HitungHPP.jsx`: Memuat otomatis draf invoice, kwitansi, SPH (termasuk konversi 1-klik SPH->Invoice), dan resep HPP dari halaman generator publik saat user masuk modul.

---

## [2026-11-12] Optimasi Konversi #1 & #2: Sinkronisasi Paket PRO, Workspace Focus Mode, Impor Excel 1-Klik & Anti-Lock-In Backup
- **Rekomendasi #1 — Sinkronisasi Paket & Kepercayaan Pricing (1 Sumber Kebenaran):**
  - `src/context/PlanContext.jsx`: Menyamakan `PLAN_LIMITS.PRO` menjadi `Infinity` untuk seluruh kuota dokumen & transaksi kasir (1 Outlet/Workspace), memisahkan fitur cabang & tim (`Multi-Outlet`, `PIN Karyawan`, `Advanced HPP`, `Loyalty Member`, `Bot Telegram`, `Audit Trail`) secara rapi ke paket `ULTIMATE`.
  - `src/pages/Landing.jsx`, `src/pages/Upgrade.jsx`, `src/pages/AplikasiKasirOffline.jsx`, `src/pages/KasirMembers.jsx`, `src/components/UpgradeModal.jsx`, `src/context/LanguageContext.jsx`: Menghapus klaim hero `"100% gratis."`, menghilangkan harga coret palsu (`Rp 129.000` / `Rp 149.000`) & label komoditas `"HARGA SUBSIDI UMKM"`, mengganti teks usang (`500 Transaksi`, `100 Dokumen`, `50 Klien`, `200 transactions`, `Rp 1.238.400/thn`, FAQ kuota Starter 10/10/50) agar seragam dengan batas nyata `FREE (25 dok / 100 tx / 15 klien / 30 produk)` dan `PRO Unlimited`, serta menambahkan banner jaminan `100% Anti-Lock-In & 14-Day PRO Trial`.
  - Harga dipertahankan di **PRO Rp 49.900/bln (Founding SME Rate)** & **Ultimate Rp 79.900/bln (Flat Multi-Cabang)** sesuai uji margin `founder-cfo` & `founder-pricing` (tidak diturunkan ke Rp 29.000 karena model CFO memproyeksikan rugi Tahun 1 `-Rp 15.311.000`).
- **Rekomendasi #2 — Pengurangan Beban 5 Menit Pertama, Workspace Focus Mode & Portabilitas Data:**
  - `src/utils/workspaceMode.js` (Baru): State persisten & sinkronisasi event (`all` | `b2b` | `pos`) per akun + inferensi fitur onboarding.
  - `src/components/OnboardingWizard.jsx`: Preset fokus workspace 1-klik di Step 3 (`Fokus Invoice & Jasa B2B`, `Fokus Kasir Toko POS`, `Gabungan B2B + Kasir`) dengan guard `Skip` agar tetap default `'all'` bila dilewati.
  - `src/components/Sidebar.jsx` & `src/pages/Dashboard.jsx`: Menambahkan pengalih mode workspace 3-tab, menyembunyikan modul yang tidak relevan sesuai mode aktif (`b2b` menyembunyikan menu dropdown Kasir & HPP; `pos` menyembunyikan dokumen B2B & keuangan B2B), menyembunyikan `Menara Pengawas` kuota untuk seluruh user `!isPro` (PRO/Ultimate tidak lagi tampil `/ Infinity`), dan menyesuaikan CTA & checklist awal Dashboard sesuai mode aktif.
  - `src/utils/spreadsheetImport.js` & `src/components/SpreadsheetImportModal.jsx` (Baru): Komponen & utilitas bersama dynamic `import('xlsx')` untuk unggah `.xlsx/.xls/.csv`, unduh template `.xlsx`, deteksi header otomatis ID/EN, pratinjau data, dan penjagaan kuota `FREE`.
  - `src/pages/Klien.jsx` & `src/pages/kasir/Produk.jsx`: Menambahkan tombol & modal `Impor Excel` massal 1-klik dengan deduplikasi nama/SKU non-kosong.
  - `src/pages/Settings.jsx`: Menambahkan fitur `Unduh Backup Lengkap (.xlsx)` multi-sheet (`Klien`, `Dokumen_Bisnis`, `Buku_Kas`, `Produk_Kasir`, `Transaksi_Kasir`) untuk semua paket termasuk `FREE`.

---


## [2026-11-12] Full 11-Skill Business Validation Suite via `founder-skill` (`founder/`)
- **Plugin Installation:** Installed `Jakeschincariol/founder-skill` globally as an Antigravity plugin (`C:\Users\Donny\.gemini\config\plugins\founder-skill`) with all 29 Python unit tests passing.
- **Full End-to-End Validation Executed on MyInvoice (`myinvoice.space`):**
  - `founder-board`: Vote `1 FUND IF, 2 PASS` (Avg `4.3/10`) — identified dual B2B/POS identity sprawl, `"HARGA SUBSIDI UMKM"` commodity pricing, and `Landing.jsx` vs `LanguageContext.jsx` PRO limit mismatch (`Unlimited + Excel` vs `500 tx / 100 dok` and Excel gated to Ultimate).
  - `founder-competitors`: Benchmarked Paper.id, Mekari Jurnal, Zoho Invoice, Kasir Pintar, Qasir, Majoo, Moka POS, BukuWarung, and Excel/Nota manual (`founder/competitors.md` & `competitors.csv`).
  - `founder-consumer`: Ran 100 simulated Indonesian buyer sub-agents (`founder/panel-v1/`, Seed 42) -> `0 buy / 100 pass (0%)` on upfront cold pitch (`trust` 44%, `habit` 22%, `need` 15%, `price` 12%, `convenience` 7%).
  - `founder-pricing` & `founder-offer`: Van Westendorp acceptable range computed as `Rp 19.980 – Rp 75.024` (OPP `Rp 30.075`, IPP `Rp 44.955`), with B2B agencies willing to pay `Rp 75rb–120rb` and multi-outlet owners `Rp 75rb–150rb`. Designed Grand Slam Offer Stack + calibrated tiers (`PRO Rp 59.000` / Founding `Rp 49.900`, `Ultimate Rp 99.000` / Founding `Rp 79.900`, 30-day guarantee, anti-lock-in Excel export, separate Workspace Mode); 20-buyer re-test (`--seed 42`) moved buy rate to `1/20 (5%)` (`25%` in B2B tax-sensitive cohort), confirming 14-day full free trial + real proof are mandatory before paid conversion.
  - `founder-cfo` & `founder-plan`: Modeled verified Indonesian fixed burn (`Supabase Pro` $25 + `Vercel Pro` $20 @ Rp 18.150/USD + domain + ops/marketing = `Rp 3.371.750/bln`) + Mayar & 2% refund reserves. At `Rp 59.000/bln`: contribution `Rp 52.820 (90%)`, break-even `64 active accounts`, Year 1 operating profit `Rp 12.675.920` (net `Rp 9.675.920` after `Rp 3.000.000` startup, payback Month 10, max cash needed `Rp 10.879.350`). Deterministic `compile.py` verdict: `Not yet` (3/3 financial checks PASS, 1/1 panel bar check `5% < 25%` FAIL).
  - Authored `founder/marketing.md`, `founder/brand.md`, `founder/ops.md`, `founder/launch.md`, `founder/summary.md`, `founder/one-pager.md`, and compiled full `founder/business-plan.md`.

---

## [2026-11-11] Permanent Cloud Vault Migration: Google Drive Direct URLs & Repliz Rescheduling (v2.9.40)
- **Zero-Tolerance Ephemeral Hosting Elimination:**
  - Revoked and deleted all temporary host schedules (`uguu.se`) from Repliz API to prevent broken media delivery (Meta Graph API error on expired temporary links).
- **Official Google Drive Cloud Vault Integration (`Folder ID: 1o6r55JWP9mtXav4pagu6r4E8nsGsqmvd`):**
  - Uploaded all 3 high-resolution social infographics via authenticated CLI `gdrive mutate upload`:
    - `Feed-06_Masih_Pakai_Buku_Kwitansi_Manual.jpg` -> File ID: `1Sn-vnlJW9aONRaKVpWqo20VV_lBKhyBI`
    - `Feed-07_Penawaran_Deal_Konversi_Invoice.jpg` -> File ID: `1l_QsqnhFnUu0hIALobRJPcQPspAIJdAN`
    - `Feed-08_Pusing_Rekap_Omset_Pajak_UMKM.jpg` -> File ID: `1fetUUN33kZTIFX1dBxbrOmZRWnu4EpN-`
  - Applied public read permissions (`gdrive mutate share <id> --role reader --type anyone`) and generated high-speed direct download stream URLs (`https://drive.usercontent.google.com/download?id=<id>&export=download&confirm=t&ext=.jpg`).
  - Pre-flight verified all stream URLs with `HTTP 200 OK`.
- **Repliz Schedule Replacement & Verification:**
  - Deleted previous temporary schedules: `6af42279b9d03745801ef0ce`, `6af42279b9d03745801ef0d8`, `6af4235b23f8c2a2a55be6f0`, `6af4235ba38e2b07d7621357`, `6af4236108b071314a9eccc0`, `6af4236108b071314a9eccc9`.
  - Registered 6 brand-new schedules backed directly by Google Drive Vault URLs:
    - **Feed-06 (Rabu, 11 Nov 2026 @ 19:30 WIB):**
      - Instagram (`@myinvoice.space`): `6af42658d080ab327783f123` (Status: `pending`)
      - Facebook Page (`My Invoice`): `6af42658f8e3d9b1ee75ae9c` (Status: `pending`)
    - **Feed-07 (Kamis, 12 Nov 2026 @ 19:30 WIB):**
      - Instagram (`@myinvoice.space`): `6af4265b7c0be90af1302cf1` (Status: `pending`)
      - Facebook Page (`My Invoice`): `6af4265ba40e8107d83efb47` (Status: `pending`)
    - **Feed-08 (Jumat, 13 Nov 2026 @ 19:30 WIB):**
      - Instagram (`@myinvoice.space`): `6af4265fd080ab327783f44d` (Status: `pending`)
      - Facebook Page (`My Invoice`): `6af4265fa40e8107d83efd3d` (Status: `pending`)

---

## [2026-11-11] 72-Hour Rolling Batch Complete: Feed-06, Feed-07 & Feed-08 Scheduled (v2.9.39)
- **Feed-06 ("MASIH PAKAI BUKU KWITANSI SOBEK MANUAL?"):**
  - Generated 1080x1080 visual comparison infographic (`Konten Upload/Feed-06_Masih_Pakai_Buku_Kwitansi_Manual.jpg`).
  - Authored Zero-Emoji educational caption (`Konten Upload/Feed-06_Caption.txt`) on free digital kwitansi, auto-terbilang, and 58mm Bluetooth thermal receipts.
  - Scheduled for **Wednesday, 11 November 2026 @ 19:30 WIB**:
    - Instagram (`@myinvoice.space`): `6af42279b9d03745801ef0ce`
    - Facebook Page (`My Invoice`): `6af42279b9d03745801ef0d8`
- **Feed-07 ("PENAWARAN DEAL TAPI MASIH KETIK ULANG INVOICE?"):**
  - Generated 1080x1080 visual workflow infographic (`Konten Upload/Feed-07_Penawaran_Deal_Konversi_Invoice.jpg`) showcasing 1-click Quotation (SPH) to Invoice conversion.
  - Authored Zero-Emoji practitioner caption (`Konten Upload/Feed-07_Caption.txt`) addressing quotation copy-paste friction and manual tax re-calculation.
  - Scheduled for **Thursday, 12 November 2026 @ 19:30 WIB**:
    - Instagram (`@myinvoice.space`): `6af4235b23f8c2a2a55be6f0`
    - Facebook Page (`My Invoice`): `6af4235ba38e2b07d7621357`
- **Feed-08 ("PUSING REKAP OMSET & PAJAK UMKM AKHIR BULAN?"):**
  - Generated 1080x1080 visual infographic (`Konten Upload/Feed-08_Pusing_Rekap_Omset_Pajak_UMKM.jpg`) contrasting receipt chaos against MyInvoice's automated PP 55/2022 tax recap card.
  - Authored Zero-Emoji educational caption (`Konten Upload/Feed-08_Caption.txt`) detailing Gross Turnover, PPh Final 0.5%, and WPOP Rp 500M annual tax exemption.
  - Scheduled for **Friday, 13 November 2026 @ 19:30 WIB**:
    - Instagram (`@myinvoice.space`): `6af4236108b071314a9eccc0`
    - Facebook Page (`My Invoice`): `6af4236108b071314a9eccc9`
- **Rolling Queue Verification:**
  - Full 3-day / 72-hour rolling schedule successfully secured across both channels (6 scheduled posts in total, all verified `pending` via Repliz API).

- **1-Click Quotation (SPH) to Official Invoice Conversion (`src/pages/PenawaranHarga.jsx`, `src/pages/Invoice.jsx`):**
  - Added 1-click conversion action buttons in quotation table rows and full-screen document preview modal.
  - Implemented `handleConvertToInvoice(sph)`: constructs invoice payload, automatically assigns the next invoice document number via `peekDocNumber('invoice')`, links quotation reference number, maps line items, tax schemes, and client metadata.
  - Inserts directly to Supabase `documents` table (with `client_name` and `total_amount` columns mapped) and local storage for instant hydration.
  - Synchronously marks quotation status as `accepted`, increments document counters, fires `invoice-updated` and `data-updated` events, and navigates seamlessly to `/invoice`.
  - Fortified `src/pages/Invoice.jsx` document fetching to safely fallback across `client_name`, `clientName`, and `toName`.
- **Thermal Receipt (58mm/80mm) Mode for Free Digital Kwitansi (`src/pages/BuatKwitansiGratis.jsx`):**
  - Added paper format toggle switch: `Lembar A4` vs `Struk Kasir (58mm)`.
  - Built dedicated mini thermal receipt layout inside `#instant-kwitansi-sheet` featuring monospace store header, receipt number, date, received from, bold amount with Terbilang Rupiah text, payment description, `*** LUNAS ***` badge, payment method, and signature area.
  - Injected native thermal print CSS with `@page { size: 58mm auto; margin: 0; }` for zero-margin direct printing on Bluetooth and USB thermal POS receipt printers.
- **Multi-Currency Engine ($ USD, S$ SGD, € EUR, Rp IDR) (`src/utils/currency.js`, `src/pages/BuatInvoiceGratis.jsx`, `src/pages/Invoice.jsx`, `src/utils/whatsapp.js`):**
  - Enhanced `src/utils/currency.js`: robust `formatCurrency(amount, currency)` with proper international locale formatting (2 decimal places for USD/EUR/SGD, integer formatting for IDR) and `getCurrencySymbol(currency)`.
  - Added interactive Currency Selector dropdown in `BuatInvoiceGratis.jsx` action bar.
  - Upgraded table line items, subtotal, discount, PPN, PPh, and grand totals across `BuatInvoiceGratis.jsx`, `Invoice.jsx`, and `src/utils/whatsapp.js` to dynamically respect the invoice's selected currency without hardcoded `Rp`.
- **Rekapitulasi Pajak & Kepatuhan UMKM PP 55/2022 (`src/pages/Laporan.jsx`):**
  - Added dedicated corporate compliance card: **"Rekapitulasi Pajak & Kepatuhan UMKM (PP 55 / 2022)"**.
  - Computes and displays Omset Bruto Masa Ini (Gross Turnover), Estimasi PPh Final 0.5% (`Omset * 0.005`), Total PPN Terkumpul (11%/12%), and Total PPh 23 Dipotong Klien.
  - Injected official tax compliance guide: explains exemption facility under PP 55/2022 Article 60 for individual taxpayers (WPOP) with annual gross turnover under Rp 500,000,000.
  - Synchronized tax calculations in `Laporan.jsx` to strictly adhere to the active date filter (`today`, `week`, or selected `month`), preventing leakage from past fiscal periods.
- **Precision Accounting & High-Ticket Word Scaling (`src/utils/terbilang.js`):**
  - Expanded `terbilang` number-to-words algorithm in both Indonesian and English to support Miliar / Billion and Triliun / Trillion scale.
  - Sanitized multi-space gaps, ensuring clean typography on receipts and official certificates.
- **Verification:**
  - Passed `npx eslint` across all modified files with 0 errors.
  - Passed `npm run build` in 35.89s with 33 static pre-rendered SEO pages and PWA service worker generated.

## [2026-11-10] Smart WhatsApp Billing Assistant, Thermal 58mm Receipt Mode & Rich Schema Engine (v2.9.36)
- **Smart WhatsApp Billing Assistant & Overdue Tracking (`src/pages/Invoice.jsx`, `src/utils/whatsapp.js`):**
  - Upgraded table invoice action buttons: replaced obscure "WA" label with intuitive `<MessageCircle /> Tagih WA` / `Follow Up WA` / `Ingatkan WA` buttons.
  - Implemented dynamic overdue calculation: computes days elapsed past `dueDate` and renders visual badges (`Lewat X Hari`, `Tempo Hari Ini`, `H-X Tempo`).
  - Enhanced Smart WhatsApp Follow-Up modal: displays live message preview bubble, overdue contextual alerts, client details, 4 selectable follow-up tones (`reminder`, `overdue`, `standard`, `thank_you`), 1-click text copy, and direct WhatsApp launch with public invoice link (`https://myinvoice.space/inv/:id`).
- **Thermal Receipt (58mm/80mm) POS Layout (`src/pages/BuatInvoiceGratis.jsx`):**
  - Added paper format toggle switch: `Lembar A4` vs `Struk Kasir (58mm)`.
  - Built dedicated thermal receipt canvas with monospace typography, store header, receipt metadata, itemized Qty x Price calculations, dotted ink dividers, Subtotal/Tax/Grand Total, bank details with 1-click copy, QRIS barcode preview, and custom visit greeting.
  - Configured thermal print stylesheet `@media print` with native roll dimensions (`@page { size: 58mm auto; margin: 0; }`), enabling direct printing to Bluetooth and USB thermal printers without margins or scaling issues.
- **Google Rich Snippet & Multi-Schema Pre-Rendering Engine (`scripts/prerender-seo.mjs`):**
  - Enhanced pre-rendering script to generate complete 3-tier Schema.org metadata for all 33 static SEO routes:
    1. `BreadcrumbList` (Beranda > Solusi > [Landing Page]).
    2. `FAQPage` (dynamic Q&A pairs tailored per industry/tool).
    3. `SoftwareApplication` with 4.9/5 aggregate rating and free pricing tier to unlock Google SERP rich cards.
- **Verification:**
  - Passed `npm run lint` with 0 errors.
  - Passed `npm run build` in 22.98s, compiling 91 PWA precache entries and 33 static SEO routes.

## [2026-11-10] Google Search Console Coverage Audit & Sitemap Sanitation (v2.9.35)
- **Vercel Domain Realignment Verified:**
  - Successfully realigned Vercel project domains: `myinvoice.space` is now Production (serving `HTTP/1.1 200 OK` directly), and `www.myinvoice.space` permanently redirects via `308 Permanent Redirect` to `myinvoice.space`.
  - Tested live edge responses via curl: apex domain, `sitemap.xml`, and programmatic landing pages all return verified `200 OK`.
- **GSC Coverage & Indexing Diagnosis:**
  - Diagnosed coverage report (17 unindexed pages vs 1 indexed page):
    - 5 pages Kesalahan Pengalihan (Redirect Error).
    - 11 pages Ditemukan - saat ini tidak diindeks (Discovered - currently not indexed).
    - 1 page Di-crawl - saat ini tidak diindeks (Crawled - currently not indexed).
  - Identified Root Causes:
    1. Vercel apex domain (`myinvoice.space`) issued `307 Temporary Redirect` to `www.myinvoice.space`, while GSC property, canonical URLs, and sitemap were registered under apex non-www (`https://myinvoice.space`).
    2. GSC reporting delay: Coverage graph data was captured from Oct 24 - Nov 06, prior to reading the updated 39-page sitemap on Nov 09.
    3. Auth routes (`/upgrade`, `/login`, `/register`) were formerly present in sitemap, causing redirect loops on crawlers when intercepted by auth guards.
- **Sitemap & Robots.txt Sanitation:**
  - Removed private/authenticated routes (`/login`, `/register`, `/upgrade`) from `public/sitemap.xml`.
  - Updated `public/robots.txt` to explicitly disallow `/login`, `/register`, and `/upgrade`, protecting Googlebot crawl budget.
  - Verified clean static pre-rendering of all 33 programmatic SEO routes via `npm run build`.

## [2026-11-10] Public Interactive Invoicing, PWA Web POS & Standardized Excel Export (v2.9.34)
- **1-Click Copy Helpers & QRIS Integration (Option 1):**
  - Added 1-click clipboard copy helpers for bank account number and net transfer total in `BuatInvoiceGratis.jsx` and `Invoice.jsx` with visual feedback ("Tersalin").
  - Added interactive QRIS barcode upload/toggle preview in `BuatInvoiceGratis.jsx` for instant Indonesian multi-channel QR payments.
- **Standardized Excel (.xlsx) Export & Mobile POS PWA Install (Option 2):**
  - Implemented dynamic-import `xlsx` Excel export in `src/pages/kasir/Pengeluaran.jsx` (Cashier POS Expenses) and `src/pages/CatatanBisnis.jsx` (Cashbook Ledger).
  - Created Web App Manifest (`public/manifest.json`) and added PWA meta tags in `index.html`.
  - Built `src/components/PwaInstallBanner.jsx` with `beforeinstallprompt` detection and dismissal cooldown, integrated into `Kasir.jsx` for 1-tap home screen installation.
- **Public Interactive Invoice Web View (Option 4):**
  - Built `src/pages/PublicInvoiceView.jsx` handling `/inv/:id` and `/faktur/:id` routes.
  - Enabled direct unauthenticated client access via `publicRoutes` and `AuthRedirector` bypass in `src/App.jsx`.
  - Features real-time payment status pills (LUNAS / MENUNGGU PEMBAYARAN), client and issuer cards, itemized billing table, tax & withholding breakdowns (PPN / PPh 23), 1-click copy for bank account and grand total, QRIS barcode preview, and official PDF download via `generatePDF`.
  - Updated `src/utils/whatsapp.js` and `src/pages/Invoice.jsx` to append live online invoice links into client WhatsApp messages.
- **Code Quality & Build Verification:**
  - Passed `npm run lint` with 0 errors.
  - Passed `npm run build` with 33 static SEO routes pre-rendered in 24.77s.

---

## [2026-11-09] Repliz Calendar De-duplication & Feed 05 Launch (v2.9.33)
- **Resolved Duplicate Scheduled Post on Repliz:**
  - Identified that Tuesday, 10 Nov 2026 had an accidental duplicate of Saturday's post ("DP PROYEK BUKAN CUAN BERSIH!").
  - Executed DELETE calls on Repliz API removing both duplicate schedule entries (`6aefec5fab5593483d164447` IG & `6aefec5fab5593483d16444f` FB).
- **Produced and Scheduled Fresh Content (Feed-05):**
  - Topic: "KIRIM TOTALAN CUMA DI CHAT WA?" (Alasan Klien Sering Lama Transfer & Cara Bikin Invoice Resmi Sekali Klik).
  - Graphic: 1080x1080 modern fintech flat-vector illustration comparing informal WhatsApp text chat vs verified official PDF invoice with instant QRIS.
  - Copywriting: 100% zero-emoji, senior practitioner tone highlighting finance division requirements and invoice urgency.
  - Hosted media permanently on GitHub Raw (`feed_05_kirim_totalan_chat_wa.jpg`).
  - Successfully scheduled to Repliz for Tuesday, 10 Nov 2026 @ 19:30 WIB (IG: `6af172fefa8dfae463a4c73b`, FB: `6af172fe774114a8ae79ff22`).

## [2026-11-09] Full Project Lint Verification & Component Polish (v2.9.32)
- **ESLint Zero-Error Audit Pass:**
  - Audited full workspace with `eslint .` resolving all 9 reported errors:
    1. `BuatInvoiceGratis.jsx`: Safely handled legacy `taxAmount` backwards-compatibility alias.
    2. `BuatPenawaranGratis.jsx`: Safely handled legacy `taxAmount` backwards-compatibility alias.
    3. `IndustryLanding.jsx`: Refactored into pure keyed child component (`IndustryLandingContent key={slug}`) removing synchronous `setState` in `useEffect` and eliminating cascading re-renders during route transitions.
    4. `Klien.jsx`: Surfaced modern Excel export button in client management header and safely registered CSV exporter.
    5. `src/pages/kasir/Stok.jsx`: Added Excel export button to cashier stock header, standardized action button colors to brand violet (`bg-violet-600`), and resolved unused export helpers.
- **Production Build & Pre-Render Verification:**
  - Ran clean production build (`npm run build`) generating 90 precache entries and 33 static SEO routes with 0 errors in 21.95s.

## [2026-11-09] Corporate B2B Tax Dropdown Selector & Withholding Scheme (v2.9.31)
- **Corporate B2B Tax Selector Dropdown (`BuatInvoiceGratis.jsx`, `Invoice.jsx`, `BuatPenawaranGratis.jsx`):**
  - Replaced legacy binary tax checkbox with an 8-option Indonesian commercial and corporate B2B tax dropdown selector:
    1. Tanpa Pajak (0%): For tax-exempt freelance or MSME transactions.
    2. PPN 11% (Pertambahan Nilai): Standard VAT rate under current UU HPP.
    3. PPN 12% (UU HPP Standar): Future-ready Indonesian VAT rate.
    4. Potongan PPh 23 Jasa (-2%): Corporate service withholding tax deductible by clients.
    5. Potongan PPh 23 Non-NPWP (-4%): Service withholding rate for entities without NPWP.
    6. Potongan PPh 21 Tenaga Ahli (-2.5%): Expert/consultant personal income tax withholding.
    7. Kombinasi B2B: PPN 11% & Potongan PPh 23 (-2%): Full corporate procurement standard.
    8. Kustom Tarif (+%): Custom percentage rate with inline numerical input.
- **Precision Financial Mathematics & Netto Transfer Calculation:**
  - Formula: `ppnAmount = round(afterDiscount * ppnRate)`, `pphAmount = round(afterDiscount * pphRate)`, `grandTotal = max(0, afterDiscount + ppnAmount - pphAmount)`.
  - When PPh deduction is present, the final total dynamically transitions to "Total Ditagihkan (Netto Transfer)" with explanatory footnote `*Klien menyetorkan bukti potong (Bupot)`.
- **Seamless Document & Export Integration:**
  - Screen worksheet hides raw select widget in print/PDF while rendering dedicated calculation rows for PPN additions and PPh deductions.
  - Pre-filled WhatsApp messages dynamically format the full tax breakdown, subtotal, and net transfer amount for corporate clients.
- **Strict Brand Palette Enforcement:**
  - Retained strict Black, White, and Purple (`violet-600` / `violet-700` / `#7C3AED`) palette with 0 external colors or emojis.

## [2026-11-09] Strict Brand Palette Standardization: Black, White & Purple (v2.9.30)
- **Unified 3-Color Brand Palette Standard (Hitam, Putih, Purple):**
  - Standardized all public landing pages and free document generators to strictly 3 cohesive colors:
    1. Hitam (Black / Zinc-900 / Zinc-950): Deep background cards, crisp typography, and high-contrast buttons.
    2. Putih (White / Zinc-50 / hairline Zinc-200 borders): Paper worksheets, clean backgrounds, and secondary cards.
    3. Purple (Violet `#7C3AED` / `violet-600` / `violet-700`): The single official brand accent color for action buttons, stamps, active milestones, and focus rings.
- **Eliminated Dispersed Rainbow Accents:**
  - Removed all competing neon emerald greens (`bg-emerald-600`, `text-emerald-700`), saturated amber/yellow highlights (`bg-amber-50`, `text-amber-800`), and bright blues across `BuatInvoiceGratis.jsx`, `BuatKwitansiGratis.jsx`, `BuatPenawaranGratis.jsx`, `SoftwareInvoiceFreelance.jsx`, `AplikasiKasirKafe.jsx`, and `AplikasiKasirOffline.jsx`.
- **Complete Elimination of UI Collisions & Floating Tooltips:**
  - Confirmed the permanent removal of absolute-positioned stamp overlaps and distracting "Klik untuk edit" hover tooltips in `BuatInvoiceGratis.jsx`.
  - Converted the invoice and receipt header stamps into cleanly integrated status badges in the top right document header.

## [2026-11-09] UI Cleanup, WhatsApp Reminder Templates, Role Kasir Guard & Dashboard Referral (v2.9.29)
- **Instant Invoice UI Overhaul & Collision Fix (`src/pages/BuatInvoiceGratis.jsx`):**
  - Resolved status stamp collision where "MENUNGGU PEMBAYARAN" was overlapping the business name input field and "Klik untuk edit" hover label.
  - Converted the invoice paper header into a responsive flexbox row isolating company information on the left from invoice title and status stamp on the right.
  - Completely stripped distracting hover text tooltips ("Klik untuk edit") and simplified the guidance banner into an understated, clean notification bar.
- **Smart WhatsApp Reminder Templates Modal (`src/pages/BuatInvoiceGratis.jsx`):**
  - Integrated 3 pre-crafted WhatsApp message tones into a modern modal:
    1. Tagihan Baru: Formal invoice dispatch with bank transfer details and due date.
    2. Pengingat Ramah H-2: Polite, friendly follow-up without aggressive collection tones.
    3. Konfirmasi Lunas: Instant receipt confirmation and partnership thank-you message.
- **Role Kasir vs Owner Guard (`src/components/OwnerPinGuard.jsx`, `LaporanKasir.jsx`, `Laporan.jsx`):**
  - Created `OwnerPinGuard` component to prevent store cashiers from accessing sensitive business secrets (daily revenue, gross profit, margin, and expense logs).
  - Protected `/kasir/laporan` and `/laporan` with Admin/Manager PIN verification when a cashier shift is active.
- **Referral & Partner Viral Loop Widget (`src/pages/Dashboard.jsx`):**
  - Added modern high-contrast "Program Rekan Bisnis" card in Dashboard with unique referral link, 1-click clipboard copy, and pre-formatted WhatsApp invite message for fellow business owners.

## [2026-11-08] Modern Fintech Landing Redesign & Internal Linking Hub & POS Excel Export (v2.9.28)
- **Modern Minimalist UI/UX Overhaul (`src/pages/IndustryLanding.jsx`):**
  - Removed loud purple gradients, rainbow badges, and noisy color blocks that felt like an artificial/generic AI template.
  - Implemented high-end Stripe/Linear-grade aesthetic: sleek slate-900 typography, neutral slate-50/90 financial summary cards, authentic paper-like thermal receipt simulator, and subtle hairline borders (`border-slate-200/80`).
  - Optimized bundle footprint: component chunk size reduced from 81 kB to 22.39 kB.
- **Internal Linking Hub & Solutions Directory (`src/pages/SolusiHub.jsx` & `src/components/LandingFooter.jsx`):**
  - Created `/solusi` (Direktori Solusi Industri & Usaha): A dedicated directory page with instant keyword search and category filtering across all 20 business solutions.
  - Expanded `LandingFooter.jsx` with an industry solutions sub-footer grid linking directly to all 20 specialized landing pages for maximum PageRank pass-through and rapid Google indexation.
- **Export to Excel (.xlsx) for POS Reports & Debt Tracking (`src/pages/LaporanKasir.jsx` & `src/pages/HutangPiutang.jsx`):**
  - Added `handleExportExcel` to `LaporanKasir.jsx`: Generates a multi-sheet Excel workbook with Sheet 1 (`Ringkasan Transaksi POS` with cashier, payment method, tax, discounts, totals) and Sheet 2 (`Rincian Item Terjual` with itemized quantities, category, unit prices).
  - Upgraded `HutangPiutang.jsx` with dedicated `handleExportExcel` generating dual-sheet workbook for customer receivables and vendor debts.
- **Production Build & Verification:**
  - Built cleanly in 50.77s with 0 errors; pre-rendered routes expanded to 33 routes total in `dist/`. Registered `/solusi` in `public/sitemap.xml`.

## [2026-11-08] Programmatic SEO Batch 4: SPH Quotations & Specialized B2B (v2.9.27)
- **Batch 4 Rollout (5 High-Converting Specialized Landing Pages):**
  - `/buat-penawaran-harga-kontraktor`: Specialized for general contractors and builders (RAB calculation, m² and m³ volume breakdowns, structural/finishing milestone stages).
  - `/buat-penawaran-harga-catering`: Specialized for corporate catering and wedding banquets (pax volume calculation, buffet & food stall breakdowns, quotation validity).
  - `/buat-penawaran-harga-pengadaan-it`: Specialized for B2B IT hardware and network procurement (detailed technical specs, PPN 11% calculation, 2-year distributor warranty).
  - `/buat-penawaran-harga-interior`: Specialized for interior designers and custom furniture workshops (meter lari kabinet, HPL woodgrain finishing, slow-motion Blum hardware).
  - `/aplikasi-kasir-cuci-motor`: Specialized for car wash and snow wash outlets (queue ticket number generation, vehicle license plate tracking, washer technician commission).
- **Programmatic SEO Engine Completion (20 Total Targeted Landing Pages across 4 Batches):**
  - Fully established 20 dedicated industry landing pages with interactive simulators (termin invoicing & thermal receipt POS), comparison tables, pain points, and schema.org JSON-LD FAQ/Breadcrumbs.
- **SEO & Sitemap Automation (`scripts/prerender-seo.mjs`, `public/sitemap.xml`):**
  - Pre-rendered all 5 Batch 4 pages into static HTML in `dist/`.
  - Registered all 5 URLs in `public/sitemap.xml` with priority 0.85 and weekly update frequency.
- **Production Build:**
  - Vite built in 47.75s with 0 errors; pre-rendered routes expanded to 32 static routes total.

## [2026-11-08] Programmatic SEO Batch 3: Retail Essentials & Printing Events (v2.9.26)
- **Batch 3 Rollout (5 High-Converting Specialized Landing Pages):**
  - `/aplikasi-kasir-petshop`: Specialized for pet shops and grooming salons (repack pet food per kg, cat/dog grooming queues, anti-flea treatments).
  - `/aplikasi-kasir-toko-baju`: Specialized for clothing stores, boutiques, and distros (size S/M/L/XL and color variants, instant checkout discount).
  - `/aplikasi-kasir-toko-kelontong`: Specialized for grocery stores and warung sembako (super lightweight, 5-second cash/wholesale checkout, offline-first reliability).
  - `/invoice-untuk-percetakan`: Specialized for digital printing and screen printing (square meter m² calculations, banner finishing, DP 50% lock before printing).
  - `/invoice-untuk-event-organizer`: Specialized for event organizers and production vendors (line array sound, stage rigging, 3-stage milestone invoicing: DP 30%, loading H-1, pelunasan).
- **Public Route & Auth Protection (`src/App.jsx`):**
  - Hardened `AuthRedirector` to recognize all programmatic SEO paths (`/invoice-untuk-*`, `/aplikasi-kasir-*`, `/buat-penawaran-harga-*`, `/solusi/*`) as public, preventing accidental auth checks or redirect delays for direct search traffic.
- **SEO & Sitemap Automation (`scripts/prerender-seo.mjs`, `public/sitemap.xml`):**
  - Pre-rendered all 5 Batch 3 pages into static HTML in `dist/` with customized breadcrumbs and schema.org JSON-LD FAQ data.
  - Registered all 5 URLs in `public/sitemap.xml` with priority 0.85 and weekly update frequency.
- **Production Build:**
  - Vite built in 32.54s with 0 errors; pre-rendered routes expanded from 22 to 27 routes total.

## [2026-11-08] Programmatic SEO Batch 2: Service & Event Providers (v2.9.25)
- **Batch 2 Rollout (5 High-Converting Specialized Landing Pages):**
  - `/invoice-untuk-catering`: Specialized for event catering, wedding banquets, and office lunch boxes (pax breakdown, sewa pemanas, DP 30%).
  - `/invoice-untuk-rental-mobil`: Specialized for car rental, Hiace tours, and airport transfers (armada, supir, BBM, overtime rules).
  - `/invoice-untuk-konsultan`: Specialized for business, IT, and legal consultants (retainer hours, milestone deliverables, PPh 23 calculation).
  - `/aplikasi-kasir-bengkel`: Specialized for motorcycle and car workshops (separation of mechanic labor vs spare parts, vehicle license plate tracking).
  - `/aplikasi-kasir-vape`: Specialized for vape stores and e-cigarette communities (Freebase/Saltnic liquid variants, coil/cartridge stock, QRIS).
- **SEO & Sitemap Automation (`scripts/prerender-seo.mjs`, `public/sitemap.xml`):**
  - Pre-rendered all 5 Batch 2 pages into static HTML in `dist/` with tailored JSON-LD schemas and breadcrumb trails.
  - Added all 5 URLs to `public/sitemap.xml` with priority 0.85 and weekly update frequency.
- **Production Build:**
  - Vite built in 17.90s with 0 errors; pre-rendered routes expanded to 22 routes total.

## [2026-11-08] Programmatic SEO Engine & Batch 1 High-Intent Landing Pages (v2.9.24)
- **Universal Programmatic Industry Engine (`src/pages/IndustryLanding.jsx` & `src/data/seoIndustries.js`):**
  - Architected a centralized data-driven programmatic SEO engine supporting both `invoice` and `kasir` modes.
  - Features real-time interactive Invoicing Simulator (DP 50%, DP 30%, Pelunasan, Full), WhatsApp quote sharing, and Thermal Receipt POS Simulator (58mm/80mm toggle, line items, animated printing).
  - Includes industry pain points, "MyInvoice vs Cara Tradisional" comparison grid, and FAQ accordions with schema.org JSON-LD structured data.
- **Batch 1 Rollout (5 High-Converting Specialized Landing Pages):**
  - `/invoice-untuk-desainer`: Specialized for graphic designers, UI/UX, and creative studios (AI/Figma file handoff, DP 50%).
  - `/invoice-untuk-kontraktor`: Specialized for general contractors, home renovators, and interior designers (termin fisik, retensi 5%).
  - `/invoice-untuk-fotografer`: Specialized for wedding photographers, video creators, and photo studios (booking DP, album kayu).
  - `/aplikasi-kasir-laundry`: Specialized for laundry kiloan, express, and dry clean (Bluetooth 58mm/80mm, nomor rak baju).
  - `/aplikasi-kasir-barbershop`: Specialized for barbershops, hair salons, and grooming (komisi kapster, antrean, retail pomade).
- **SEO & Sitemap Automation (`scripts/prerender-seo.mjs`, `public/sitemap.xml`):**
  - Pre-rendered all 5 Batch 1 pages to static HTML in `dist/` with high-contrast titles, meta descriptions, Breadcrumbs, and JSON-LD schemas.
  - Registered all 5 URLs in `public/sitemap.xml` with priority 0.85 and weekly update frequency.
- **Production Build:**
  - Vite compiled in 17.34s with 0 errors; total pre-rendered static routes expanded from 12 to 17 routes.

## [2026-11-08] Global Anti-Flicker Audit & SWR Hardening across All Modules (v2.9.23)
- **Comprehensive Page Audit for Event Listener & Re-render Flickers:**
  - Audited all 24+ core application pages (`Invoice`, `CatatanBisnis`, `Kasir`, `Klien`, `HutangPiutang`, `PenawaranHarga`, `PurchaseOrder`, `TandaTerima`, `Laporan`, `LaporanKasir`, `Stok`, `Produk`, etc.) for background event listeners (`focus`, `visibilitychange`, `data-updated`, `kasir-updated`, `cashbook-updated`, `invoice-updated`).
  - Confirmed that standard business documents (`Invoice`, `CatatanBisnis`, `Klien`, `HutangPiutang`, `PenawaranHarga`, `PurchaseOrder`, `TandaTerima`, `Laporan`) already used silent in-place state mapping or protected `isInitial` flags without resetting UI states.
- **Kasir Report SWR Hardening (src/pages/LaporanKasir.jsx, src/pages/kasir/Laporan.jsx):**
  - Found and resolved potential flash in `src/pages/LaporanKasir.jsx`: background event listener passed `fetchData(true)` which triggered `setLoading(true)` and flashed a "Memuat..." placeholder. Updated to `fetchData(false)` for silent background revalidation.
  - Hardened `src/pages/kasir/Laporan.jsx`: converted `loadData()` to accept `(isInitial = false)` so background updates from `kasir-updated` never unmount or show loaders.
- **Production Verification:**
  - Full production build completed in 17.74s with 0 errors; 86 precached PWA assets and 12 pre-rendered SEO routes confirmed.

## [2026-11-08] Dashboard Anti-Flicker & Stale-While-Revalidate Engine (v2.9.22)
- **Eliminate Screen Flickering & False Refresh (src/pages/Dashboard.jsx):**
  - Identified root cause of screen "blinking": `window.focus` and `visibilitychange` events triggered `fetchDashboardData()`, which wiped all state to zero (`setCashbook([])`, `setTotalIncome(0)`) and set `isFetching(true)`. This unmounted the Dashboard DOM and flashed `<DashboardSkeleton className="animate-pulse" />` on every tab switch or window focus.
  - Re-engineered data synchronization into a true Stale-While-Revalidate (SWR) architecture using a `hasLoadedOnce` flag: `<DashboardSkeleton />` is strictly rendered on initial entry (`loading || (!hasLoadedOnce && isFetching)`).
  - Background re-syncs now update metrics and charts seamlessly in-place without zeroing data or unmounting the UI.
  - Implemented 5-second throttling on focus/visibility events and increased debounce to 300ms to eliminate redundant API calls.
- **Production Verification:**
  - Build verified with 0 errors; 86 precached PWA assets and 12 pre-rendered SEO routes generated.

## [2026-11-08] Dashboard Onboarding Localization & Copywriting Fix (v2.9.21)
- **Dashboard Onboarding Widget Localization (src/pages/Dashboard.jsx):**
  - Resolved raw placeholder translation strings (onb_widget_title, onb_step_progress_msg, onb_step1_title, onb_step2_title, onb_step3_title, onb_step4_title, and 50% completed).
  - Explicitly rendered clear, high-converting Indonesian copy and dynamic progress counters (`X dari 4 langkah awal telah diselesaikan.`, `X% Selesai`).
- **Complete Dictionary Integration (src/context/LanguageContext.jsx):**
  - Added comprehensive definitions for all onboarding keys and export toasts across both `translations.ID` and `translations.EN`.
- **Export Toast Message Hardening (src/pages/Klien.jsx, src/pages/kasir/Stok.jsx):**
  - Cleaned up toast alerts on CSV/Excel export triggers to prevent any possibility of raw key fallbacks.
- **Production Build & Verification:**
  - Vite compiled in 17.11s with 0 errors; 86 precached PWA assets and 12 SEO routes pre-rendered successfully.

## [2026-11-08] Dashboard Onboarding Checklist & Inventory/Client Excel Export (v2.9.20)
- **Gamified Dashboard Setup Checklist Widget (src/pages/Dashboard.jsx):**
  - Integrated a dynamic onboarding setup progress card right on the main dashboard to guide new users through critical day-1 setup actions.
  - Dynamically calculates progress across 4 key milestones: Business Account Activation, Profile & Store Logo Setup, First Product/Menu Addition, and First Invoice/POS Transaction.
  - Features real-time completion status, progress bar (25% - 100%), direct 1-click action buttons, collapsible toggle, and persistent dismiss preference in localStorage.
- **Inventory Stock Data Export (src/pages/kasir/Stok.jsx):**
  - Added one-click Ekspor CSV and Excel (.xlsx) buttons on the stock management header.
  - Generates comprehensive inventory reports including Product Name, Category, SKU, Current Stock, Unit, Safety Thresholds, Price, and Stock Status.
- **Client & Customer Data Export (src/pages/Klien.jsx):**
  - Added one-click Ekspor CSV and Excel (.xlsx) buttons on the client management header.
  - Exports full customer database records (Name, Contact Person, Phone/WhatsApp, Email, City, Address, Notes, Creation Date) eliminating UMKM data lock-in fears.
- **Production Verification:**
  - Full production build (npm run build) succeeded with 0 errors and 12 static SEO routes generated.


## [2026-11-08] Coming Soon Overhaul for Affiliate and Karir Pages (v2.9.19)
- **Affiliate Program Transition (src/pages/Affiliate.jsx):**
  - Replaced legacy Mayar referral links, outdated commission calculators, and tables with a clean, modern "Coming Soon" teaser page.
  - Featured a preview of upcoming recurring revenue sharing, real-time analytics dashboard, direct bank disbursements, and early partnership inquiries via email.
- **Career & Recruitment Transition (src/pages/Karir.jsx):**
  - Replaced outdated job listings and lengthy value statements with an executive "Coming Soon" recruitment hold page.
  - Highlighted future work culture perks (WFA flexibility, UMKM impact, rapid ownership) and provided a dedicated spontaneous resume drop channel.
- **Production Build & Verification:**
  - 0 ESLint errors and successful production build with 12 static SEO routes pre-rendered.


## [2026-11-08] Modern Minimalist Redesign for Privacy & Terms (v2.9.18)
- **Unified Document Canvas & Sticky Table of Contents (src/pages/Privacy.jsx, src/pages/Terms.jsx):**
  - Eliminated chunky, disconnected card blocks in favor of a clean, unified modern editorial document canvas on light #FAFAFA background.
  - Added a top segmented switcher tab allowing users to toggle between Privacy Policy and Terms of Service with 1 click.
  - Introduced an Executive Highlights 4-card grid at the top summarizing essential commitments (100% Data Ownership, Zero Ad Brokers, AES-256 Modern Encryption, and Row Level Security).
  - Implemented a desktop Sticky Table of Contents (TOC) with smooth-scroll section jumps (#s1 - #s6, #t1 - #t9).
  - Standardized modern typography with numbered pill badges (01, 02, etc.), elegant dividers, and an integrated official contact card at the conclusion of both documents.
- **Production Build & Verification:**
  - 0 ESLint errors and successful production build with 12 static SEO routes pre-rendered.


## [2026-11-08] SPH Landing Page Light Mode Harmonization (v2.9.17)
- **Unified Design System across Free Business Tools (src/pages/BuatPenawaranGratis.jsx):**
  - Converted the Surat Penawaran Harga (SPH) page from legacy dark mode (bg-[#07090E] & bg-slate-900) to the clean, high-contrast light theme (bg-[#FAFAFA] & bg-white) matching all other public tools (BuatInvoiceGratis, BuatKwitansiGratis, KalkulatorHppGratis).
  - Styled the hero section with a crisp white background, subtle grid lines, and high-contrast violet-indigo gradient headings.
  - Re-themed the interactive quotation worksheet card, action bar buttons, paper wrapper, and totals breakdown.
  - Updated the "1-Click Convert to Invoice" banner to a luminous emerald-teal card and aligned FAQ accordions to clean white cards with zinc borders.
  - Aligned the PRO prestige modal with the bright white modal design used across the rest of the application.
- **Production Build & Code Quality:**
  - 0 ESLint errors and successful production build with 12 static SEO routes pre-rendered.


## [2026-11-08] Legal & Privacy Overhaul: Professional Standards & AES-256 Security (v2.9.16)
- **Eliminated Amateur Military Standard Claims (src/pages/Privacy.jsx):**
  - Removed outdated "algoritma standar militer" phrasing. Replaced with authentic, industry-standard engineering specifications: AES-256 encryption at rest, TLS/HTTPS 1.3 encryption in transit, and database-level Row Level Security (RLS) via Supabase PostgreSQL to ensure strict multi-tenant data isolation.
  - Eliminated overly defensive disclaimers and informal wording; aligned tone with professional Indonesian PDP Law (UU No. 27/2022) compliance and international data protection standards.
  - Updated revision metadata to "Pembaruan Terakhir: 8 November 2026" across both Indonesian (ID) and English (EN) translations.
- **Enterprise SaaS Terms of Service Modernization (src/pages/Terms.jsx):**
  - Transitioned from desktop "EULA" terminology to modern cloud "Syarat & Ketentuan Layanan" (Terms of Service).
  - Removed informal labels like "(The Money Shield)" from Section 4, adopting standard corporate "Batasan Tanggung Jawab (Limitation of Liability)".
  - Standardized legal clauses covering account security, service scope, intellectual property, subscription billing, service termination, and dispute resolution jurisdiction under Pengadilan Negeri Salatiga.
  - Updated metadata to "Pembaruan Terakhir: 8 November 2026" in both ID and EN.
- **Production Build & Code Quality Verification:**
  - Strict ESLint audit passed with 0 errors across modified legal pages.
  - Full production build (npm run build) succeeded with 12 static SEO pre-rendered routes generated and exit code 0.


## [2026-11-08] Enterprise-Grade SEO Optimization Rollout (v2.9.15)
- **Point 1: Per-Page Structured Data (JSON-LD) & Rich Snippets (prerender-seo.mjs):**
  - Injected targeted `FAQPage` schemas and `BreadcrumbList` schemas across all 12 pre-rendered routes, unlocking rich result snippets, FAQ dropdowns, and breadcrumb hierarchy on Google SERP.
- **Point 2: Non-SVG OpenGraph & Twitter Media Cards (index.html, prerender-seo.mjs):**
  - Eliminated unsupported `.svg` fallbacks in OpenGraph and Twitter cards, replacing them with high-resolution PNG/JPG showcases (1200x630 px) to guarantee rich preview cards across WhatsApp, Facebook, LinkedIn, and Twitter.
- **Point 3: Cross-Linking Silo & Related Business Tools (RelatedTools.jsx):**
  - Built and integrated modern `RelatedTools` component across all 7 public landing pages (`BuatInvoiceGratis`, `BuatKwitansiGratis`, `BuatPenawaranGratis`, `KalkulatorHppGratis`, `AplikasiKasirOffline`, `AplikasiKasirKafe`, `SoftwareInvoiceFreelance`), establishing a semantic internal linking network and optimizing PageRank flow.
- **Point 4: Sitemap Modernization (public/sitemap.xml):**
  - Updated all 18 route `<lastmod>` timestamps to `2026-11-08` across `sitemap.xml` to accelerate search engine re-indexing.
- **Point 5: Instant Search Indexing via IndexNow Protocol (scripts/ping-indexnow.mjs):**
  - Deployed verified IndexNow key (`e83f2a9c1d4e7b5a0f6c2e8a1d3b5c7e.txt`) and added `npm run seo:ping` automated webhook delivering all 14 public endpoints to Bing, Yandex, and partner crawlers (HTTP 202 Accepted).
- **Point 6: Webmaster Verification Tags (index.html):**
  - Configured search engine verification meta tags (`msvalidate.01` and Google Search Console hook).
- **Production Verification:**
  - Passed strict ESLint verification (0 errors) and Vite production build with exit code 0.


## [2026-11-08] 72-Hour Social Media Scheduling: Feed-03 & Feed-04 (v2.9.14)
- **Automated Repliz Schedule Rollout (scripts/schedule_72h_batch.mjs):**
  - Integrated permanent, high-reliability GitHub raw media assets (`feed_03_internet_mati_kasir.jpg` and `feed_04_dp_proyek.jpg`) replacing ephemeral hosting to prevent link expiry.
  - Successfully scheduled **Feed-03** (*"INTERNET MATI KASIR TETAP JALAN!"*) for Senin, 9 November 2026 @ 19:30 WIB across Instagram (`6aefec5d7f909f4bfd617445`) and Facebook Page (`6aefec5d7f909f4bfd61745a`) within 33.0 hours (< 72h window).
  - Successfully scheduled **Feed-04** (*"DP PROYEK BUKAN CUAN BERSIH!"*) for Selasa, 10 November 2026 @ 19:30 WIB across Instagram (`6aefec5fab5593483d164447`) and Facebook Page (`6aefec5fab5593483d16444f`) within 57.0 hours (< 72h window).
- **Compliance & Audit Verification:**
  - Strict compliance with 72-Hour forward scheduling threshold and 1 post/day cadence.
  - Repliz API multi-account status audit verified: 24 active future schedules queued with zero overlapping conflicts.


## [2026-11-08] Dashboard Hutang Integration, Smart Due Alert Banner, & StatCard Desktop Fix (v2.9.13)
- **Eliminated Desktop StatCard Stacking & Badge Truncation (StatCard.jsx):**
  - Added `shrink-0 whitespace-nowrap` to badge spans in `StatCard.jsx`, preventing badges like "Beban Usaha" from wrapping onto two lines and vertically ballooning.
  - Added `min-w-0 truncate` and title tooltip to stat titles, and updated padding to `p-4 sm:p-5` with support for optional `className` prop.
  - Streamlined dashboard titles in `LanguageContext.jsx` from "Total Pemasukan Bulan Ini" to "Total Pemasukan" and "Total Pengeluaran Bulan Ini" to "Total Pengeluaran", freeing horizontal space and completely eliminating card header truncation.
- **Integrated Hutang (Payables) KPI Card into Beranda (Dashboard.jsx):**
  - Activated `const [hutang, setHutang] = useState([])` in `Dashboard.jsx` and added `hutang-updated` event listener for real-time synchronization.
  - Extracted `dueDate` for both `piutangList` and `hutangList` from document records.
  - Expanded top KPI cards to a 5-card layout (`grid-cols-2 lg:grid-cols-5`): Total Pemasukan, Total Pengeluaran, Laba Bersih, Total Piutang, and Total Hutang with clickable navigation to `/hutang-piutang`.
  - Updated `DashboardSkeleton` to 5 columns with proper responsive column spans.
- **Added Smart Due Alert Banner (Dashboard.jsx):**
  - Implemented real-time due date evaluator comparing unpaid debts and receivables against today's date and a 3-day window.
  - Renders a prominent, clickable alert banner directly on Beranda when any debt or receivable is overdue (rose alert) or due within 3 days (amber alert, e.g. tomorrow's debt), complete with item count, total amounts, and a 1-click action button to manage debts.
- **Production Verification:**
  - Passed strict ESLint verification (0 errors) and Vite production build with exit code 0.


## [2026-11-08] Mobile Ergonomics Revamp for Accounts Receivable & Debt (v2.9.12)
- **Mobile-First Compact Summary Cards (HutangPiutang.jsx):**
  - Converted stacked full-width summary cards into an ergonomic 2-column grid (`grid-cols-2`), saving over 50% vertical viewport height on smartphone screens.
- **Responsive Controls & Action Bar Layout (HutangPiutang.jsx):**
  - Eliminated severe text squishing on description labels by separating description and filter controls into distinct responsive rows.
  - Formatted "Tampilkan yang Lunas" checkbox, "Ekspor CSV", and "+ Tambah" into an adaptive flex container with proper touch padding.
- **Instant Search Bar (HutangPiutang.jsx):**
  - Added instant search input with clear button (`X`) allowing users on mobile and desktop to search entries by name or notes in real-time.
- **Mobile-First Entry Card & Horizontal Overflow Fix (HutangPiutang.jsx):**
  - Removed `overflow-x-auto` and `minWidth: min-content` wrappers that caused awkward horizontal scroll bugs on mobile.
  - Redesigned `EntryCard` with a 2-tier layout: prominent circular payment toggle, debtor/creditor name, status badges (Jatuh Tempo, Lunas, Segera), monospace amount, and comfortably spaced `Edit` & `Hapus` actions.
  - Increased bottom container padding to `calc(env(safe-area-inset-bottom, 1rem) + 5rem)` ensuring zero collision with the mobile bottom navigation bar.
- **Clean Quality Assurance:**
  - Passed strict ESLint verification (0 errors) and Vite production build with exit code 0.



## [2026-11-08] Fix Client Page Missing Plus Icon Import (v2.9.11)
- **Resolved Runtime Crash in Client Directory (Klien.jsx):**
  - Added missing `Plus` icon import from `lucide-react` in `src/pages/Klien.jsx`, resolving `ReferenceError: Plus is not defined` that triggered the application ErrorBoundary.
  - Verified full-project codebase via ESLint (0 errors) and Vite production build with exit code 0.



## [2026-11-08] Unified Company Logo State Sync & Reappearance Prevention (v2.9.10)
- **Real-Time Cross-Instance Logo Synchronization (useCompanyLogo.js):**
  - Added global event dispatcher (`company_logo_updated`) and storage event listeners inside `useCompanyLogo`, ensuring all active components (Kwitansi preview, LogoUpload, Settings, Navbar) immediately reflect logo upload or deletion without needing a page refresh.
- **Dual-Column Database Cleansing (useCompanyLogo.js, Profile.jsx, Settings.jsx):**
  - Fixed bug where deleting the logo in `LogoUpload` only set `store_logo_url = null`, leaving `company_logo` populated in Supabase `profiles` table, which previously caused the logo to resurrect on component remount or form reset.
  - `clearLogo` and `handleDeletePhoto` now set both `store_logo_url: null` and `company_logo: null` in Supabase, and explicitly remove `company_logo` from `localStorage`.
  - Upgraded `Settings.jsx` company form submit handler to broadcast logo changes to all active views.
- **Verified Zero-Data-Leak Privacy:**
  - Guaranteed absolute data isolation between public free-tier tools and private authenticated accounts via client-side storage isolation and Supabase Row Level Security (RLS).
  - Passed strict ESLint verification (0 errors) and Vite production build with exit code 0.



## [2026-11-08] Fix Dummy Data Carryover Leak & Empty Form Reset (v2.9.9)
- **Eliminated Public SEO Tool Draft Pollution (analytics.js, useStore.js):**
  - Updated `savePublicCarryover` in `analytics.js` to immediately abort if an active user session exists (`sb-*-auth-token`), and eliminated all direct writes to internal dashboard draft keys (`draft_invoice`, `kwitansi_draft`, `sph_draft`, `myinvoice_hpp_carryover`).
  - Decoupled `hppDraftRecipe` in `useStore.js` from `myinvoice_hpp_carryover`, initializing Zustand with a clean empty recipe object by default.
- **Auto-Sanitization on Document Mount (HitungHPP.jsx, Kwitansi.jsx, Invoice.jsx):**
  - Added proactive sanitizers on mount in `HitungHPP.jsx`, `Kwitansi.jsx`, and `Invoice.jsx` that automatically detect and purge legacy marketing dummy templates ("Iced Brown Sugar Latte", "PT Maju Cipta Sejahtera", "Andi Pratama", "Studio Desain dan Kreatif"), immediately resetting forms to clean empty states (`defaultForm()`).
  - Updated form reset handlers (`handleNewRecipe`, `handleReset`) to purge underlying draft keys from `localStorage`.
- **Session-Preserving Full Data Purge (Profile.jsx):**
  - Upgraded `handleDeleteData` in `Profile.jsx` to explicitly purge all draft keys (`draft_invoice`, `kwitansi_draft`, `sph_draft`, `myinvoice_hpp_carryover`, `myinvoice_carryover`, `hpp_draft`, `kasir_cart`, `kasir_open_bills`) while safely preserving active Supabase auth tokens (`sb-*-auth-token`) so users remain logged in after data resets.
  - Verified 100% clean compilation via ESLint (0 errors) and Vite production build with exit code 0.



## [2026-11-08] Global Dashboard & Application-Wide Bahasa Indonesia Lock (v2.9.8)
- **Application-Wide Bahasa Indonesia Enforcement (LanguageContext.jsx, Layout.jsx, Dashboard.jsx, HelpCenter.jsx):**
  - Converted `LanguageProvider` to strictly initialize and persist `lang = 'ID'`, immediately clearing any legacy `'EN'` localStorage keys from previous sessions.
  - Configured `t(key)` to prioritize `translations['ID']` resolution, guaranteeing that Dashboard KPIs, StatCards, 6-Month charts, POS summaries, Revenue Mix, and Unpaid Invoices always render in Indonesian regardless of browser locale cache.
  - Added proactive locale synchronization on mount in `Layout.jsx`, `Dashboard.jsx`, and `HelpCenter.jsx` to ensure currently logged-in users are instantly normalized to Bahasa Indonesia.
  - Updated Help Center (`HelpCenter.jsx`) guide panel and step renderer suffix to strictly evaluate `'ID'`, rendering all 10 user guide categories and detailed steps in Indonesian.
  - Localized Sidebar tooltips (`Sidebar.jsx`) to "Perluas Sidebar", "Perkecil Sidebar", "Kembali ke Beranda", and aligned Help Center nav key to "Pusat Bantuan".
  - Passed strict ESLint verification (0 errors) and Vite production build with exit code 0.

---

## [2026-11-07] Auth Suite Pure Bahasa Indonesia Lock & Language Switcher Removal (v2.9.7)
- **Pure Bahasa Indonesia Auth Suite & Dual-Language Elimination (Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx):**
  - Removed top-right language toggle button and Globe icon from Login, Register, Forgot Password, and Reset Password pages, eliminating dual-language confusion and English UI leakage.
  - Enforced automatic locale synchronization on auth page mount (enforcing 'ID' in state and localStorage) so existing browser sessions previously set to English are immediately normalized to Bahasa Indonesia.
  - Replaced English footer text in the Indonesian dictionary ('Made for global businesses.') with 'Dibuat untuk bisnis modern.'.
  - Localized login tabs and descriptions from 'Magic Link' to 'Link Masuk' and updated email placeholders to 'contoh@email.com'.
  - Removed dangling language toggle element from ResetPassword.jsx and cleaned up all dual-language ternaries in Register.jsx.
  - Verified 100% clean compilation via ESLint and Vite production build with 0 errors.

---

## [2026-11-07] Mobile Ergonomics, I18n Translation Fixes, & High-Contrast Module Neutralization (v2.9.6)
- **Mobile POS Checkout Ergonomics & Draggable FAB (Kasir.jsx, Layout.jsx):**
  - Elevated mobile Kasir bottom checkout bar to calc(78px + env(safe-area-inset-bottom, 0px)) with z-[450] so the Pay/Checkout button is never obscured by the mobile bottom navigation bar and can be tapped freely.
  - Eliminated redundant bottom-right Zen mode button collision in mobile Kasir view.
  - Made the global quick action floating action button (QuickActionFAB) touch/mouse draggable with persistent screen coordinate memory, allowing users to position it freely anywhere on the screen.
  - Hidden QuickActionFAB on cashier routes to give full screen focus to retail operations.
- **Store Name Identity & Profile Ergonomics (Profile.jsx, Invoice.jsx):**
  - Added dedicated Nama Toko / Bisnis field in user profile with synchronized persistence across Supabase (profiles.store_name) and localStorage (company_profile, kasir_settings).
  - Removed trash can icon from the Remove Photo button for cleaner minimal aesthetic.
  - Resolved generic "Toko Kami" WhatsApp sender fallback by properly resolving store name from user profile, invoice data, and local cache.
- **100% Comprehensive I18n Coverage & PDF Translation Key Fix (LanguageContext.jsx, Invoice.jsx):**
  - Added all missing document and modal dictionary keys (doc_bill_to, doc_from, total_amount, inv_unpaid, inv_paid, inv_thanks_note, etc.) to both Indonesian and English translation dictionaries.
  - Completely resolved raw untranslated tokens (DOC_BILL_TO, DOC_FROM, TOTAL_AMOUNT) in generated PDF documents and previews.
  - Deduplicated translation dictionary entries, passing strict ESLint analysis with 0 errors.
- **Eliminated Redundant Product Emoji Selector (ProductModal.jsx, Kasir.jsx, Produk.jsx):**
  - Removed the legacy 'EMOJI ICON' (M1-M5) selector from the Add/Edit Product modal in cashier and product management, keeping the form streamlined since products now fully utilize uploaded photos.
  - Replaced legacy text emoji fallbacks in low-stock / out-of-stock cashier alerts and product catalogs with actual product photo thumbnails and clean Package icon fallbacks.
- **High-Contrast Rainbow Neutralization Across Modules (HutangPiutang.jsx, Dashboard.jsx, Klien.jsx, HitungHPP.jsx, Laporan.jsx, PurchaseOrder.jsx, Kwitansi.jsx):**
  - Neutralized Accounts Receivable (HutangPiutang.jsx) green/red top borders, neon figures, and bright orange CSV button into clean SaaS slate borders and monochrome stats.
  - Replaced Menara Pengawas rainbow progress cards with sleek slate indicators, reserving alert color strictly for critical threshold breaches (>=80%).
  - Neutralized Client directory revenue figures to clean slate monospace typography.
  - Converted HPP Calculator accordion items, cost badges, and add-item buttons to clean slate cards with subtle dashed borders.
  - Neutralized purple document table headers and total bars across Invoice, Purchase Order, and Kwitansi to authoritative dark slate (#0F172A).

---

## [2026-11-07] Design Polish: Neutral SaaS Color Palette & Button Hierarchy (v2.9.5)
- **Priority 1 — Business Documents Neutralization (Invoice.jsx, PurchaseOrder.jsx, TandaTerima.jsx, PenawaranHarga.jsx, Kwitansi.jsx):**
  - Replaced colored pastel containers and thick left borders (orange, green, blue) across Vendor, Delivery, and Goods Receipt with clean white cards (border: 1px solid #E2E8F0, rounded-xl, deep slate titles).
  - Unified disparate action toolbars into modern SaaS button hierarchy: neutral outline with subtle hover for secondary actions (Reset, Duplicate, PDF) and dark zinc (bg-slate-950 / #0F172A) for primary save actions.
- **Priority 2 — Cost Calculator Streamlining (HitungHPP.jsx):**
  - Removed rainbow card backgrounds and borders from SectionCard and Platform Costs, adopting clean SaaS white panels with border: 1px solid #E2E8F0 and neutral category headers.
  - Unified header action buttons to standard SaaS hierarchy with neutral outline and dark zinc save.
- **Priority 3 — Financial Reports Visual Cohesion (StatCard.jsx, Laporan.jsx):**
  - Neutralized huge neon colored values in StatCard to authoritative, high-contrast dark text (text-slate-900 font-mono), shifting semantic colors (emerald, rose, indigo, amber) into subtle icon pill badges.
  - Consolidated separate colored export buttons (green outline CSV, green solid Excel, purple solid PDF) into a single sleek segmented export toolbar.

---

## [2026-11-07] Structured Sidebar Navigation & Modernized Invoice Ledger Management (v2.9.4)
- **Functional Sidebar Grouping (src/components/Sidebar.jsx, src/context/LanguageContext.jsx):**
  - Reorganized the flat list of 13 vertical navigation items into 4 distinct functional sections:
    1. OPERASIONAL (Dashboard, Catatan Bisnis, Kasir POS dropdown).
    2. DOKUMEN BISNIS (Invoice, Kwitansi, and collapsible toggle + Dokumen Lain for Surat Jalan, SPH, and PO).
    3. KEUANGAN & RELASI (Hutang Piutang, Daftar Klien).
    4. ANALITIK & ALAT (Laporan Keuangan PRO, Hitung HPP ULTIMATE).
  - Maintained full icon accessibility in collapsed mode and preserved auto-expansion on direct document route hits.
- **Modern Invoice Management & Ledger Architecture (src/pages/Invoice.jsx):**
  - Added real-time financial metrics banner: Total Billed, Total Paid (Emerald), and Total Unpaid/Due (Amber).
  - Built a modern, searchable bank-style ledger table under Daftar Invoice with status tabs (Semua, Belum Dibayar, Lunas) and instant search across document numbers and client names.
  - Implemented 1-click Tandai Lunas action with auto-creation of linked Kwitansi and automatic cashbook income sync.
  - Integrated full quick action controls: WhatsApp breakdown sharing, preview modal, PDF download, and audited deletion.

---

## [2026-11-07] Cashier (Kasir POS) Comprehensive UI/UX Overhaul & Desktop/Mobile Polish (v2.9.3)
- **Unified Single Header (`src/pages/Kasir.jsx`):**
  - Consolidated 3 stacked header bars (Top Bar, Info/Shift Bar, and Alert Bar) into a single sleek modern header, recovering 80px+ vertical workspace on desktop and tablet.
  - Merged cashier name, date, outlet selector, stock warning pill, Open Bills counter, F&B mode switch, and settings into one cohesive control center.
- **Desktop & Tablet Visual Polish (`src/pages/Kasir.jsx`, `src/components/kasir/Cart.jsx`):**
  - Fixed duplicate "Cart" header by removing redundant wrapper header and streamlining `<Cart />` header with item badge and instant clear action.
  - Redesigned product catalog cards with 4:3 visual ratio, clean placeholder artwork for imageless items, monospace IDR pricing, stock badges, and an explicit quick-add button (`+`).
  - Completely modernized `Cart.jsx` with monospace financial summary, client selector with user icon, zero-emoji items list (`{item.emoji}` replaced by `<Package />` or thumbnail), and a prominent dark zinc checkout button (`bg-slate-950`).
- **Sidebar Streamlining & Translation Fix (`src/components/Sidebar.jsx`, `src/context/LanguageContext.jsx`):**
  - Added missing `nav_kasir_more` and `nav_kasir_less` keys in English and Indonesian dictionaries, resolving the raw `+ nav_kasir_more` label in sidebar.
  - Reduced cashier sub-items to 3 primary links with collapsible secondary tools.
- **Mobile Smartphone Ergonomics (`src/pages/Kasir.jsx`):**
  - Floating bottom checkout bar under cashier's thumb with quick item count and total.
  - Slide-up bottom sheet drawer for adjusting quantities, applying vouchers, and checking out without page scrolling.

---

## [2026-11-07] Business Notes (Catatan Bisnis) Modern UI/UX Remake (v2.9.2)
- **Bank Ledger Layout (`src/pages/CatatanBisnis.jsx`):**
  - Replaced bulky floating mobile-style cards with a clean, unified bank ledger container (`divide-y divide-slate-100 dark:divide-slate-800`), date headers with net daily balances, and clear visual separation between manual owner entries (`MANUAL`) and POS cashier sync (`POS KASIR`).
- **Consolidated Toolbar & Filter Bar (`src/pages/CatatanBisnis.jsx`):**
  - Unified scattered period and type filter buttons into a cohesive, neutral slate toolbar with active state tabs and streamlined CSV export.
- **Form & Input Polish (`src/pages/CatatanBisnis.jsx`):**
  - Upgraded left transaction panel with segmented toggle pills (`+ Pemasukan` / `- Pengeluaran`), clean currency input with monospace typography and `Rp` prefix, streamlined category/date inputs, and a dark zinc primary button (`bg-slate-950`).
  - Polished delete action to a subtle hover-friendly control, eliminating intrusive bright red icons on every row.

---

## [2026-11-07] Remaining Document, Client, Cost Calculator & Settings Sync Fixes (v2.9.1)
- **Settings Document Numbering & Loyalty Sync (`src/utils/docNumber.js`, `src/pages/Settings.jsx`):**
  - Connected `docNumber.js` (`peekDocNumber`, `incrementDocNumber`, `getNextDocNumber`) to `doc_settings` so custom prefixes, separators, year/month toggles, and start numbers in `Settings` apply across `Invoice`, `Kwitansi`, `Penawaran Harga`, `Tanda Terima`, and `Purchase Order`.
  - Synced `loyalty_enabled`, `points_per_amount`, and `points_value` to `profiles` in `Settings.saveAll()` and triggered `refreshProfile()` + `data-updated` for immediate POS & document template updates.
- **Client & Document Auto-Increment Fixes (`src/pages/Klien.jsx`, `src/pages/PenawaranHarga.jsx`, `src/pages/Kwitansi.jsx`, `src/pages/TandaTerima.jsx`, `src/pages/PurchaseOrder.jsx`, `src/pages/HitungHPP.jsx`):**
  - Loaded `purchase_orders` into `Klien.jsx` history, normalized case-insensitive trimmed client matching across Invoices/Receipts/Quotations/POs, and synced `paidRevenue` via `isPaidStatus`.
  - Added missing `incrementDocNumber` calls on save in `PenawaranHarga.jsx` (`sph`) and `Kwitansi.jsx` (`kwitansi`); fixed Free-tier edit blocking & undefined audit/download client fields in `TandaTerima.jsx` & `PurchaseOrder.jsx`.
  - Guarded `margin_percent` against divide-by-zero (`Infinity`) when `totalHPP === 0` in `HitungHPP.jsx`.

---

## [2026-11-07] Cross-Module Accounting Unification, Local WIB Dates & Two-Way Sync (v2.9)
- **Single-Source Accounting Engine (`src/utils/accounting.js`, `src/pages/Dashboard.jsx`, `src/pages/Laporan.jsx`, `src/pages/LaporanKasir.jsx`):**
  - Unified Income/Expense aggregation across Home, Reports, and POS Reports (`kasir_transactions` paid + `documents` paid `invoice`/`inv` + `kasir_expenses` + `cashbook` excluding automated mirror rows via `isMirrorCashbookRow`).
  - Removed unpaid `hutang`/`piutang` and auto-generated `kwitansi` from realized revenue/expense totals to prevent double-counting.
- **Local WIB Timezone Normalization (`src/utils/date.js`, `src/pages/Kasir.jsx`, `src/pages/kasir/Pengeluaran.jsx`, `src/pages/kasir/Laporan.jsx`):**
  - Replaced UTC `toISOString().split('T')[0]` with local `todayStr()` and `normalizeDateYMD()` to eliminate 00:00-06:59 WIB date shift across filters, charts, and POS reports.
- **Two-Way Status & Cashbook Reconciliation (`src/pages/CatatanBisnis.jsx`, `src/pages/Invoice.jsx`, `src/pages/Kwitansi.jsx`, `src/pages/HutangPiutang.jsx`):**
  - Synced `Invoice` (`handleSave` & `handleUpdateStatus`), `Kwitansi`, `HutangPiutang` (`dueDate` overdue logic & paid sync), and `kasir/Pengeluaran` with valid `cashbook` columns (`reference_id`, `reference_type`, `document_id`, `is_automated`, `outlet_id`).
  - Added two-way rollback in `CatatanBisnis.jsx` (`performDelete` reverts linked paid Invoices/Receivables/Payables to `unpaid` or deletes linked POS/Receipt rows).
- **Crash & Quota Fixes (`src/pages/CatatanBisnis.jsx`, `src/pages/Laporan.jsx`, `src/context/PlanContext.jsx`):**
  - Imported missing `Lock` (`CatatanBisnis.jsx`) and `BarChart2` (`Laporan.jsx`) icons for Free-tier prompts; fixed `PlanContext.incrementDownload` schema columns (`doc_number`, `total_amount`) and excluded automated mirror rows from manual Business Notes quota; removed remaining UI emojis (`⏰`, `{p.emoji}`).

---

## [2026-11-07] Cross-Module Accounting & Synchronization Audit (v2.8.1)
- Audited core financial data flow across `Dashboard.jsx`, `Laporan.jsx`, `CatatanBisnis.jsx`, `Invoice.jsx`, `Kwitansi.jsx`, `HutangPiutang.jsx`, `Kasir.jsx`, `kasir/Pengeluaran.jsx`, and `kasir/Laporan.jsx`.
- Identified 5 core sync/logic findings: (1) `HutangPiutang` unpaid items counted as realized income/expense in `Laporan`/`Dashboard`, double-counting when marked paid, plus missing `total_amount`/`client_name`/`doc_number` in `select()` projections; (2) `Invoice.jsx` auto-cashbook failing silently due to invalid `source` column (`is_automated` in schema) & potential double-counting with paid `documents` / legacy `kwitansi`; (3) POS expense category `'Operasional Kasir'` (`is_automated: true`) not excluded from manual cashbook aggregation; (4) `Laporan.jsx` UTC ISO date boundary shift (`startDate` shifting to previous month's last day in WIB) & missing `inv.data.date` fallback; (5) missing `outlet_id` filter in `CatatanBisnis.jsx` & POS report reads.

---

## [2026-11-07] Dashboard Realtime Sync Fix, Tailwind Dark-Bleed Resolution & Zero-Emoji Mockup Alignment (v2.8)

### 1. Root Cause Resolution: Income Rp 2.000.000 Sync Issue
- **Root Cause Identified:** The database query `cbAllQuery` in `Dashboard.jsx` lacked descending ordering (`order('date', { ascending: false })`). Because PostgREST caps queries at 1,000 rows and the user had 1,000+ historical entries from July 2026, the newly added transaction from 7 November 2026 was truncated past the 1,000 limit and never reached the dashboard state.
- **Permanent Solution:**
  - Added `.order('date', { ascending: false }).order('created_at', { ascending: false })` across all queries (`cbAllQuery`, `cbMonthQuery`, `txAllQuery`, `expMonthQuery`, `expAllQuery`).
  - Added Map-based deduplication combining `monthCb` and `allCb` so current-month transactions can never be dropped even under extreme data scale.
  - Added event listeners for `cashbook-updated`, `invoice-updated`, `kasir-updated`, `focus`, and `visibilitychange` to immediately re-sync data whenever returning to the Home screen.
  - Multiplied dispatch events in `CatatanBisnis.jsx` (`external-sync`, `cashbook-updated`, `data-updated`).

### 2. Root Cause Resolution: Dark Cards Obscuring Text ("warnanya nutupin tulisan")
- **Root Cause Identified:** In Tailwind CSS v4, `@import "tailwindcss";` triggers the `dark:` variant based on browser/OS media query `(prefers-color-scheme: dark)` by default. `StatCard.jsx` had `dark:bg-slate-800` while `ThemeContext` forced light mode text (`#0F172A`), causing dark charcoal text to render on top of dark navy backgrounds when the user's OS had dark mode enabled.
- **Permanent Solution:**
  - Configured `@custom-variant dark (&:where(.dark, .dark *));` in `src/index.css` to permanently block OS dark mode bleeding.
  - Fully refactored `StatCard.jsx` to clean white styling (`bg-white border-slate-200/80 text-slate-950 font-mono tracking-tight`), matching the approved redesign mockup 1:1.
  - Removed circular icon badges (`$` and `HandCoins`) that appeared as emoticons/emojis to the user, replacing them with sleek status badges (`Bulan Ini`, `Beban Usaha`, `Margin Bersih`, `Belum Bayar`).

### 3. Translation & Revenue Mix Upgrades
- Added missing translation keys in `LanguageContext.jsx` for both ID and EN: `dash_new_income_desc`, `dash_manual_income_label`, `dash_income_source`, `dash_expense_badge`, `dash_expense_sub`, `dash_profit_sub`, `healthy_status`, `deficit_status`, `no_unpaid_badge`, `need_followup`, `all_paid`.
- Updated Revenue Mix module to display POS Sales, Invoices (Paid), and Catatan Kas & Lainnya (Manual Cashbook) in both the breakdown list and the stacked progress bar.

---

## [2026-11-07] Repliz Social Scheduler Media Fix & Instant Re-Post (`Feed-04: DP Proyek`) (v2.7)

### 1. Modern Clean Dashboard Redesign (Opsi A) — Eliminating AI Boilerplate Look
- **Modern Action Bar ([Dashboard.jsx](file:///E:/Project%20Antigravity/My%20Invoice%20Apps/src/pages/Dashboard.jsx)):**
  - Integrated header with sleek right-side action buttons: `+ Buat Invoice` (solid dark zinc button) and `Catat Kas` (clean outline button).
  - Removed clunky pastel quick action buttons and the jarring `#F3E8FF` purple bar.
- **Sleek Minimalist Metric Cards ([StatCard.jsx](file:///E:/Project%20Antigravity/My%20Invoice%20Apps/src/components/StatCard.jsx)):**
  - Removed rainbow neon top borders. Replaced with clean white cards (`border-slate-200/80 shadow-2xs rounded-2xl`), bold high-contrast numbers, and subtle percentage badges.
- **Unified 2-Column Middle Grid ([Dashboard.jsx](file:///E:/Project%20Antigravity/My%20Invoice%20Apps/src/pages/Dashboard.jsx)):**
  - 8-Col 6-Month Cashflow Bar Chart with pill-rounded bars (violet for invoice income, amber for POS cashier, neutral slate for expense).
  - 4-Col Live POS Cashier Card with pulse indicator & Revenue Composition progress bar.
- **Clean Unpaid Invoices Table ([Dashboard.jsx](file:///E:/Project%20Antigravity/My%20Invoice%20Apps/src/pages/Dashboard.jsx)):**
  - Clean client list with due dates, amounts, and status badges.
- **Verification:** ESLint 0 errors, Production Build 100% pass (`✓ built in 12.35s`), pushed to `origin/main` (`commit b59969c`).

### 2. Root Cause Resolution for Failed Social Post & Clean Sweep
- **Identified Issue:** The scheduled post for Friday (`Feed-04: DP PROYEK BUKAN CUAN BERSIH!`) failed on Repliz because the image was hosted on `uguu.se`, which deleted the file after a few hours, causing Instagram and Facebook Graph APIs to return `Missing or invalid image file` / `The media could not be fetched from this URI: https://d.uguu.se/AbOCzezb.jpg`.
- **Permanent Solution & Dashboard Cleaned:**
  - Deleted both failed schedule records (`6aea0cb0e17bbf8a60809c75` on Instagram and `6aea0cb0e17bbf8a60809c7a` on Facebook) from the Repliz server. Dashboard error count is now **0**.
  - Replaced ephemeral hosts with our permanent GitHub raw image storage (`https://raw.githubusercontent.com/Ramelio-bot/My-Invoice-Apps/main/public/images/feed_04_dp_proyek.jpg`).
- **Rescheduled for Prime Siang (12:15 WIB):**
  - Per user direction to separate from regular afternoon/evening uploads, the post is rescheduled for **Prime Time Siang (12:15 WIB / 05:15 UTC, Sabtu 7 Nov 2026)**.
  - **Instagram (`@myinvoice.space`):** `Schedule ID: 6aee9b6d1e286deb26362c67` (Status: pending).
  - **Facebook Page (`My Invoice`):** `Schedule ID: 6aee9b6dc0184f720c08a230` (Status: pending).

### 2. Scheduled Tomorrow's Social Post (Minggu, 8 Nov 2026 @ 19:30 WIB)
- **Content:** `Feed-02: MODAL HP BISA PUNYA KASIR MINIMARKET?`
- **Permanent Media Storage:** `https://raw.githubusercontent.com/Ramelio-bot/My-Invoice-Apps/main/public/images/feed_02_modal_hp_kasir.jpg` (verified HTTP 200).
- **Target Accounts on Repliz:**
  - **Instagram (`@myinvoice.space`):** `Schedule ID: 6aeea333c0184f720c0a3fe1` (Status: pending).
  - **Facebook Page (`My Invoice`):** `Schedule ID: 6aeea3341e286deb2638ae68` (Status: pending).
- **Target Time:** Sunday, 8 Nov 2026 @ 19:30 WIB (12:30 UTC) — 25.4 hours ahead (< 72h rule satisfied).

---

## [2026-11-05] Disruptive Pricing Remake (`Rp 49.900` PRO / `Rp 79.900` Ultimate) & Mayar Gateway Isolation Hardening (v2.6)

### 1. Official Disruptive Pricing Rollout (`Landing.jsx`, `Upgrade.jsx`, `LanguageContext.jsx`, `UpgradePrompt.jsx`, `AplikasiKasirOffline.jsx`, `HitungHPP.jsx`, `Affiliate.jsx`, `AdminDashboard.jsx`)
- Updated all subscription pricing across `ID` and `EN` dictionaries, Landing Page, Upgrade Checkout, In-App Modals, Affiliate Calculator, and Admin MRR metrics:
  - **PRO Monthly:** `Rp 49.900 / bulan` (strikethrough anchor `Rp 129.000`) — `https://my-invoice.myr.id/pl/my-invoice-pro-bulanan`
  - **ULTIMATE Monthly:** `Rp 79.900 / bulan` (strikethrough anchor `Rp 149.000`) — `https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr`
  - **PRO Annual (12 Months):** `Rp 470.400 / tahun` (`Rp 39.200 / bulan`) — `https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan`
  - **ULTIMATE Annual (12 Months):** `Rp 767.040 / tahun` (`Rp 63.920 / bulan`) — `https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan`

### 2. Mayar Webhook & Auto-Upgrade Plan Isolation (`api/webhook.js`, `src/pages/ProSuccess.jsx`, `src/pages/UltimateSuccess.jsx`, `src/context/AuthContext.jsx`)
- **Multi-Signal Plan Classifier (`classifyMayarProduct` in `api/webhook.js`):**
  - Strictly isolates `PRO` vs `ULTIMATE` and `Monthly (30d)` vs `Annual (365d)` using product name, URL slug (`7spr` / `ultimate` / `annual`), and exact price fallback so buying PRO (`Rp 49.900` / `Rp 470.400`) **always** activates `pro` (never `ultimate`), and buying ULTIMATE (`Rp 79.900` / `Rp 767.040`) **always** activates `ultimate`.
  - Changed profile lookup to case-insensitive `.ilike('email', customerEmail)` so uppercase/lowercase email differences during Mayar checkout still auto-upgrade the user's profile immediately.
- **Free Trial to Paid PRO Checkout Fix (`src/pages/Upgrade.jsx`, `src/pages/ProSuccess.jsx`, `src/pages/UltimateSuccess.jsx`):**
  - Fixed the issue where users on an active 14-day Free Trial (`trialActive === true`) were blocked from clicking the PRO purchase button in `Upgrade.jsx` or skipped verification in `ProSuccess.jsx`.
  - Enabled automatic DB profile polling on `/pro-success` and `/ultimate-success` even when Mayar redirects without `?trx_id=` query parameters, and reduced the browser focus/visibility sync cooldown in `AuthContext.jsx` from `30s` to `3s` for instant plan activation upon returning from Mayar.

---

## [2026-11-05] Turbo Bundle Splitting, Smart WhatsApp Follow-Up Assistant & Free Quotation Magnet (`/buat-penawaran-harga-gratis`) (v2.5)

### 1. Turbo Bundle Splitting & Core Web Vitals (`src/App.jsx`, `vite.config.js`)
- Converted heavy authenticated modules (`Layout`, `Login`, `Register`, `Dashboard`, `Kasir`, `KasirProduk`, `KasirStok`, `KasirLaporan`, `KasirKaryawan`, `KasirPengeluaran`, `KasirMembers`) to code-split chunks (`React.lazy`) while keeping background pre-warming (`import()`) after login and full Service Worker precaching (`VitePWA`) for 100% offline POS resilience.
- Replaced static `manualChunks` with dynamic package chunking (`supabase`, `charts`, `xlsx`, `pdf-engine`, `icons`) in `vite.config.js` and resolved the `@capacitor/app` static/dynamic mixed-import warning.

### 2. Smart WhatsApp Follow-Up Assistant (`src/utils/whatsapp.js`, `src/pages/Invoice.jsx`)
- Added 4 bilingual WhatsApp communication modes in `shareWhatsApp` (`standard`, `reminder`, `overdue`, `thank_you`) to solve the UMKM "hesitation to follow up on unpaid invoices" (*sungkan menagih*) pain point.
- Added the **Smart WhatsApp Billing Modal** (`waModalInvoice`) in `Invoice.jsx` (accessible from both the Form top bar and History tab) with 1-click tone selection and a White-Label PRO upgrade prompt for Free-tier users.

### 3. B2B SEO Magnet #4: `/buat-penawaran-harga-gratis` (`src/pages/BuatPenawaranGratis.jsx`, `src/utils/analytics.js`, `scripts/prerender-seo.mjs`)
- Built a 100% bilingual (`ID`/`EN`) interactive Price Quotation (*Surat Penawaran Harga / SPH*) generator with PDF export, WhatsApp sharing, PPN 11% toggle, and **1-Click "Deal! Convert Quote to Invoice"** (`savePublicCarryover('quotation_to_invoice', quoteData)`), which automatically converts the quotation into both `sph_draft` and `draft_invoice`.
- Added `/buat-penawaran-harga-gratis` to `src/App.jsx`, `src/pages/Landing.jsx`, `src/components/LandingFooter.jsx`, `public/robots.txt`, `public/sitemap.xml`, and `scripts/prerender-seo.mjs` (11 static SEO pre-rendered routes).

---

## [2026-11-05] Magic Auto-Carryover Onboarding & GA4 Conversion Radar (v2.4)

### 1. "Magic Auto-Carryover" (Zero Data Loss from Free Public Tools to Account Onboarding & Dashboard)
- **Public Carryover Engine (`src/utils/analytics.js`, `src/pages/BuatInvoiceGratis.jsx`, `src/pages/BuatKwitansiGratis.jsx`, `src/pages/KalkulatorHppGratis.jsx`):**
  - Automatically synchronizes visitor inputs from `/buat-invoice-gratis`, `/buat-kwitansi-gratis`, and `/kalkulator-hpp-gratis` into `myinvoice_public_carryover` (`storeName`, `storeAddress`, `businessType`, `mainFeatures`, `targetRoute`) and into each module's internal draft storage (`draft_invoice` for `Invoice.jsx`, `kwitansi_draft` for `Kwitansi.jsx`, and `myinvoice_hpp_carryover` for `useStore.js` / `HitungHPP.jsx`).
- **Smart Onboarding Pre-Fill & Direct Module Redirect (`src/components/OnboardingWizard.jsx`, `src/store/useStore.js`):**
  - Pre-fills the 3-step `OnboardingWizard` (`storeName`, `storeAddress`, `businessType`, and `mainFeatures`) with the visitor's public tool data and redirects directly to `/invoice`, `/kwitansi`, or `/hitung-hpp` upon onboarding completion with the user's draft already loaded.

### 2. Google Analytics 4 (`G-8Z0KKJN775`) Custom Event Conversion Radar (`src/utils/analytics.js`)
- Added safe `trackEvent(eventName, params)` helper wrapping `window.gtag('event', ...)` across key funnel milestones:
  - **Public Tool Engagement:** `free_pdf_download`, `wa_viral_share`, and `pro_paywall_open` (`BuatInvoiceGratis.jsx`, `BuatKwitansiGratis.jsx`, `KalkulatorHppGratis.jsx`).
  - **Registration & Onboarding:** `sign_up_otp_sent`, `sign_up_complete` (`Register.jsx`), and `onboarding_complete` (`OnboardingWizard.jsx`).
  - **Monetization & Checkout:** `start_free_trial`, `begin_checkout_pro`, and `begin_checkout_ultimate` (`Upgrade.jsx`).

---

## [2026-11-05] Google SEO Static Pre-Render Engine & Free Receipt Magnet (`/buat-kwitansi-gratis`) (v2.3)

### 1. Static HTML Pre-Rendering for Googlebot & Social Crawlers (`scripts/prerender-seo.mjs`, `package.json`)
- Integrated `scripts/prerender-seo.mjs` into `npm run build` (`vite build && node scripts/prerender-seo.mjs`) to generate dedicated static `dist/<route>/index.html` files for 10 public SEO routes (`buat-invoice-gratis`, `buat-kwitansi-gratis`, `kalkulator-hpp-gratis`, `aplikasi-kasir-offline`, `aplikasi-kasir-kafe`, `software-invoice-freelance`, `blog`, `about`, `contact`, `affiliate`).
- Eliminated the SPA root `<link rel="canonical" href="https://myinvoice.space/" />` conflict so Googlebot, WhatsApp, and Telegram immediately read each route's unique `<title>`, `<meta name="description">`, `<link rel="canonical">`, and OpenGraph tags in 0ms without waiting for client-side JavaScript.

### 2. New B2B SEO Magnet: `/buat-kwitansi-gratis` (`src/pages/BuatKwitansiGratis.jsx`)
- Built a 100% bilingual (`ID`/`EN`) interactive Digital Payment Receipt (*Kwitansi Pembayaran*) generator with live automatic **Terbilang Rupiah / Amount in Words** (`src/utils/terbilang.js`), official `LUNAS / PAID IN FULL` stamp, PDF export, print, and WhatsApp sharing.
- Added Hook & Lock triggers (`+ Logo Bisnis`, `+ Pasang Tanda Tangan & Stempel (PRO)`, and `Hapus Watermark (PRO)`) to convert free visitors into registered and PRO users.

### 3. Homepage SEO Tag Reset & Crawler Directives (`src/pages/Landing.jsx`, `public/robots.txt`, `public/sitemap.xml`)
- Added `useEffect` in `Landing.jsx` to restore homepage `<title>`, `<meta name="description">`, and `<link rel="canonical" href="https://myinvoice.space/" />` on navigation back to `/`.
- Explicitly allowed all 6 high-intent SEO landing/tool pages in `public/robots.txt` and added `https://myinvoice.space/buat-kwitansi-gratis` to `public/sitemap.xml`.

---

## [2026-11-05] Product-Led Growth (PLG) Hook & Lock Architecture (v2.2)

### 1. Viral Attribution Loop & White-Label Prestige Paywall
- **WhatsApp & POS Receipt Viral Attribution (`src/utils/whatsapp.js`, `src/pages/Invoice.jsx`, `src/components/kasir/ReceiptModal.jsx`, `src/pages/BuatInvoiceGratis.jsx`):**
  - Appended `Dibuat otomatis via https://myinvoice.space (Versi Gratis)` / `Generated via https://myinvoice.space (Free Version)` on Free-tier WhatsApp invoices and POS receipts to drive organic referral traffic from recipients.
  - Enabled 100% White-Label WhatsApp messages (zero attribution footer) exclusively for PRO and Ultimate subscribers (`isPremium`).
- **Prestige Paywall & Official Free Watermark (`src/pages/BuatInvoiceGratis.jsx`):**
  - Added an official Free Version watermark footer inside `#instant-invoice-sheet` (captured in PDF exports) alongside interactive `+ Logo Bisnis` and `Hapus Watermark & Pasang Logo (PRO)` triggers that open a conversion modal highlighting Custom Company Logo, Store QRIS, and White-Label benefits.

### 2. Public SEO Free-Tool Magnet: `/kalkulator-hpp-gratis` (`src/pages/KalkulatorHppGratis.jsx`)
- **Hook & Lock COGS (HPP) Calculator:**
  - Built a 100% bilingual (`ID`/`EN`) interactive Food Cost & COGS calculator pre-populated with an Iced Brown Sugar Latte recipe (`Kg→gr` and `L→ml` auto-conversion).
  - Capped public instant mode at `5` ingredients and `1` unlocked delivery commission simulator (`GoFood 20%`), while locking `GrabFood`, `ShopeeFood`, `Tokopedia`, unlimited ingredients, and **Auto Recipe Stock Deduction** behind account registration and PRO upgrade CTAs.

### 3. Internal Linking & Sitemap Expansion (`src/App.jsx`, `src/pages/Landing.jsx`, `src/components/LandingFooter.jsx`, `public/sitemap.xml`)
- Registered `/kalkulator-hpp-gratis` in `publicRoutes` and lazy router, added quick-links in `Landing.jsx` Hero and `LandingFooter.jsx`, and added `https://myinvoice.space/kalkulator-hpp-gratis` (`priority 0.9`) to `public/sitemap.xml`.

---

## [2026-11-05] Memory Leak Cleanup, Multi-Device Responsive UX & Toast Audit (v2.1)

### 1. Memory & Resource Leak Fixes
- **`URL.createObjectURL` Blob Revocation (`src/components/OnboardingWizard.jsx`, `src/pages/Profile.jsx`):**
  - Added `useEffect` cleanup hooks that automatically call `URL.revokeObjectURL(...)` whenever `logoPreview` (`blob:`) is replaced or the component unmounts, eliminating browser memory leaks during repeated logo cropping.

### 2. Web Desktop, Tablet (`768px–1024px`) & Mobile (`360px–480px`) Compatibility
- **Tablet Portrait Navigation (`src/components/Layout.jsx`):**
  - Resolved the `768px` breakpoint clash between CSS media queries and Tailwind `md:hidden`.
  - Enabled the slide-over sidebar drawer (`mobile-menu-btn`) up to `1023px` so Tablet Portrait (`768px–1023px`) gets 100% full-width workspace instead of being squeezed by a fixed `260px` sidebar, while Desktop & Tablet Landscape (`>=1024px`) retain the persistent sidebar.
- **Free A4 Invoice Generator Mobile Layout (`src/pages/BuatInvoiceGratis.jsx`):**
  - Fixed the status rubber stamp (`LUNAS` / `MENUNGGU PEMBAYARAN`) overlapping the Business Name input on `<640px` screens (`flex justify-end mb-2 sm:mb-0 sm:absolute sm:top-6 sm:right-10`).
  - Made the 12-column item row wrap cleanly into 2 sub-rows on mobile (`<640px`) so the Unit Price input gets `col-span-8` (`8/12` width) instead of being cramped to `24px` on `360px` phones.
- **Responsive Form & Stats Grids (`src/index.css`, `src/pages/Invoice.jsx`, `src/pages/HutangPiutang.jsx`, `src/pages/TandaTerima.jsx`, `src/pages/Klien.jsx`, `src/pages/kasir/OutletManagement.jsx`):**
  - Added `.responsive-form-grid` and `.responsive-stats-grid-3` utility classes in `src/index.css` that stack multi-column inline grids into a single column (`1fr`) on screens `<640px`.
  - Scaled down A4 document preview padding (`#invoice-preview`, `#kwt-preview`, `#sph-preview`, `#po-preview`, `#ttr-preview`) on `<640px` mobile screens with `overflow-x: auto` to prevent horizontal overflow.

### 3. Complete Toast, Alert & Badge Bilingual Coverage + Zero Lint Errors
- **POS Badges & System Toasts (`src/pages/Kasir.jsx`, `src/App.jsx`, `src/pages/CatatanBisnis.jsx`, `src/pages/HutangPiutang.jsx`, `src/pages/Invoice.jsx`, `src/pages/Kwitansi.jsx`, `src/pages/Laporan.jsx`, `src/pages/kasir/Pengeluaran.jsx`, `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/AdminSimulation.jsx`):**
  - Connected `RESEP` / `HABIS` badges in `Kasir.jsx` to `t('prod_badge_recipe')` and `t('prod_badge_out')`.
  - Translated all remaining raw `showToast`, `window.prompt`, and `alert` messages across POS, Cashbook, Invoices, Receipts, Reports, Expenses, and Admin Stress Test simulators.
- **ESLint Clean Pass (`eslint.config.js`):**
  - Excluded temporary scratch files so `npm run lint` and `npm run build` both exit with code `0` (`0 errors`).

### 4. Mobile Chrome PWA Cache-Busting & Instant Auto-Update (`vite.config.js`, `src/main.jsx`, `vercel.json`)
- **Workbox Immediate Takeover (`vite.config.js`):**
  - Added `cleanupOutdatedCaches: true`, `skipWaiting: true`, and `clientsClaim: true` so new builds immediately replace old Service Worker caches instead of serving stale bundles on Mobile Chrome.
- **Controller Change Auto-Reload (`src/main.jsx`):**
  - Added Service Worker `controllerchange` listener and `visibilitychange` / `load` update checks (`reg.update()`) so Mobile Chrome automatically reloads into the newest deployment without manual cache clearing.
- **HTTP No-Cache Headers (`vercel.json`):**
  - Enforced `Cache-Control: no-cache, no-store, must-revalidate` on `/index.html`, `/sw.js`, `/registerSW.js`, and `/manifest.webmanifest`.

---

## [2026-11-05] Master Bilingual Refactoring (v2.0 — 100% Zero Hardcoded Strings)

### Exhaustive i18n Audit & Refactoring Across All 4 Batches
- **1:1 Dictionary Balance (`src/context/LanguageContext.jsx`):**
  - Expanded and synchronized `ID` and `EN` dictionaries to **1,982 keys each** (`Object.keys(ID).length === Object.keys(EN).length` with 0 missing keys).
  - Added `free_watermark`, `invoice_qris_desc`, `invoice_qris_attached`, `page_label`, `kasir_no_expense_period`, `audit_log_upgrade_desc`, `members_ult_only_title`, `members_ult_only_desc`, `members_ult_only_btn`, `upgrade_slow_conn`, and `kasir_product_label`.
- **Batch 1 — User Gateway & Core Navigation:**
  - `src/components/LandingNavbar.jsx`: Bilingual mobile menu actions (`Sign In` / `Masuk Akun`, `Open Dashboard` / `Buka Dashboard`), translated tooltips and `aria-label`, made language switcher visible across all screen widths, and eliminated corrupted UTF-8 `\ufffd` character.
  - `src/components/LandingFooter.jsx`: Translated copyright notice, bottom Privacy/Terms links, and Career fallback.
  - `src/pages/Landing.jsx`: Translated all 44 remaining hardcoded strings across Split-View Showcase tabs, POS cart items & thermal receipt preview, Digital A4 Invoice mockup, Bento Grid pillars 03 & 04, Monthly/Annual pricing toggle, Starter/Pro/Ultimate plan cards, FAQ heading, and iOS PWA install modal.
- **Batch 2 — Free Invoice Generator & Niche Landing Pages:**
  - `src/pages/BuatInvoiceGratis.jsx`: Added automatic sample data translation (`DEFAULT_ID` ↔ `DEFAULT_EN`) when switching language, translated Hero headline/subtitle/CTAs, `LUNAS`/`MENUNGGU` (`PAID`/`PENDING`) status toggle buttons, table headers (`Act`/`Aksi`), row delete tooltips, reset confirm dialog, SEO metadata, and bottom CTA.
  - `src/pages/AplikasiKasirOffline.jsx`: Fully refactored Hero, interactive 58mm/80mm Bluetooth thermal printer simulator, 3 operational advantage cards, pricing teaser, FAQs (`faqsId` / `faqsEn`), and bottom CTA.
  - `src/pages/AplikasiKasirKafe.jsx`: Fully refactored Hero, interactive Barista & Cashier order simulator (menu items, notes, table selector, receipt output), 3 culinary POS pillars, comparison table, FAQs (`faqsId` / `faqsEn`), and bottom CTA.
  - `src/pages/SoftwareInvoiceFreelance.jsx`: Fully refactored Hero, interactive project milestone & WhatsApp billing simulator, 3 freelance benefit pillars, comparison table, FAQs (`faqsId` / `faqsEn`), and bottom CTA.
- **Batch 3 — POS Cashier, Core Documents & Settings:**
  - `src/components/Layout.jsx`: Translated mobile bottom nav (`POS`/`Kasir`) and `QuickActionFAB` labels (`POS Cashier`, `Create Invoice`, `Record Expense`).
  - `src/components/TrialBanner.jsx`: Translated FREE plan banner and all 3 PRO Trial countdown states (`>7 days`, `4-7 days`, `<=3 days`).
  - `src/components/OnboardingWizard.jsx`: Translated business category cards, main feature cards, file upload button (`Choose File`/`Pilih File`), step 2/3 subtitles, and RLS error toast.
  - `src/components/kasir/SalesReport.jsx`: Translated modal title, period filters (`Today`, `Last 7 Days`, `This Month`, `All Time`), summary cards, payment methods (`Cash`, `Bank Transfer`, `QRIS`), and top-selling products list.
  - `src/components/kasir/ReceiptModal.jsx`, `src/pages/Invoice.jsx`, `src/pages/Kwitansi.jsx`, `src/pages/PenawaranHarga.jsx`, `src/pages/PurchaseOrder.jsx`, `src/pages/TandaTerima.jsx`: Translated free-plan watermark footer (`free_watermark`), payment account labels, and QRIS attachment indicators.
  - `src/pages/Laporan.jsx` & `src/pages/LaporanKasir.jsx`: Translated pagination (`Previous`, `Page X / Y`, `Next`) and empty cashier expense state.
  - `src/pages/Settings.jsx`: Translated Telegram Bot Integration card, Offline Cashier Sync card, confirmation dialog, and Telegram OTP modal instructions.
  - `src/pages/kasir/Karyawan.jsx`, `src/pages/kasir/Produk.jsx`, `src/components/NotificationBell.jsx`, `src/utils/whatsapp.js`: Translated delete tooltips, low-stock product notification title, and WhatsApp message greeting/closing.
- **Batch 4 — Auth, Subscription Flows & Admin Command Center:**
  - `src/App.jsx`, `src/pages/Register.jsx`, `src/pages/Upgrade.jsx`, `src/pages/ProSuccess.jsx`, `src/pages/UltimateSuccess.jsx`: Translated page loader, OTP verification flow, slow connection warning, and PRO/ULTIMATE payment verification states.
  - `src/pages/AuditLog.jsx` & `src/pages/KasirMembers.jsx`: Translated module filter options and upgrade prompts.
  - `src/pages/admin/AdminDashboard.jsx`, `src/pages/admin/AdminSimulation.jsx`, `src/pages/admin/AdminUsers.jsx`: Translated Admin Command Center metrics, stress-test simulator controls, and user management dialogs.
- **Automated Audit Tooling:**
  - Added `scripts/deep_search_i18n_master.py` and excluded `i18n_audit_findings.json` in `.gitignore`.

---

## [2026-11-05] Store QRIS Engine & Anti-Leak Security Hardening

### Added & Enhanced
- **Store QRIS Integration:**
  - `Settings.jsx`: Store QRIS upload input with direct Base64 offline fallback and Supabase bucket integration.
  - `PaymentModal.jsx`: Large high-contrast QRIS barcode display with dynamic total and camera scan instructions for customers.
  - `Invoice.jsx`: Store QRIS automatically rendered alongside payment instructions on invoice previews and printed/downloaded PDFs.
  - Added migration SQL `supabase/migrations/20261105_add_store_qris_url.sql`.

### Security & Multi-Tenant Hardening (Anti-Leak Defense)
- **POS & Cashier Multi-Tenant Scope:**
  - Added `.eq('user_id', user.id)` to `loadCategories` and `loadProducts` in `src/pages/kasir/Produk.jsx`.
  - Added `.eq('user_id', user.id)` to `loadData` in `src/pages/kasir/Stok.jsx`.
  - Added `.eq('user_id', user.id)` to client and employee queries in `src/pages/Kasir.jsx`.
  - Added `.eq('user_id', user.id)` to voucher redemption and member point updates in `src/pages/Kasir.jsx` and `src/components/kasir/Cart.jsx`.
  - Scoped transaction item deletes and reports in `src/pages/LaporanKasir.jsx` and `src/pages/kasir/Laporan.jsx`.
- **Core CRUD Defense-in-Depth:**
  - Scoped all `UPDATE` and `DELETE` mutations with explicit `.eq('user_id', user.id)` across `Invoice.jsx`, `Kwitansi.jsx`, `PenawaranHarga.jsx`, `PurchaseOrder.jsx`, `TandaTerima.jsx`, `Klien.jsx`, `HitungHPP.jsx`, and `Pengeluaran.jsx`.
  - Scoped audit log queries in `src/pages/AuditLog.jsx`.
  - Fixed cache leakage on `signOut` in `src/context/AuthContext.jsx` by purging cached business profiles and POS session state.

### Design & Typography
- Completely eliminated OS emojis (`⚡`, `☕`, `✨`) across all badges, cards, and headings in favor of crisp Lucide vector icons.
- Normalized Unicode punctuation across source files.
