import { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function GuestBanner() {
    const { lang } = useLang();
    const [dismissed, setDismissed] = useState(
        () => sessionStorage.getItem('guest_banner_dismissed') === 'true'
    );

    const isGuest = localStorage.getItem('guest_mode') === 'true';
    if (!isGuest || dismissed) return null;

    const dismiss = () => {
        sessionStorage.setItem('guest_banner_dismissed', 'true');
        setDismissed(true);
    };

    const text = lang === 'ID'
        ? 'Anda masuk sebagai Guest. Login untuk simpan data permanen.'
        : 'You are in Guest mode. Login to save data permanently.';

    return (
        <div style={{
            background: '#FFFBEB',
            borderBottom: '1px solid #FCD34D',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            fontWeight: 600,
            color: '#92400E',
            flexShrink: 0,
            zIndex: 50,
        }}>
            {/* Amber dot */}
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B', flexShrink: 0, display: 'inline-block' }} />

            <span style={{ flex: 1 }}>{text}</span>

            {/* Login button (coming soon) */}
            <button
                disabled
                title="Coming soon"
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: '#F59E0B', color: 'white',
                    border: 'none', borderRadius: 8,
                    padding: '5px 12px', fontSize: 12, fontWeight: 700,
                    cursor: 'not-allowed', opacity: 0.7,
                }}
            >
                <LogIn size={13} />
                {lang === 'ID' ? 'Login' : 'Login'}
            </button>

            {/* Dismiss */}
            <button
                onClick={dismiss}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#92400E', padding: 4, display: 'flex', alignItems: 'center',
                    borderRadius: 4, opacity: 0.7,
                }}
                title="Dismiss"
            >
                <X size={15} />
            </button>
        </div>
    );
}
