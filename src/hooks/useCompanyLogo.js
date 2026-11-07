import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LOGO_KEY = 'company_logo';
const EVENT_KEY = 'company_logo_updated';
const MAX_SIZE_BYTES = 200 * 1024; // 200KB

export function useCompanyLogo() {
    const [logo, setLogoState] = useState(() => {
        try { return localStorage.getItem(LOGO_KEY) || ''; }
        catch { return ''; }
    });

    // Real-time synchronization across all component instances & tabs
    useEffect(() => {
        const handleSync = (e) => {
            const nextLogo = typeof e.detail === 'string' ? e.detail : (localStorage.getItem(LOGO_KEY) || '');
            setLogoState(nextLogo);
        };
        const handleStorage = (e) => {
            if (e.key === LOGO_KEY) {
                setLogoState(e.newValue || '');
            }
        };
        window.addEventListener(EVENT_KEY, handleSync);
        window.addEventListener('storage', handleStorage);
        return () => {
            window.removeEventListener(EVENT_KEY, handleSync);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // Load dari Supabase saat mount
    useEffect(() => {
        const loadFromDB = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return;
                const { data } = await supabase
                    .from('profiles')
                    .select('store_logo_url, company_logo')
                    .eq('id', session.user.id)
                    .maybeSingle();
                const dbLogo = data?.store_logo_url || data?.company_logo || '';
                setLogoState(dbLogo);
                if (dbLogo) {
                    try { localStorage.setItem(LOGO_KEY, dbLogo); } catch (err) { void err; }
                } else {
                    try { localStorage.removeItem(LOGO_KEY); } catch (err) { void err; }
                }
            } catch (e) {
                console.error('Logo load error:', e);
            }
        };
        loadFromDB();
    }, []);

    const setLogo = useCallback(async (base64OrUrl, fileSizeBytes) => {
        // Validasi ukuran maksimal 200KB
        if (fileSizeBytes && fileSizeBytes > MAX_SIZE_BYTES) {
            console.warn('Logo terlalu besar (maks 200KB)');
            return false;
        }
        setLogoState(base64OrUrl);
        try { localStorage.setItem(LOGO_KEY, base64OrUrl); } catch (err) { void err; }
        window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: base64OrUrl }));

        // Sync ke Supabase (update store_logo_url dan company_logo)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({ store_logo_url: base64OrUrl, company_logo: base64OrUrl })
                    .eq('id', session.user.id);
            }
        } catch (e) {
            console.error('Logo sync error:', e);
        }
        return true;
    }, []);

    const clearLogo = useCallback(async () => {
        setLogoState('');
        try { localStorage.removeItem(LOGO_KEY); } catch (err) { void err; }
        window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: '' }));

        // Sync ke Supabase (hapus store_logo_url dan company_logo agar tidak kembali muncul)
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({ store_logo_url: null, company_logo: null })
                    .eq('id', session.user.id);
            }
        } catch (e) {
            console.error('Logo clear error:', e);
        }
    }, []);

    return { logo, setLogo, clearLogo };
}
