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
        downloads: 0
    });

    const refreshUsage = useCallback(async () => {
        if (!user || isAdmin) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        try {
            // 1. Clients & Products (Total)
            const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user.id);

            // 2. Monthly Documents
            const { data: monthlyDocs } = await supabase.from('documents')
                .select('type, created_at')
                .eq('user_id', user.id)
                .gte('created_at', startOfMonth);

            const counts = (monthlyDocs || []).reduce((acc, doc) => {
                if (['invoice', 'kwitansi'].includes(doc.type)) acc.invoiceKwitansi++;
                if (['hutang', 'piutang'].includes(doc.type)) acc.hutangPiutang++;
                if (doc.type === 'quote') acc.quotation++;
                if (doc.type === 'po') acc.po++;
                if (doc.type === 'ttr') acc.tandaTerima++;
                return acc;
            }, { invoiceKwitansi: 0, hutangPiutang: 0, quotation: 0, po: 0, tandaTerima: 0 });

            // 3. Kasir Transactions (Cashbook)
            const { count: kasirCount } = await supabase.from('cashbook')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('reference_type', 'kasir')
                .gte('created_at', startOfMonth);

            // 4. Downloads (Temporary: set to 0 as we remove localStorage)
            setUsage({
                clients: clientCount || 0,
                products: productCount || 0,
                ...counts,
                kasir: kasirCount || 0,
                downloads: 0
            });
        } catch (err) {
            console.error('Error refreshing usage:', err);
        }
    }, [user, isAdmin]);

    useEffect(() => {
        refreshUsage();
    }, [refreshUsage, user]);

    // FREE limits (Updated for Supabase Live Count)
    const checkClientLimit = useCallback(() => {
        if (isPro) return true;
        return usage.clients < 5;
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
        return usage.invoiceKwitansi < 10;
    }, [isPro, usage.invoiceKwitansi]);

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
        return usage.quotation < 5;
    }, [isPro, usage.quotation]);

    const getQuotationCount = useCallback(() => {
        return usage.quotation;
    }, [usage.quotation]);

    // Purchase Order: 5/month
    const checkPOLimit = useCallback(() => {
        if (isPro) return true;
        return usage.po < 5;
    }, [isPro, usage.po]);

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
        return true; // Set to true (unlimited) for now as we remove localStorage
    }, [isPro]);

    const incrementDownload = useCallback(() => {
        // No-op as we remove localStorage
    }, []);

    // Kasir: FREE = max 50 transaksi/bulan
    const checkKasirTransactionLimit = useCallback(() => {
        if (isUltimate) return true;
        return usage.kasir < 50;
    }, [isUltimate, usage.kasir]);

    const getKasirTransactionCount = useCallback(() => {
        return usage.kasir;
    }, [usage.kasir]);

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
            checkKasirTransactionLimit, incrementKasirTransaction, getKasirTransactionCount,
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
