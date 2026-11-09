import { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function PwaInstallBanner() {
    const { lang } = useLang();
    const isEn = lang === 'EN';

    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    });

    useEffect(() => {
        if (isInstalled) return;

        // Check dismissal cooldown (3 days)
        const dismissedUntil = localStorage.getItem('myinvoice_pwa_dismissed');
        if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
            return;
        }

        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        const handleAppInstalled = () => {
            setIsVisible(false);
            setDeferredPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        try {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsVisible(false);
            }
            setDeferredPrompt(null);
        } catch (err) {
            console.error('PWA install error:', err);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        // Dismiss for 3 days
        const expire = Date.now() + 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem('myinvoice_pwa_dismissed', String(expire));
    };

    if (!isVisible || isInstalled) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-fade-in-up">
            <div className="bg-zinc-950 text-white rounded-2xl p-4 shadow-2xl border border-zinc-800 flex items-center justify-between gap-3.5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shrink-0">
                        <Smartphone size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white tracking-wide">
                            {isEn ? "Install MyInvoice Kasir POS" : "Pasang Aplikasi Kasir (POS)"}
                        </p>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                            {isEn ? "Add to home screen for faster 1-tap offline cashier access." : "Akses instan di layar utama tanpa buka browser & siap offline."}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={handleInstallClick}
                        className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm shadow-violet-600/30"
                    >
                        <Download size={13} />
                        <span>{isEn ? "Install" : "Pasang"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleDismiss}
                        aria-label="Tutup"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
