import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Banner ini hanya tampil saat benar-benar dalam guest mode (belum login).
// Jika user sudah login, guest_mode dibersihkan dan banner hilang.
export default function GuestBanner() {
    const { user } = useAuth();

    // Jika user sudah login — bersihkan guest_mode dan jangan tampilkan apapun
    useEffect(() => {
        if (user) {
            localStorage.removeItem('guest_mode');
            sessionStorage.removeItem('guest_banner_dismissed');
        }
    }, [user]);

    // Sudah login → tidak perlu banner
    if (user) return null;

    // Belum login tapi bukan guest mode → tidak perlu banner
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    if (!isGuest) return null;

    return null; // Banner dihilangkan sesuai permintaan
}
