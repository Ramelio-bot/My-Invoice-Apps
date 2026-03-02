import { createContext, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';

const PlanContext = createContext(null);

export function PlanProvider({ children }) {
    const { effectivePlan } = useAuth();

    // Cek plan berdasarkan effectivePlan dari AuthContext (server-side, tidak bisa dimanipulasi)
    const isPro = effectivePlan === 'pro' || effectivePlan === 'ultimate';
    const isUltimate = effectivePlan === 'ultimate';

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
            isPro, isUltimate,
            checkClientLimit, checkDownloadLimit, incrementDownload,
            checkTransactionLimit, incrementTransaction,
            getDailyTransactionCount, getMonthlyDownloadCount
        }}>
            {children}
        </PlanContext.Provider>
    );
}

export function usePlan() {
    return useContext(PlanContext);
}
