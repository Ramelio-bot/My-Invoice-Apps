import { createContext, useContext, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const PlanContext = createContext(null);

const PLAN_LIMITS = {
    FREE: {
        clients: 20,
        products: 50,
        invoices: 30,
        kwitansi: 30,
        hutangPiutang: 30,
        quotation: 20,
        po: 20,
        tandaTerima: 20,
        downloads: 5,
        kasir: 200,
        cashbook: 30
    },
    PRO: {
        clients: 50,
        products: Infinity,
        invoices: 50,
        kwitansi: 50,
        hutangPiutang: 50,
        quotation: 30,
        po: 30,
        tandaTerima: 30,
        downloads: Infinity,
        kasir: 400,
        cashbook: 50
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
    const { effectivePlan, isAdmin, user } = useAuth();
    const currentPlan = effectivePlan || 'free';

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = currentPlan.toUpperCase();
    const isUltimate = isAdmin || currentPlan === 'ultimate';
    const isPro = isUltimate || currentPlan === 'pro';
    const isPremium = isPro; // Alias for GLOBAL watermark removal (covers PRO, ULTIMATE, and Admin)
    const isFree = !isAdmin && currentPlan === 'free';

    const currentLimits = PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.FREE;

    const lazyTimeoutRef = useRef(null);
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

        // [FIX F4-2A] — Gunakan waktu server (UTC) bukan waktu lokal browser.
        // Mencegah bypass limit melalui manipulasi jam/tanggal perangkat.
        let serverNowIso = null;
        try {
            const { data: ts } = await supabase.rpc('get_server_timestamp');
            if (ts) serverNowIso = ts;
        } catch (error) {
            console.error(error);
            // Fallback ke waktu lokal jika RPC belum tersedia
        }

        const now = serverNowIso ? new Date(serverNowIso) : new Date();
        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const endOfMonth   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        const startOfDay   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay     = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const startIso    = startOfMonth.toISOString();
        const endIso      = endOfMonth.toISOString();
        const startDayIso = startOfDay.toISOString();
        const endDayIso   = endOfDay.toISOString();

        // Helper: aman ambil hasil dari Promise.allSettled
        // Jika satu query gagal (400/403), tidak membunuh seluruh kalkulasi
        const safe = (settled, fallback = { data: null, count: 0 }) =>
            settled.status === 'fulfilled' ? settled.value : (() => {
                console.warn('[PlanContext] Query gagal, pakai fallback:', settled.reason);
                return fallback;
            })();

        try {
            // 1. TAHAP 1 (URGENT): Ambil data kuota dokumen utama secara instan
            const settledUrgent = await Promise.allSettled([
                // [0] Clients — total semua (tidak terbatas bulan)
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                // [1] Documents (Invoice, Quotation, HP, Kwitansi-legacy, Downloads)
                supabase.from('documents').select('type').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [2] TandaTerima — hanya hitung total row (count)
                supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [3] Audit Log ("Hantu" yang sudah dihapus)
                supabase.from('audit_logs').select('module, action').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso)
            ]);

            const clients      = safe(settledUrgent[0]);
            const documents    = safe(settledUrgent[1], { data: [] });
            const ttrResult    = safe(settledUrgent[2]);
            const deletedLogs  = safe(settledUrgent[3], { data: [] }).data || [];

            // Parsel Documents Active Counts
            let invCount = 0, hpCount = 0, quoteCount = 0, downloadCount = 0, kwCount = 0;
            (documents.data || []).forEach(doc => {
                if (doc.type === 'invoice') invCount++;
                if (['hutang', 'piutang'].includes(doc.type)) hpCount++;
                if (doc.type === 'sph') quoteCount++;
                if (doc.type === 'download') downloadCount++;
                if (doc.type === 'kw') kwCount++;
            });

            const ttrAktif = ttrResult.count || 0;
            const getCount = (r) => r.count || 0;

            const burn = deletedLogs.reduce((acc, log) => {
                const action = (log.action || '').toLowerCase();
                const mod = (log.module || '').toLowerCase();
                if (action.includes('delete')) {
                    acc[mod] = (acc[mod] || 0) + 1;
                }
                return acc;
            }, {});

            // Update State URGENT langsung untuk rendering instan
            setUsage(prev => ({
                ...prev,
                clients: getCount(clients),
                invoices: invCount + (burn['invoice'] || 0),
                kwitansi: kwCount + (burn['kwitansi'] || 0),
                hutangPiutang: hpCount + (burn['hutangpiutang'] || 0),
                quotation: quoteCount + (burn['quotation'] || 0),
                tandaTerima: ttrAktif + (burn['tandaterima'] || 0),
                downloads: downloadCount
            }));

            // 2. TAHAP 2 (NON-URGENT): Delay 500ms untuk mengurangi concurrent HTTP queries
            if (lazyTimeoutRef.current) clearTimeout(lazyTimeoutRef.current);
            lazyTimeoutRef.current = setTimeout(async () => {
                try {
                    const settledNonUrgent = await Promise.allSettled([
                        // [0] Kasir transactions (Daily)
                        supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').gte('created_at', startDayIso).lte('created_at', endDayIso),
                        // [1] Kasir transactions (Monthly)
                        supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').gte('created_at', startIso).lte('created_at', endIso),
                        // [2] Cashbook
                        supabase.from('cashbook').select('id, category').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                        // [3] Purchase Orders
                        supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                        // [4] Products
                        supabase.from('kasir_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
                    ]);

                    const kasirDaily   = safe(settledNonUrgent[0]);
                    const kasir        = safe(settledNonUrgent[1]);
                    const cashbook     = safe(settledNonUrgent[2]);
                    const adminCategories = ['Kwitansi', 'Invoice Lunas', 'Lunas', 'Pembayaran Piutang', 'Pembayaran Hutang'];
                    cashbook.count     = (cashbook.data || []).filter(c => !adminCategories.includes(c.category)).length;
                    const purchaseOrders = safe(settledNonUrgent[3]);
                    const products     = safe(settledNonUrgent[4]);

                    setUsage(prev => ({
                        ...prev,
                        products: getCount(products),
                        po: getCount(purchaseOrders) + (burn['purchaseorder'] || 0),
                        kasir: getCount(kasir),
                        kasirDaily: getCount(kasirDaily),
                        cashbookManual: getCount(cashbook) + (burn['catatanbisnis'] || 0)
                    }));
                } catch (nonUrgentErr) {
                    console.error('[PlanContext] Failed to refresh non-urgent limits', nonUrgentErr);
                }
            }, 500);
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
            if (lazyTimeoutRef.current) clearTimeout(lazyTimeoutRef.current);
            window.removeEventListener('data-updated', handleDataUpdated);
        };
    }, [refreshUsage, user]);

    // FREE limits (Updated for Supabase Live Count)
    const checkClientLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.clients < currentLimits.clients;
    }, [isAdmin, usage.clients, currentLimits.clients, isUltimate]);

    const getClientCount = useCallback(() => usage.clients, [usage.clients]);

    const checkProductLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.products < currentLimits.products;
    }, [isAdmin, usage.products, currentLimits.products, isUltimate]);

    const getProductCount = useCallback(() => usage.products, [usage.products]);

    // Invoices: 10/month
    const checkInvoiceLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.invoices < currentLimits.invoices;
    }, [isAdmin, usage.invoices, currentLimits.invoices, isUltimate]);

    const getInvoiceCount = useCallback(() => {
        return usage.invoices;
    }, [usage.invoices]);

    // Kwitansi: 10/month
    const checkKwitansiLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.kwitansi < currentLimits.kwitansi;
    }, [isAdmin, usage.kwitansi, currentLimits.kwitansi, isUltimate]);

    const getKwitansiCount = useCallback(() => {
        return usage.kwitansi;
    }, [usage.kwitansi]);

    // Hutang & Piutang: 10/month
    const checkHutangPiutangLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.hutangPiutang < currentLimits.hutangPiutang;
    }, [isAdmin, usage.hutangPiutang, currentLimits.hutangPiutang, isUltimate]);

    const getHutangPiutangCount = useCallback(() => {
        return usage.hutangPiutang;
    }, [usage.hutangPiutang]);

    // Quotation (Penawaran): 5/month
    const checkQuotationLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.quotation < currentLimits.quotation;
    }, [isAdmin, usage.quotation, currentLimits.quotation, isUltimate]);

    const getQuotationCount = useCallback(() => {
        return usage.quotation;
    }, [usage.quotation]);

    // Purchase Order: 5/month
    const checkPOLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.po < currentLimits.po;
    }, [isAdmin, usage.po, currentLimits.po, isUltimate]);

    const getPOCount = useCallback(() => {
        return usage.po;
    }, [usage.po]);

    // Tanda Terima: 5/month
    const checkTandaTerimaLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.tandaTerima < currentLimits.tandaTerima;
    }, [isAdmin, usage.tandaTerima, currentLimits.tandaTerima, isUltimate]);

    const getTandaTerimaCount = useCallback(() => {
        return usage.tandaTerima;
    }, [usage.tandaTerima]);

    const checkDownloadLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.downloads < currentLimits.downloads;
    }, [isAdmin, usage.downloads, currentLimits.downloads, isUltimate]);

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
        if (isAdmin || isUltimate) return true; // PRO & ULTIMATE are UNLIMITED via currentLimits
        return usage.kasir < currentLimits.kasir;
    }, [isAdmin, usage.kasir, currentLimits.kasir, isUltimate]);

    const getKasirTransactionCount = useCallback(() => {
        return usage.kasir;
    }, [usage.kasir]);

    const getKasirDailyCount = useCallback(() => {
        return usage.kasirDaily;
    }, [usage.kasirDaily]);

    // Cashbook Manual: FREE = max 20 transaksi/BULAN, PRO = UNLIMITED
    const checkCashbookLimit = useCallback(() => {
        if (isAdmin || isUltimate) return true;
        return usage.cashbookManual < currentLimits.cashbook;
    }, [isAdmin, usage.cashbookManual, currentLimits.cashbook, isUltimate]);

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

    const value = useMemo(() => ({
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
        currentLimits,
        // Variabel Eksplisit untuk Integrasi Audit
        limit_bisnis_count: usage.cashbookManual,
        limit_kwitansi_count: usage.kwitansi,
        limit_invoice_count: usage.invoices
    }), [
        effectivePlan,
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
        currentLimits,
        usage.cashbookManual,
        usage.kwitansi,
        usage.invoices
    ]);

    return (
        <PlanContext.Provider value={value}>
            {children}
        </PlanContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlan() {
    return useContext(PlanContext);
}
