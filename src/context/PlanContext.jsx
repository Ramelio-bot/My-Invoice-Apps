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
    const { effectivePlan, isAdmin, user } = useAuth();

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = (effectivePlan || '').toUpperCase();
    const isPro = isAdmin || ['PRO', 'ULTIMATE'].includes(normalizedPlan);
    const isUltimate = isAdmin || normalizedPlan === 'ULTIMATE';
    const isPremium = isPro; // Alias for GLOBAL watermark removal (covers PRO, ULTIMATE, and Admin)
    const isFree = !isAdmin && normalizedPlan === 'FREE';

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

        // Object to accumulate usage
        const newUsage = {
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
        };

        // 1. Clients
        try {
            const { count } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            newUsage.clients = count || 0;
        } catch (err) {
            console.error('Usage: Failed to count clients', err);
            newUsage.clients = 0;
        }

        // 2. Products (HARDCODED TO 0 - FIX 404)
        newUsage.products = 0;

        // 3. Monthly Documents (Documents table)
        try {
            const { data: monthlyDocs } = await supabase.from('documents')
                .select('type')
                .eq('user_id', user.id)
                .gte('created_at', startIso)
                .lte('created_at', endIso);

            const docCounts = (monthlyDocs || []).reduce((acc, doc) => {
                if (doc.type === 'invoice') acc.invoices++;
                if (doc.type === 'kw') acc.kwitansi++;
                if (['hutang', 'piutang'].includes(doc.type)) acc.hutangPiutang++;
                if (doc.type === 'sph') acc.quotation++;
                if (doc.type === 'po') acc.po++;
                if (doc.type === 'ttr') acc.tandaTerima++;
                return acc;
            }, { invoices: 0, kwitansi: 0, hutangPiutang: 0, quotation: 0, po: 0, tandaTerima: 0 });

            Object.assign(newUsage, docCounts);
        } catch (err) {
            console.error('Usage: Failed to count monthly documents', err);
            newUsage.invoices = 0;
            newUsage.kwitansi = 0;
            newUsage.hutangPiutang = 0;
            newUsage.quotation = 0;
            newUsage.po = 0;
            newUsage.tandaTerima = 0;
        }

        // 4. Kasir Transactions
        try {
            const { count } = await supabase.from('kasir_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startIso)
                .lte('created_at', endIso);
            newUsage.kasir = count || 0;
        } catch (err) {
            console.error('Usage: Failed to count kasir', err);
            newUsage.kasir = 0;
        }

        // 4b. Kasir Transactions DAILY (FREE limit: 10/day)
        try {
            const { count } = await supabase.from('kasir_transactions')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .gte('created_at', startDayIso)
                .lte('created_at', endDayIso);
            newUsage.kasirDaily = count || 0;
        } catch (err) {
            console.error('Usage: Failed to count daily kasir', err);
            newUsage.kasirDaily = 0;
        }

        // 4c. Cashbook Manual Transactions (FREE limit: 20/month)
        try {
            const { count } = await supabase.from('cashbook')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .not('category', 'in', '("Penjualan Kasir","Pengeluaran Kasir","Invoice Lunas")')
                .gte('created_at', startIso)
                .lte('created_at', endIso);
            newUsage.cashbookManual = count || 0;
        } catch (err) {
            console.error('Usage: Failed to count cashbook manual', err);
            newUsage.cashbookManual = 0;
        }

        // 5. Downloads (Tracked in documents table with type: 'download')
        try {
            const { count } = await supabase.from('documents')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('type', 'download')
                .gte('created_at', startIso)
                .lte('created_at', endIso);
            newUsage.downloads = count || 0;
        } catch (err) {
            console.error('Usage: Failed to count downloads', err);
            newUsage.downloads = 0;
        }

        setUsage(newUsage);
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
