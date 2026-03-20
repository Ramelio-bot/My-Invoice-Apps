import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const LOGO_KEY = 'company_logo';
const MAX_SIZE_BYTES = 200 * 1024; // 200KB

export function useCompanyLogo() {
    const [logo, setLogoState] = useState(() => {
        try { return localStorage.getItem(LOGO_KEY) || ''; }
        catch { return ''; }
    });

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
                const dbLogo = data?.store_logo_url || data?.company_logo;
                if (dbLogo) {
                    setLogoState(dbLogo);
                    try { localStorage.setItem(LOGO_KEY, dbLogo); } catch {}
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
            return false; // return false agar caller bisa tampilkan toast
        }
        setLogoState(base64OrUrl);
        try { localStorage.setItem(LOGO_KEY, base64OrUrl); } catch {}
        // Sync ke Supabase
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({ store_logo_url: base64OrUrl })
                    .eq('id', session.user.id);
            }
        } catch (e) {
            console.error('Logo sync error:', e);
        }
        return true;
    }, []);

    const clearLogo = useCallback(async () => {
        setLogoState('');
        try { localStorage.removeItem(LOGO_KEY); } catch {}
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('profiles')
                    .update({ store_logo_url: null })
                    .eq('id', session.user.id);
            }
        } catch (e) {
            console.error('Logo clear error:', e);
        }
    }, []);

    return { logo, setLogo, clearLogo };
}
