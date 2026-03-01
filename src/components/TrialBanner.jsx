import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { X, AlertTriangle, Clock, Lock } from 'lucide-react';

export default function TrialBanner() {
    const { user, profile, effectivePlan, trialDaysLeft, loading } = useAuth();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);

    // Cek localStorage setelah user load
    useEffect(() => {
        if (user) {
            const isDismissed = localStorage.getItem(`trial_banner_dismissed_${user.id}`);
            setDismissed(isDismissed === 'true');
        }
    }, [user]);

    function handleDismiss() {
        if (user) {
            localStorage.setItem(`trial_banner_dismissed_${user.id}`, 'true');
            setDismissed(true);
        }
    }

    // Jika sedang loading auth atau tidak ada user, sembunyikan (kecuali kita juga peduli guest)
    // Banner ini spesifik untuk fitur PRO/FREE logged-in user, guest punya banner sendiri.
    if (loading || !user) return null;

    // Jika sudah PRO non-trial ATAU ULTIMATE, sembunyikan
    if (effectivePlan === 'pro' && (!profile?.trial_ends_at || trialDaysLeft <= 0)) return null;
    if (effectivePlan === 'ultimate') return null;

    // Logic untuk FREE
    if (effectivePlan === 'free') {
        return (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium text-center sm:text-left">
                    <Lock size={16} />
                    <span>Kamu pakai paket FREE. Fitur lebih terbatas.</span>
                </div>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm"
                >
                    Upgrade ke PRO &rarr;
                </button>
            </div>
        );
    }

    // Logic untuk PRO TRIAL
    if (effectivePlan === 'pro' && trialDaysLeft > 0) {
        if (trialDaysLeft > 7) {
            return null; // Sembunyikan kalau masih panjang
        }

        if (trialDaysLeft > 3) {
            // Kuning/Oranye - H-7 sampai H-4 - Bisa didismiss
            if (dismissed) return null;

            return (
                <div className="bg-orange-50 dark:bg-orange-900/30 border-b border-orange-200 dark:border-orange-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm relative">
                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-medium text-center sm:text-left">
                        <Clock size={16} />
                        <span>PRO Trial berakhir dalam {trialDaysLeft} hari!</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/upgrade')}
                            className="whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm"
                        >
                            Upgrade Sekarang &rarr;
                        </button>
                        <button onClick={handleDismiss} className="text-orange-400 hover:text-orange-600 transition p-1" title="Tutup">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            );
        }

        // Merah - H-3 ke bawah - Tidak bisa didismiss
        return (
            <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium text-center sm:text-left">
                    <AlertTriangle size={16} />
                    <span>🚨 Trial berakhir {trialDaysLeft} hari lagi! Segera upgrade.</span>
                </div>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-medium transition text-xs shadow-sm animate-pulse"
                >
                    Upgrade Sekarang &rarr;
                </button>
            </div>
        );
    }

    return null;
}
