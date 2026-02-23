import { useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { useCompanyLogo } from '../hooks/useCompanyLogo';

/**
 * Shared company logo upload button.
 * One logo stored in localStorage — shared across all documents.
 * 
 * Props:
 *   size?: 'sm' | 'md' (default 'md')
 */
export default function LogoUpload({ size = 'md' }) {
    const { logo, setLogo, clearLogo } = useCompanyLogo();
    const inputRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setLogo(ev.target.result);
        reader.readAsDataURL(file);
        // reset input so same file can be re-selected
        e.target.value = '';
    };

    const isSmall = size === 'sm';

    if (logo) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <img
                    src={logo}
                    alt="Company Logo"
                    style={{
                        maxHeight: isSmall ? 48 : 72,
                        maxWidth: isSmall ? 120 : 180,
                        objectFit: 'contain',
                        borderRadius: 6,
                    }}
                />
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    style={{
                        fontSize: 11,
                        color: '#7C3AED',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        borderRadius: 4,
                        textDecoration: 'underline',
                        fontWeight: 600,
                    }}
                >
                    Ganti Logo
                </button>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                />
            </div>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: isSmall ? 110 : 150,
                    height: isSmall ? 56 : 76,
                    border: '2px dashed #CBD5E1',
                    borderRadius: 10,
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    transition: 'border-color 150ms, color 150ms',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#7C3AED';
                    e.currentTarget.style.color = '#7C3AED';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.color = '#94A3B8';
                }}
            >
                <ImageIcon size={isSmall ? 16 : 20} />
                <span style={{ fontSize: isSmall ? 10 : 11, fontWeight: 600, whiteSpace: 'nowrap' }}>Upload Logo</span>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                style={{ display: 'none' }}
                onChange={handleFile}
            />
        </div>
    );
}
