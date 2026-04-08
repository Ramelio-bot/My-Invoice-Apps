import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const PlanContext = createContext(null);

const PLAN_LIMITS = {
    FREE: {
        clients: 5,
        products: 5,
        invoices: 10,
        kwitansi: 10,
        hutangPiutang: 10,
        quotation: 5,
        po: 5,
        tandaTerima: 5,
        downloads: 3,
        kasir: 50,
        cashbook: 20
    },
    PRO: {
        clients: Infinity,
        products: Infinity,
        invoices: Infinity,
        kwitansi: Infinity,
        hutangPiutang: Infinity,
        quotation: Infinity,
        po: Infinity,
        tandaTerima: Infinity,
        downloads: Infinity,
        kasir: Infinity,
        cashbook: Infinity
    },
    ULTIMATE: {
        clients: Infinity,
        products: Infinity,
        invoices: Infinity,
        kwitansi: Infinity,
        hutangPiutang: Infinity,
        quotation: Infinity,
        po: Infinity,
        tandaTerima: Infinity,
        downloads: Infinity,
        kasir: Infinity,
        cashbook: Infinity
    }
};

export function PlanProvider({ children }) {
    const { effectivePlan, isAdmin, user, trialActive } = useAuth();
    const isForceUltimate = user?.email === 'mieayamsutra88@gmail.com';
    const currentPlan = isForceUltimate ? 'ultimate' : (effectivePlan || 'free');

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = currentPlan.toUpperCase();
    const isUltimate = isForceUltimate || isAdmin || currentPlan === 'ultimate';
    const isPro = isUltimate || currentPlan === 'pro';
    const isPremium = isPro; // Alias for GLOBAL watermark removal (covers PRO, ULTIMATE, and Admin)
    const isFree = !isForceUltimate && !isAdmin && currentPlan === 'free';

    const currentLimits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.FREE;

    const [usage, setUsage] = useState({
        clients: 0,
        products: 0,
        invoices: 0,
        kwitansi: 0,
        hutangPiutang: 0,
        quotation: 0,
        po: 0,
        tandaTerima: 0,
        kasir: 0,
        kasirDaily: 0,
        cashbookManual: 0,
        downloads: 0
    });

    const refreshUsage = useCallback(async () => {
        if (!user || isAdmin) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const startIso = startOfMonth.toISOString();
        const endIso = endOfMonth.toISOString();
        const startDayIso = startOfDay.toISOString();
        const endDayIso = endOfDay.toISOString();

        // Helper: aman ambil hasil dari Promise.allSettled
        // Jika satu query gagal (400/403), tidak membunuh seluruh kalkulasi
        const safe = (settled, fallback = { data: null, count: 0 }) =>
            settled.status === 'fulfilled' ? settled.value : (() => {
                console.warn('[PlanContext] Query gagal, pakai fallback:', settled.reason);
                return fallback;
            })();

        try {
            // 1. Ambil Data Aktif — pakai Promise.allSettled agar satu query gagal
            // tidak membunuh seluruh kalkulasi limit aplikasi
            const settled = await Promise.allSettled([
                // [0] Clients — total semua (tidak terbatas bulan)
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                // [1] Documents (Invoice, Quotation, HP, Kwitansi-legacy, Downloads)
                supabase.from('documents').select('type').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [2] TandaTerima — tabel 'receipts' TIDAK punya kolom receipt_type!
                // Kita hanya hitung total row (count), tanpa select kolom spesifik yang tidak ada
                supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [3] Kasir transactions (Daily)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startDayIso).lte('created_at', endDayIso),
                // [4] Kasir transactions (Monthly)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [5] Cashbook (Manual saja, exclude auto-entries)
                supabase.from('cashbook').select('*', { count: 'exact', head: true }).eq('user_id', user.id).or('is_automated.eq.false,is_automated.is.null').gte('created_at', startIso).lte('created_at', endIso),
                // [6] Purchase Orders
                supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
            ]);

            const clients      = safe(settled[0]);
            const documents    = safe(settled[1], { data: [] });
            const ttrResult    = safe(settled[2]); // TandaTerima count dari tabel receipts
            const kasirDaily   = safe(settled[3]);
            const kasir        = safe(settled[4]);
            const cashbook     = safe(settled[5]);
            const purchaseOrders = safe(settled[6]);

            // 2. Parsel Documents Active Counts
            // Kwitansi: type='kw' di tabel documents (bukan di receipts!)
            // TandaTerima: ada di tabel receipts (count sudah diambil di atas)
            let invCount = 0, hpCount = 0, quoteCount = 0, downloadCount = 0, kwCount = 0;
            (documents.data || []).forEach(doc => {
                if (doc.type === 'invoice') invCount++;
                if (['hutang', 'piutang'].includes(doc.type)) hpCount++;
                if (doc.type === 'sph') quoteCount++;
                if (doc.type === 'download') downloadCount++;
                if (doc.type === 'kw') kwCount++; // Kwitansi aktif di tabel documents
            });

            const ttrAktif = ttrResult.count || 0; // TandaTerima dari receipts table

            const getCount = (r) => r.count || 0;

            // 3. Ambil Data "Hantu" (Yang Sudah Dihapus) dari Audit Log
            // Kita tarik tanpa filter action di Supabase untuk menghindari mismatch case, lalu filter di frontend
            const { data: deletedLogs, error: auditErr } = await supabase.from('audit_logs')
                .select('module, action')
                .eq('user_id', user.id)
                .gte('created_at', startIso)
                .lte('created_at', endIso);

            if (auditErr) console.error("CCTV Error/RLS Block:", auditErr);

            // Filter manual & paksa ke huruf kecil agar anti-gagal (case-insensitive)
            const burn = (deletedLogs || []).reduce((acc, log) => {
                const action = (log.action || '').toLowerCase();
                const mod = (log.module || '').toLowerCase();
                
                if (action.includes('delete')) {
                    acc[mod] = (acc[mod] || 0) + 1;
                }
                return acc;
            }, {});

            // 4. Set Usage (Aktif + Hangus)
            setUsage({
                clients: getCount(clients),
                products: 0, 
                invoices: invCount + (burn['invoice'] || 0),
                kwitansi: kwCount + (burn['kwitansi'] || 0),
                hutangPiutang: hpCount + (burn['hutangpiutang'] || 0),
                quotation: quoteCount + (burn['quotation'] || 0),
                po: getCount(purchaseOrders) + (burn['purchaseorder'] || 0),
                tandaTerima: ttrAktif + (burn['tandaterima'] || 0),
                kasir: getCount(kasir),
                kasirDaily: getCount(kasirDaily),
                cashbookManual: getCount(cashbook) + (burn['catatanbisnis'] || 0),
                downloads: downloadCount
            });
        } catch (err) {
            console.error('Usage: Failed to refresh limits', err);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        refreshUsage();

        // Pasang pendengaran dengan DELAY untuk menghindari Race Condition.
        // Saat event 'data-updated' diterima (setelah delete), Supabase butuh
        // ~200-500ms untuk commit baris baru ke audit_logs. Tanpa delay,
        // refreshUsage() akan menarik data lama (audit log belum ada) → burn = 0.
        let debounceTimer = null;
        const handleDataUpdated = () => {
            // Batalkan timer sebelumnya jika event datang bertubi-tubi
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                refreshUsage();
            }, 600); // 600ms: cukup untuk Supabase commit + network latency
        };

        window.addEventListener('data-updated', handleDataUpdated);
        
        // Bersihkan pendengaran saat komponen dibongkar
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            window.removeEventListener('data-updated', handleDataUpdated);
        };
    }, [refreshUsage, user]);

    // FREE limits (Updated for Supabase Live Count)
    const checkClientLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.clients < currentLimits.clients;
    }, [isAdmin, usage.clients, currentLimits.clients]);

    const getClientCount = useCallback(() => usage.clients, [usage.clients]);

    const checkProductLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.products < currentLimits.products;
    }, [isAdmin, usage.products, currentLimits.products]);

    const getProductCount = useCallback(() => usage.products, [usage.products]);

    // Invoices: 10/month
    const checkInvoiceLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.invoices < currentLimits.invoices;
    }, [isAdmin, usage.invoices, currentLimits.invoices]);

    const getInvoiceCount = useCallback(() => {
        return usage.invoices;
    }, [usage.invoices]);

    // Kwitansi: 10/month
    const checkKwitansiLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.kwitansi < currentLimits.kwitansi;
    }, [isAdmin, usage.kwitansi, currentLimits.kwitansi]);

    const getKwitansiCount = useCallback(() => {
        return usage.kwitansi;
    }, [usage.kwitansi]);

    // Hutang & Piutang: 10/month
    const checkHutangPiutangLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.hutangPiutang < currentLimits.hutangPiutang;
    }, [isAdmin, usage.hutangPiutang, currentLimits.hutangPiutang]);

    const getHutangPiutangCount = useCallback(() => {
        return usage.hutangPiutang;
    }, [usage.hutangPiutang]);

    // Quotation (Penawaran): 5/month
    const checkQuotationLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.quotation < currentLimits.quotation;
    }, [isAdmin, usage.quotation, currentLimits.quotation]);

    const getQuotationCount = useCallback(() => {
        return usage.quotation;
    }, [usage.quotation]);

    // Purchase Order: 5/month
    const checkPOLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.po < currentLimits.po;
    }, [isAdmin, usage.po, currentLimits.po]);

    const getPOCount = useCallback(() => {
        return usage.po;
    }, [usage.po]);

    // Tanda Terima: 5/month
    const checkTandaTerimaLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.tandaTerima < currentLimits.tandaTerima;
    }, [isAdmin, usage.tandaTerima, currentLimits.tandaTerima]);

    const getTandaTerimaCount = useCallback(() => {
        return usage.tandaTerima;
    }, [usage.tandaTerima]);

    const checkDownloadLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.downloads < currentLimits.downloads;
    }, [isAdmin, usage.downloads, currentLimits.downloads]);

    const incrementDownload = useCallback(async (docType, number, amount, clientName = '-') => {
        if (!user) return;
        try {
            await supabase.from('documents').insert({
                user_id: user.id,
                type: 'download',
                number: number || '-',
                client_name: clientName || '-',
                total: amount || 0,
                grand_total: amount || 0,
                date: new Date().toISOString().split('T')[0],
                data: { docType, downloadedAt: new Date().toISOString(), amount, clientName }
            });
            refreshUsage();
        } catch (err) {
            console.error('Failed to log download:', err);
        }
    }, [user, refreshUsage]);

    // Kasir: FREE = max 50 transaksi/BULAN, PRO = UNLIMITED
    const checkKasirTransactionLimit = useCallback(() => {
        if (isAdmin) return true; // PRO & ULTIMATE are UNLIMITED via currentLimits
        return usage.kasir < currentLimits.kasir;
    }, [isAdmin, usage.kasir, currentLimits.kasir]);

    const getKasirTransactionCount = useCallback(() => {
        return usage.kasir;
    }, [usage.kasir]);

    const getKasirDailyCount = useCallback(() => {
        return usage.kasirDaily;
    }, [usage.kasirDaily]);

    // Cashbook Manual: FREE = max 20 transaksi/BULAN, PRO = UNLIMITED
    const checkCashbookLimit = useCallback(() => {
        if (isAdmin) return true;
        return usage.cashbookManual < currentLimits.cashbook;
    }, [isAdmin, usage.cashbookManual, currentLimits.cashbook]);

    const getCashbookCount = useCallback(() => {
        return usage.cashbookManual;
    }, [usage.cashbookManual]);

    // Legacy increments - now they just trigger refresh or are ignored
    const incrementInvoice = refreshUsage;
    const incrementKwitansi = refreshUsage;
    const incrementHutangPiutang = refreshUsage;
    const incrementQuotation = refreshUsage;
    const incrementPO = refreshUsage;
    const incrementTandaTerima = refreshUsage;
    const incrementKasirTransaction = refreshUsage;

    const getMonthlyDownloadCount = useCallback(() => {
        return usage.downloads;
    }, [usage.downloads]);

    return (
        <PlanContext.Provider value={{
            plan: effectivePlan,
            isPro, isUltimate, isFree, isPremium,
            checkClientLimit, getClientCount, checkProductLimit, getProductCount,
            checkDownloadLimit, incrementDownload,
            getMonthlyDownloadCount, refreshUsage,
            checkKasirTransactionLimit, incrementKasirTransaction, getKasirTransactionCount, getKasirDailyCount,
            checkCashbookLimit, getCashbookCount,
            checkInvoiceLimit, incrementInvoice, getInvoiceCount,
            checkKwitansiLimit, incrementKwitansi, getKwitansiCount,
            checkHutangPiutangLimit, incrementHutangPiutang, getHutangPiutangCount,
            checkQuotationLimit, incrementQuotation, getQuotationCount,
            checkPOLimit, incrementPO, getPOCount,
            checkTandaTerimaLimit, incrementTandaTerima, getTandaTerimaCount,
        }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    return useContext(PlanContext);
}
