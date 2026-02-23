import { useState, useCallback } from 'react';

const LOGO_KEY = 'company_logo';

export function useCompanyLogo() {
    const [logo, setLogoState] = useState(() => {
        try { return localStorage.getItem(LOGO_KEY) || ''; }
        catch { return ''; }
    });

    const setLogo = useCallback((base64) => {
        setLogoState(base64);
        try { localStorage.setItem(LOGO_KEY, base64); }
        catch (e) { console.error('Logo save error:', e); }
    }, []);

    const clearLogo = useCallback(() => {
        setLogoState('');
        try { localStorage.removeItem(LOGO_KEY); }
        catch { /* ignore */ }
    }, []);

    return { logo, setLogo, clearLogo };
}
