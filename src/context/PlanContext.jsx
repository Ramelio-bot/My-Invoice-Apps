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

        try {
            // 1. Ambil Data Aktif (Termasuk Clients, KasirDaily, Downloads dll. agar limit lain tidak jebol)
            const [
                clients,
                documents,
                receipts,
                kasirDaily,
                kasir,
                cashbook,
                purchaseOrders
            ] = await Promise.all([
                // Clients
                supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
                // Documents (Invoice, Quotation, HP, Downloads)
                supabase.from('documents').select('type').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // Receipts (Kwitansi & Tanda Terima)
                supabase.from('receipts').select('receipt_type').eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // Kasir transactions (Daily)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startDayIso).lte('created_at', endDayIso),
                // Kasir transactions (Monthly)
                supabase.from('kasir_transactions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
                // Cashbook
                supabase.from('cashbook').select('*', { count: 'exact', head: true }).eq('user_id', user.id).not('category', 'in', '("Penjualan Kasir","Pengeluaran Kasir","Invoice Lunas")').gte('created_at', startIso).lte('created_at', endIso),
                // PO
                supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', startIso).lte('created_at', endIso),
            ]);

            // 2. Parsel Documents Active Counts
            let invCount = 0, hpCount = 0, quoteCount = 0, downloadCount = 0, kwLegacyCount = 0;
            (documents.data || []).forEach(doc => {
                if (doc.type === 'invoice') invCount++;
                if (['hutang', 'piutang'].includes(doc.type)) hpCount++;
                if (doc.type === 'sph') quoteCount++;
                if (doc.type === 'download') downloadCount++;
                if (doc.type === 'kw') kwLegacyCount++;
            });

            const kwitansiAktif = kwLegacyCount + (receipts.data || []).filter(r => r.receipt_type === 'kwitansi').length;
            const ttrAktif = (receipts.data || []).filter(r => r.receipt_type === 'tanda_terima').length;

            const getCount = (r) => r.count || 0;

            // 3. Ambil Data "Hantu" (Yang Sudah Dihapus) dari Audit Log
            const { data: deletedLogs } = await supabase.from('audit_logs')
                .select('module')
                .eq('user_id', user.id)
                .eq('action', 'DELETE')
                .gte('created_at', startIso)
                .lte('created_at', endIso);

            const burn = (deletedLogs || []).reduce((acc, log) => {
                acc[log.module] = (acc[log.module] || 0) + 1;
                return acc;
            }, {});

            // 4. Set Usage (Aktif + Hangus)
            setUsage({
                clients: getCount(clients),
                products: 0, // Hardcoded to 0 temporarily based on previous logic
                invoices: invCount + (burn['Invoice'] || 0),
                kwitansi: kwitansiAktif + (burn['Kwitansi'] || 0),
                hutangPiutang: hpCount + (burn['HutangPiutang'] || 0),
                quotation: quoteCount + (burn['Quotation'] || 0),
                po: getCount(purchaseOrders) + (burn['PurchaseOrder'] || 0),
                tandaTerima: ttrAktif + (burn['TandaTerima'] || 0),
                kasir: getCount(kasir),
                kasirDaily: getCount(kasirDaily),
                cashbookManual: getCount(cashbook) + (burn['CatatanBisnis'] || 0),
                downloads: downloadCount
            });
        } catch (err) {
            console.error('Usage: Failed to refresh limits', err);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        // Strict fix for "TypeError: c is not a function"
        // Ensure the effect doesn't return anything (like a Promise)
        refreshUsage();
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
