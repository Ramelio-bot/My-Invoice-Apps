# Changelog — My Invoice Apps

All notable changes, security fixes, optimizations, and feature rollouts are documented here.

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
