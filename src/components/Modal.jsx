import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Modal({ open, onClose, title, children, maxWidth = 520 }) {
    const { dark } = useTheme();

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const bg = dark ? '#1E293B' : 'white';
    const border = dark ? '#334155' : '#E2E8F0';
    const textPrimary = dark ? '#F1F5F9' : '#1E293B';
    const btnBg = dark ? '#334155' : '#F1F5F9';
    const btnColor = dark ? '#94A3B8' : '#64748B';

    return (
        /* Backdrop — fixed overlay, flex centered */
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(15,23,42,0.65)',
                backdropFilter: 'blur(4px)',
                zIndex: 99999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '72px 16px 24px', /* top: below fixed navbar */
            }}
        >
            {/* Modal box — fills up to 95% of the remaining height */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: maxWidth,
                    /* Stretch tall: use up to 95% of space between navbar bottom and screen bottom */
                    maxHeight: 'calc(100vh - 96px)',
                    background: bg,
                    borderRadius: 16,
                    boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
                    animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden', /* clips children, inner area scrolls */
                }}
            >
                {/* Sticky header — never scrolls away */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '18px 24px',
                    borderBottom: `1px solid ${border}`,
                    background: bg,
                    borderRadius: '16px 16px 0 0',
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textPrimary }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: btnBg, border: 'none', cursor: 'pointer',
                            color: btnColor, borderRadius: 8, padding: 8,
                            display: 'flex', alignItems: 'center', transition: 'all 150ms',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable content — grows to fill space, scrolls if overflow */}
                <div style={{
                    padding: '20px 24px 24px',
                    overflowY: 'auto',
                    flex: 1,
                    /* custom scrollbar */
                    scrollbarWidth: 'thin',
                    scrollbarColor: dark ? '#334155 transparent' : '#CBD5E1 transparent',
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
