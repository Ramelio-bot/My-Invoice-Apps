import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const OutletContext = createContext(null);

export function OutletProvider({ children }) {
    const { user, effectivePlan, isAdmin } = useAuth();
    const [outlets, setOutlets] = useState([]);
    const [activeOutlet, setActiveOutletState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Cek apakah user bisa akses multi outlet
    const canUseMultiOutlet = isAdmin || effectivePlan === 'ultimate';

    const fetchOutlets = useCallback(async () => {
        if (!user) { setLoading(false); return; }
        try {
            const { data, error } = await supabase
                .from('outlets')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                setOutlets(data);
                // Ambil outlet aktif dari localStorage atau pakai default
                const savedId = localStorage.getItem(`active_outlet_${user.id}`);
                const saved = data.find(o => o.id === savedId);
                const defaultOutlet = data.find(o => o.is_default) || data[0];
                setActiveOutletState(saved || defaultOutlet);
            } else {
                // Buat outlet default otomatis jika belum ada
                const { data: newOutlet } = await supabase
                    .from('outlets')
                    .insert({
                        user_id: user.id,
                        name: 'Outlet Utama',
                        is_default: true,
                        is_active: true,
                    })
                    .select()
                    .single();

                if (newOutlet) {
                    setOutlets([newOutlet]);
                    setActiveOutletState(newOutlet);
                }
            }
        } catch (err) {
            console.error('fetchOutlets error:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOutlets();
    }, [fetchOutlets]);

    const setActiveOutlet = useCallback((outlet) => {
        setActiveOutletState(outlet);
        if (user) {
            localStorage.setItem(`active_outlet_${user.id}`, outlet.id);
        }
    }, [user]);

    const createOutlet = useCallback(async ({ name, address, phone }) => {
        if (!user) return { error: 'Not authenticated' };
        const { data, error } = await supabase
            .from('outlets')
            .insert({ user_id: user.id, name, address, phone, is_active: true })
            .select()
            .single();

        if (!error && data) {
            setOutlets(prev => [...prev, data]);
        }
        return { data, error };
    }, [user]);

    const updateOutlet = useCallback(async (id, updates) => {
        const { data, error } = await supabase
            .from('outlets')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (!error && data) {
            setOutlets(prev => prev.map(o => o.id === id ? data : o));
            if (activeOutlet?.id === id) setActiveOutletState(data);
        }
        return { data, error };
    }, [user, activeOutlet]);

    const deleteOutlet = useCallback(async (id) => {
        if (outlets.length <= 1) return { error: 'Minimal 1 outlet harus ada' };

        const { error } = await supabase
            .from('outlets')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            const remaining = outlets.filter(o => o.id !== id);
            setOutlets(remaining);
            if (activeOutlet?.id === id) {
                setActiveOutlet(remaining[0]);
            }
        }
        return { error };
    }, [user, outlets, activeOutlet, setActiveOutlet]);

    const value = useMemo(() => ({
        outlets,
        activeOutlet,
        setActiveOutlet,
        createOutlet,
        updateOutlet,
        deleteOutlet,
        loading,
        canUseMultiOutlet,
        refreshOutlets: fetchOutlets
    }), [
        outlets,
        activeOutlet,
        setActiveOutlet,
        createOutlet,
        updateOutlet,
        deleteOutlet,
        loading,
        canUseMultiOutlet,
        fetchOutlets
    ]);

    return (
        <OutletContext.Provider value={value}>
            {children}
        </OutletContext.Provider>
    );
}

export function useOutlet() {
    return useContext(OutletContext);
}
