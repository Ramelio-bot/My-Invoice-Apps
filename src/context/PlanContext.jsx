import { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
    const { effectivePlan, isAdmin, user } = useAuth();

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = (effectivePlan || '').toUpperCase();
    const isPro = isAdmin || ['PRO', 'ULTIMATE'].includes(normalizedPlan);
    const isUltimate = isAdmin || normalizedPlan === 'ULTIMATE';
    const isPremium = isPro; // Alias for GLOBAL watermark removal (covers PRO, ULTIMATE, and Admin)
    const isFree = !isAdmin && normalizedPlan === 'FREE';

    const [usage, setUsage] = useState({
        clients: 0,
        products: 0,
        invoiceKwitansi: 0,
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
        const newUsage = { ...usage };

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
                if (['invoice', 'kwitansi'].includes(doc.type)) acc.invoiceKwitansi++;
                if (['hutang', 'piutang'].includes(doc.type)) acc.hutangPiutang++;
                if (doc.type === 'quote') acc.quotation++;
                if (doc.type === 'po') acc.po++;
                if (doc.type === 'ttr') acc.tandaTerima++;
                return acc;
            }, { invoiceKwitansi: 0, hutangPiutang: 0, quotation: 0, po: 0, tandaTerima: 0 });

            Object.assign(newUsage, docCounts);
        } catch (err) {
            console.error('Usage: Failed to count monthly documents', err);
            newUsage.invoiceKwitansi = 0;
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
                .not('category', 'in', '("Penjualan Kasir", "Pengeluaran Kasir", "Invoice Lunas")')
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
        if (isPro) return true;
        return usage.clients < 1;
    }, [isPro, usage.clients]);

    const getClientCount = useCallback(() => usage.clients, [usage.clients]);

    const checkProductLimit = useCallback(() => {
        if (isPro) return true;
        return usage.products < 5;
    }, [isPro, usage.products]);

    const getProductCount = useCallback(() => usage.products, [usage.products]);

    // Combined Invoice & Kwitansi: 10/month
    const checkInvoiceKwitansiLimit = useCallback(() => {
        if (isPro) return true;
        return usage.downloads < 3;
    }, [isPro, usage.downloads]);

    const getInvoiceKwitansiCount = useCallback(() => {
        return usage.invoiceKwitansi;
    }, [usage.invoiceKwitansi]);

    // Hutang & Piutang: 10/month
    const checkHutangPiutangLimit = useCallback(() => {
        if (isPro) return true;
        return usage.hutangPiutang < 10;
    }, [isPro, usage.hutangPiutang]);

    const getHutangPiutangCount = useCallback(() => {
        return usage.hutangPiutang;
    }, [usage.hutangPiutang]);

    // Quotation (Penawaran): 5/month
    const checkQuotationLimit = useCallback(() => {
        if (isPro) return true;
        return usage.downloads < 3;
    }, [isPro, usage.downloads]);

    const getQuotationCount = useCallback(() => {
        return usage.quotation;
    }, [usage.quotation]);

    // Purchase Order: 5/month
    const checkPOLimit = useCallback(() => {
        if (isPro) return true;
        return usage.downloads < 3;
    }, [isPro, usage.downloads]);

    const getPOCount = useCallback(() => {
        return usage.po;
    }, [usage.po]);

    // Tanda Terima: 5/month
    const checkTandaTerimaLimit = useCallback(() => {
        if (isPro) return true;
        return usage.tandaTerima < 5;
    }, [isPro, usage.tandaTerima]);

    const getTandaTerimaCount = useCallback(() => {
        return usage.tandaTerima;
    }, [usage.tandaTerima]);

    const checkDownloadLimit = useCallback(() => {
        if (isPro) return true;
        return usage.downloads < 3;
    }, [isPro, usage.downloads]);

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

    // Kasir: FREE = max 10 transaksi/HARI, PRO = UNLIMITED
    const checkKasirTransactionLimit = useCallback(() => {
        if (isPro) return true; // PRO & ULTIMATE are UNLIMITED
        return usage.kasirDaily < 10;
    }, [isPro, usage.kasirDaily]);

    const getKasirTransactionCount = useCallback(() => {
        return usage.kasir;
    }, [usage.kasir]);

    const getKasirDailyCount = useCallback(() => {
        return usage.kasirDaily;
    }, [usage.kasirDaily]);

    // Cashbook Manual: FREE = max 20 transaksi/BULAN, PRO = UNLIMITED
    const checkCashbookLimit = useCallback(() => {
        if (isPro) return true;
        return usage.cashbookManual < 20;
    }, [isPro, usage.cashbookManual]);

    const getCashbookCount = useCallback(() => {
        return usage.cashbookManual;
    }, [usage.cashbookManual]);

    // Legacy increments - now they just trigger refresh or are ignored
    const incrementInvoiceKwitansi = refreshUsage;
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
            checkInvoiceKwitansiLimit, incrementInvoiceKwitansi, getInvoiceKwitansiCount,
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
