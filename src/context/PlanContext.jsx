import { createContext, useContext, useState, useCallback } from 'react';

const PlanContext = createContext(null);

const ACTIVATION_CODE = 'MYINVOICE-PRO-2026';

export function PlanProvider({ children }) {
    const [plan, setPlan] = useState(() => localStorage.getItem('plan') || 'FREE');

    const isPro = true; // TESTING: all features unlocked


    const activatePro = (code) => {
        if (code.trim().toUpperCase() === ACTIVATION_CODE) {
            setPlan('PRO');
            localStorage.setItem('plan', 'PRO');
            return true;
        }
        return false;
    };

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
            plan, isPro, activatePro,
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
