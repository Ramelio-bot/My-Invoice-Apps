import { createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
    const { effectivePlan, isAdmin } = useAuth();

    // Admin selalu dapat akses penuh (untuk review & revisi)
    const normalizedPlan = (effectivePlan || '').toUpperCase();
    const isPro = isAdmin || ['PRO', 'ULTIMATE'].includes(normalizedPlan);
    const isUltimate = isAdmin || normalizedPlan === 'ULTIMATE';
    const isFree = !isAdmin && normalizedPlan === 'FREE';

    // FREE limits
    const checkClientLimit = useCallback((currentCount) => {
        if (isPro) return true;
        return currentCount < 3;
    }, [isPro]);

    const checkDownloadLimit = useCallback(() => {
        if (isPro) return true;
        const key = `dl_${new Date().getFullYear()}_${new Date().getMonth()}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        return count < 4;
    }, [isPro]);

    const incrementDownload = useCallback(() => {
        const key = `dl_${new Date().getFullYear()}_${new Date().getMonth()}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, String(count + 1));
    }, []);

    // Kasir: FREE = max 10 transaksi/hari, Ultimate = unlimited
    const checkKasirTransactionLimit = useCallback(() => {
        if (isUltimate) return true; // Ultimate: unlimited
        // FREE: max 10 per hari (bisa lihat kasir tapi terbatas)
        const today = new Date().toISOString().split('T')[0];
        const key = `kasir_tx_${today}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        return count < 10;
    }, [isUltimate]);

    const getKasirTransactionCount = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        return parseInt(localStorage.getItem(`kasir_tx_${today}`) || '0');
    }, []);

    const incrementKasirTransaction = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const key = `kasir_tx_${today}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, String(count + 1));
    }, []);

    // Cek limit transaksi lainnya (non-kasir)
    const checkTransactionLimit = useCallback(() => {
        if (isPro) return true;
        const today = new Date().toISOString().split('T')[0];
        const key = `tr_${today}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        return count < 10;
    }, [isPro]);

    const incrementTransaction = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const key = `tr_${today}`;
        const count = parseInt(localStorage.getItem(key) || '0');
        localStorage.setItem(key, String(count + 1));
    }, []);

    const getDailyTransactionCount = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const key = `tr_${today}`;
        return parseInt(localStorage.getItem(key) || '0');
    }, []);

    const getMonthlyDownloadCount = useCallback(() => {
        const key = `dl_${new Date().getFullYear()}_${new Date().getMonth()}`;
        return parseInt(localStorage.getItem(key) || '0');
    }, []);

    return (
        <PlanContext.Provider value={{
            plan: effectivePlan,
            isPro, isUltimate, isFree,
            checkClientLimit, checkDownloadLimit, incrementDownload,
            checkTransactionLimit, incrementTransaction,
            getDailyTransactionCount, getMonthlyDownloadCount,
            checkKasirTransactionLimit, incrementKasirTransaction, getKasirTransactionCount,
        }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    return useContext(PlanContext);
}
