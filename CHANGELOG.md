# Changelog — My Invoice Apps

All notable changes, security fixes, optimizations, and feature rollouts are documented here.

---

## [2026-11-05] Total Bilingual Sync, Store QRIS Engine & Anti-Leak Security Hardening

### Added & Enhanced
- **Homepage Full Bilingual Dynamic Translation (`Landing.jsx`, `LandingNavbar.jsx`, `LandingFooter.jsx`):**
  - Resolved root cause where the main homepage hero, interactive showcase, bento grid, pricing cards, and CTA were hardcoded in Indonesian.
  - Connected all 59+ homepage text nodes to `isEn`, enabling instant live language toggle between Indonesian and English across all desktop and mobile views.
- **Total Bilingual Dictionary Parity (`LanguageContext.jsx`):**
  - Synchronized `ID` and `EN` dictionaries to exactly 1,971 keys each (0 missing keys across both locales).
  - Translated 89+ previously missing English keys across modal limits, upgrades, signatures, reports, careers, and notifications.
  - Added full translation support for Store QRIS (`settings_store_qris`, `kasir_qris_scan_title`, etc.) and the Instant Invoice Generator (`gen_*`).
- **Bilingual Niche Landing Pages:**
  - `BuatInvoiceGratis.jsx`: Full bilingual conversion via `useLang()`. Hero, interactive direct-edit A4 canvas sheet, action buttons, bento document showcase, comparison table, and WhatsApp message generators dynamically switch between Indonesian and English.
  - `SoftwareInvoiceFreelance.jsx`: Bilingual hero headers, value propositions, and checklist badges.
  - `AplikasiKasirKafe.jsx`: Bilingual cafe POS headlines, takeaway cues, and printer specs.
  - `AplikasiKasirOffline.jsx`: Bilingual offline PWA badges and resilience statements.
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
