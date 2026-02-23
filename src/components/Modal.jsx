import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, maxWidth = 520 }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div
            className="modal-backdrop"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="modal-content"
                style={{ maxWidth }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px 0',
                }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#64748B', borderRadius: 8, padding: 4,
                            display: 'flex', alignItems: 'center',
                            transition: 'all 200ms',
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
                {/* Content */}
                <div style={{ padding: '16px 24px 24px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
