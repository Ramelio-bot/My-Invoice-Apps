# 🕵️‍♂️ LAPORAN AUDIT BACKEND SCHEMA & ATURAN KEAMANAN (RLS)
**Proyek:** MyInvoice.space  
**Tanggal Audit:** 1 Juli 2026  
**Auditor:** Principal Cloud Database Administrator & Supabase Security Auditor  

Laporan ini menyediakan kompilasi utuh seluruh kebijakan Row Level Security (RLS), kode fungsi SQL (RPC), dan alur integrasi database sinkronisasi offline-to-online pada aplikasi MyInvoice.space untuk kebutuhan audit bersama Hermes AI.

---

## 1. KEBIJAKAN ROW LEVEL SECURITY (RLS) & STORAGE POLICIES

### A. Supabase Storage Policies
Ditemukan pada file: [storage_policies.sql](file:///c:/My%20Invoice%20Apps/src/lib/storage_policies.sql)

Aturan pembatasan akses bucket `product-images` dan `company-logos` di Supabase Storage:
```sql
-- Supabase Storage RLS Policies for My Invoice
-- Run this in the Supabase SQL Editor to enable image uploads

-- 1. BUCKET: product-images
-- Allow public to view images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'product-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated User Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own images
CREATE POLICY "Authenticated User Update" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated User Delete" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'product-images' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);


-- 2. BUCKET: company-logos
-- Allow public to view logos
CREATE POLICY "Public Access Logos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'company-logos');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Authenticated User Upload Logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own logos
CREATE POLICY "Authenticated User Update Logos" ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated User Delete Logos" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'company-logos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
```

### B. Database Row Level Security (RLS)
Ditemukan pada file: [base_schema_staging.sql](file:///c:/My%20Invoice%20Apps/base_schema_staging.sql) (baris 325–377) dan diperkeras di [hardening_rls.sql](file:///c:/My%20Invoice%20Apps/hardening_rls.sql).

Berikut adalah daftar aturan `SELECT`, `INSERT`, `UPDATE`, dan `DELETE` yang dikunci pada tabel-tabel krusial:

#### 1. Tabel `profiles`
* **RLS status:** Enabled
* **Aturan kebijakan:**
  ```sql
  DROP POLICY IF EXISTS "Users access own profile" ON public.profiles;
  CREATE POLICY "Users access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
  ```
  *(Analisis Kerentanan: Penggunaan klausa `FOR ALL` mengizinkan pengguna yang login untuk melakukan `UPDATE` pada kolom plan miliknya sendiri secara bebas di sisi klien).*

#### 2. Tabel `outlets`
* **RLS status:** Enabled
* **Aturan kebijakan:**
  ```sql
  -- Dideklarasikan di skema dasar
  CREATE POLICY "Users access own outlets" ON public.outlets FOR ALL USING (auth.uid() = user_id);
  ```

#### 3. Tabel `cashbook`
* **RLS status:** Enabled
* **Aturan kebijakan:**
  ```sql
  -- Versi diperkeras (Hardened) di hardening_rls.sql
  DROP POLICY IF EXISTS "Users access own cashbook" ON public.cashbook;
  CREATE POLICY "Users access own outlet cashbook" ON public.cashbook 
  FOR ALL USING (
      auth.uid() = user_id 
      AND (outlet_id IS NULL OR outlet_id = (auth.jwt()->>'assigned_outlet')::uuid)
  );
  ```

#### 4. Tabel `kasir_transactions`
* **RLS status:** Enabled
* **Aturan kebijakan:**
  ```sql
  -- Versi diperkeras (Hardened) di hardening_rls.sql
  DROP POLICY IF EXISTS "Users access own transactions" ON public.kasir_transactions;
  CREATE POLICY "Users access own outlet transactions" ON public.kasir_transactions 
  FOR ALL USING (
      auth.uid() = user_id 
      AND (outlet_id = (auth.jwt()->>'assigned_outlet')::uuid)
  );
  ```

#### 5. Tabel `kasir_products`
* **RLS status:** Enabled
* **Aturan kebijakan:**
  ```sql
  DROP POLICY IF EXISTS "Users access own products" ON public.kasir_products;
  CREATE POLICY "Users access own products" ON public.kasir_products FOR ALL USING (auth.uid() = user_id);
  ```

---

## 2. SKRIP FUNGSI SQL `process_sale` SECURA UTUH

Ditemukan pada file: [base_schema_staging.sql](file:///c:/My%20Invoice%20Apps/base_schema_staging.sql) (baris 254–306)

```sql
-- Process Sale Function for Offline Queue Sync
CREATE OR REPLACE FUNCTION public.process_sale(
  p_outlet_id UUID,
  p_user_id UUID,
  p_items JSONB,
  p_total INTEGER,
  p_subtotal INTEGER,
  p_payment_method TEXT
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_transaction_id UUID;
  v_receipt_number TEXT;
BEGIN
  -- Validasi Tenant
  IF p_user_id <> auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized: User ID mismatch';
  END IF;

  -- 1. Buat Nomor Nota (Format: SUTRA-YYYYMMDD-RANDOM)
  v_receipt_number := 'SUTRA-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substring(gen_random_uuid()::text from 1 for 6));

  -- 2. Catat Transaksi ke Tabel Penjualan
  INSERT INTO public.kasir_transactions (
    outlet_id, user_id, items, total, subtotal, payment_method, receipt_number, created_at
  ) VALUES (
    p_outlet_id, p_user_id, p_items, p_total, p_subtotal, p_payment_method, v_receipt_number, now()
  )
  RETURNING id INTO v_transaction_id;

  -- 3. Update Stok Produk secara Otomatis
  UPDATE public.kasir_products p
  SET stock = p.stock - (item.value->>'qty')::int,
      updated_at = NOW()
  FROM jsonb_array_elements(p_items) AS item
  WHERE p.id = (item.value->>'product_id')::uuid AND p.user_id = auth.uid();

  -- 4. Kirim Balik Data Lengkap
  RETURN jsonb_build_object(
    'status', 'success',
    'transaction_id', v_transaction_id,
    'receipt_number', v_receipt_number,
    'total', p_total,
    'payment_method', p_payment_method
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$$;
```

### 🔬 Hasil Temuan Audit Keamanan pada `process_sale`:
* **VULNERABILITY:** Fungsi ini **Menerima nominal mentah (`p_total`, `p_subtotal`) dari kasir offline secara buta**. 
* **Analisis Mekanisme:** Tidak ada proses *server-side price validation* (fungsi tidak melakukan pencarian harga produk di database untuk mencocokkan total/subtotal). Apabila client mengubah harga produk secara lokal di IndexedDB (offline) lalu menyingkronkannya saat online, Supabase akan merekam nominal hasil manipulasi tersebut tanpa penolakan.

---

## 3. SKRIP FUNGSI SQL UPGRADE PLAN

Ditemukan pada file: [update_pricing_rpcs.sql](file:///c:/My%20Invoice%20Apps/update_pricing_rpcs.sql)

```sql
-- 1. Update upgrade_to_pro
CREATE OR REPLACE FUNCTION public.upgrade_to_pro(p_trx_id text, p_is_yearly boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days integer;
BEGIN
    v_days := CASE WHEN p_is_yearly THEN 365 ELSE 30 END;
    
    UPDATE public.profiles
    SET 
        plan = 'pro',
        pro_expires_at = COALESCE(pro_expires_at, now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = NULL -- end trial if active
    WHERE id = auth.uid();
END;
$$;

-- 2. Update upgrade_to_ultimate
CREATE OR REPLACE FUNCTION public.upgrade_to_ultimate(p_trx_id text, p_is_yearly boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_days integer;
BEGIN
    v_days := CASE WHEN p_is_yearly THEN 365 ELSE 30 END;

    UPDATE public.profiles
    SET 
        plan = 'ultimate',
        pro_expires_at = COALESCE(pro_expires_at, now()) + (v_days || ' days')::interval,
        last_payment_trx_id = p_trx_id,
        trial_ends_at = NULL
    WHERE id = auth.uid();
END;
$$;
```

### 🔬 Hasil Temuan Audit Keamanan pada Fungsi Upgrade:
* **VULNERABILITY:** Kedua fungsi ini menggunakan opsi `SECURITY DEFINER` (berjalan dengan privilese super/bypass RLS), tetapi **tidak memverifikasi validitas `p_trx_id`** ke backend pembayaran ataupun ke tabel transaksi yang valid. Ini memungkinkan *client-side bypass* gratisan hanya dengan melempar parameter transaksi kosong/acak dari browser.

---

## 4. ALUR TRANSACTION-ONLINE & INFEKSI SINKRONISASI OFFLINE

### A. Inisialisasi Klien Supabase
Ditemukan pada file: [supabase.js](file:///c:/My%20Invoice%20Apps/src/lib/supabase.js)

Menggunakan konfigurasi otentikasi PKCE standar:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### B. Antrean Sinkronisasi (Offline-to-Online)
Ditemukan pada file: [offlineQueue.js](file:///c:/My%20Invoice%20Apps/src/utils/offlineQueue.js) dan diproses di [App.jsx](file:///c:/My%20Invoice%20Apps/src/App.jsx) (baris 230–274).

#### Alur Eksekusi Sinkronisasi:
1. Saat aplikasi mendeteksi browser kembali online (`online` event listener), fungsi `syncOfflineSales` dieksekusi.
2. Aplikasi menarik seluruh antrean penjualan yang tertunda dari IndexedDB lokal (`MyInvoiceOfflineDB`).
3. Aplikasi melakukan loop dan menembak fungsi RPC `process_sale` secara sekuensial dengan jeda throttle 500ms untuk menghindari batasan API rate-limit:
```javascript
  useEffect(() => {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const syncOfflineSales = async () => {
      if (!navigator.onLine || isSyncing) return;
      setIsSyncing(true);
      try {
        // Ambil salinan antrean saat ini (Async IndexedDB)
        const queueData = await getOfflineQueue();
        const queue = [...queueData];
        if (queue.length === 0) return;
        
        console.log(`[SYNC] Mendeteksi ${queue.length} transaksi offline. Memulai sinkronisasi...`);
        
        for (const entry of queue) {
          try {
            const { error } = await supabase.rpc('process_sale', entry.data);
            if (!error) {
              await removeFromOfflineQueue(entry.offline_id);
              console.log(`[SYNC] Berhasil sinkronisasi transaksi: ${entry.offline_id}`);
            } else {
              console.error(`[SYNC] Gagal sinkronisasi ${entry.offline_id}:`, error);
            }
          } catch (err) {
            console.error(`[SYNC] Fatal error during sync for ${entry.offline_id}:`, err);
          }
          
          // Sisipkan delay throttle untuk mencegah rate limit
          await delay(500);
        }
        
        // Notify components that data has been updated
        window.dispatchEvent(new Event('kasir-updated'));
        window.dispatchEvent(new Event('data-updated'));
      } finally {
        setIsSyncing(false);
      }
    };

    window.addEventListener('online', syncOfflineSales);
    syncOfflineSales();
    
    return () => window.removeEventListener('online', syncOfflineSales);
  }, []);
```
4. Jika respon RPC sukses, item transaksi tersebut langsung dihapus dari IndexedDB (`removeFromOfflineQueue`).

---
**Kesimpulan Audit:** Infrastruktur database saat ini memiliki tingkat fungsionalitas offline yang tinggi, namun memiliki celah di mana data input total harga diproses tanpa validasi silang harga asli produk di sisi server. RLS pada `profiles` juga direkomendasikan diperketat hanya untuk operasi `SELECT` guna menghindari modifikasi plan secara ilegal.
