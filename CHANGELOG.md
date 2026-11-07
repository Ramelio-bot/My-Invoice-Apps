# Changelog — My Invoice Apps

All notable changes, security fixes, optimizations, and feature rollouts are documented here.

---

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
