import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const PlanContext = createContext(null);

const PLAN_LIMITS = {
    FREE: {
        clients: 10,
        products: 20,
        invoices: 10,
        kwitansi: 10,
        hutangPiutang: 10,
        quotation: 5,
        po: 5,
        tandaTerima: 5,
        downloads: 10,
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
    const { effectivePlan, isAdmin, user } = useAuth();
    const currentPlan = effectivePlan || 'free';

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = currentPlan.toUpperCase();
    const isUltimate = isAdmin || currentPlan === 'ultimate';
    const isPro = isUltimate || currentPlan === 'pro';
    const isPremium = isPro; // Alias for GLOBAL watermark removal (covers PRO, ULTIMATE, and Admin)
    const isFree = !isAdmin && currentPlan === 'free';

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
            const settledAll = await Promise.allSettled([
                // [0] Clients — total semua (tidak terbatas bulan)
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                // [1] Documents (Invoice, Quotation, HP, Kwitansi-legacy, Downloads)
                supabase.from('documents').select('type').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [2] TandaTerima — hanya hitung total row (count)
                supabase.from('receipts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [3] Audit Log ("Hantu" yang sudah dihapus)
                supabase.from('audit_logs').select('module, action').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [4] Kasir transactions (Daily)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').gte('created_at', startDayIso).lte('created_at', endDayIso),
                // [5] Kasir transactions (Monthly)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'paid').gte('created_at', startIso).lte('created_at', endIso),
                // [6] Cashbook (Manual entries only — exclude POS/Invoice/Kwitansi/HP automated mirrors)
                supabase.from('cashbook').select('id, category, is_automated, reference_type, document_id').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [7] Purchase Orders
                supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // [8] Active Products
                supabase.from('kasir_products').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_active', true)
            ]);

            const clients        = safe(settledAll[0]);
            const documents      = safe(settledAll[1], { data: [] });
            const ttrResult      = safe(settledAll[2]);
            const deletedLogs    = safe(settledAll[3], { data: [] }).data || [];
            const kasirDaily     = safe(settledAll[4]);
            const kasir          = safe(settledAll[5]);
            const cashbook       = safe(settledAll[6]);
            const purchaseOrders = safe(settledAll[7]);
            const products       = safe(settledAll[8]);

            let invCount = 0, hpCount = 0, quoteCount = 0, downloadCount = 0, kwCount = 0;
            (documents.data || []).forEach(doc => {
                if (['invoice', 'inv'].includes(doc.type)) invCount++;
                if (['hutang', 'piutang'].includes(doc.type)) hpCount++;
                if (doc.type === 'sph') quoteCount++;
                if (doc.type === 'download') downloadCount++;
                if (['kw', 'kwitansi'].includes(doc.type)) kwCount++;
            });

            const adminCategories = [
                'Penjualan Kasir', 'Pengeluaran Kasir', 'Operasional Kasir', 'Cashier Expenses',
                'Kwitansi', 'Invoice Lunas', 'Lunas', 'Paid',
                'Pembayaran Piutang', 'Pembayaran Hutang', 'Pelunasan Piutang', 'Pelunasan Hutang'
            ];
            const manualCashbookCount = (cashbook.data || []).filter(c =>
                !c.is_automated &&
                !c.reference_type &&
                !c.document_id &&
                !adminCategories.includes(c.category)
            ).length;

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

            setUsage({
                clients: getCount(clients),
                products: getCount(products),
                invoices: invCount + (burn['invoice'] || 0),
                kwitansi: kwCount + (burn['kwitansi'] || 0),
                hutangPiutang: hpCount + (burn['hutangpiutang'] || 0),
                quotation: quoteCount + (burn['quotation'] || 0),
                po: getCount(purchaseOrders) + (burn['purchaseorder'] || 0),
                tandaTerima: ttrAktif + (burn['tandaterima'] || 0),
                downloads: downloadCount,
                kasir: getCount(kasir),
                kasirDaily: getCount(kasirDaily),
                cashbookManual: manualCashbookCount + (burn['catatanbisnis'] || 0)
            });
        } catch (err) {
            console.error('Usage: Failed to refresh limits', err);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        refreshUsage();

        let debounceTimer = null;
        const handleDataUpdated = () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                refreshUsage();
            }, 400);
        };

        const events = ['data-updated', 'invoice-updated', 'cashbook-updated', 'clients-updated', 'kasir-updated'];
        events.forEach(evt => window.addEventListener(evt, handleDataUpdated));
        
        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            events.forEach(evt => window.removeEventListener(evt, handleDataUpdated));
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
        setUsage(prev => ({ ...prev, downloads: prev.downloads + 1 }));
        try {
            await supabase.from('documents').insert({
                user_id: user.id,
                type: 'download',
                doc_number: number || '-',
                client_name: clientName || '-',
                total_amount: Number(amount) || 0,
                status: 'completed',
                data: {
                    docType,
                    downloadedAt: new Date().toISOString(),
                    date: new Date().toLocaleDateString('en-CA'),
                    amount: Number(amount) || 0,
                    clientName
                }
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

    // Optimistic increments + server refresh to prevent rapid double-click race conditions
    const incrementInvoice = useCallback(() => {
        setUsage(prev => ({ ...prev, invoices: prev.invoices + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementKwitansi = useCallback(() => {
        setUsage(prev => ({ ...prev, kwitansi: prev.kwitansi + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementHutangPiutang = useCallback(() => {
        setUsage(prev => ({ ...prev, hutangPiutang: prev.hutangPiutang + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementQuotation = useCallback(() => {
        setUsage(prev => ({ ...prev, quotation: prev.quotation + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementPO = useCallback(() => {
        setUsage(prev => ({ ...prev, po: prev.po + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementTandaTerima = useCallback(() => {
        setUsage(prev => ({ ...prev, tandaTerima: prev.tandaTerima + 1 }));
        refreshUsage();
    }, [refreshUsage]);
    const incrementKasirTransaction = useCallback(() => {
        setUsage(prev => ({ ...prev, kasir: prev.kasir + 1, kasirDaily: prev.kasirDaily + 1 }));
        refreshUsage();
    }, [refreshUsage]);

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
