import { useState } from 'react';
import { Store, ChevronDown, Check, Plus, Lock } from 'lucide-react';
import { useOutlet } from '../../context/OutletContext';
import { useLang } from '../../context/LanguageContext';

export default function OutletSwitcher({ onManage }) {
    const { outlets, activeOutlet, setActiveOutlet, canUseMultiOutlet } = useOutlet();
    const { lang } = useLang();
    const [open, setOpen] = useState(false);

    if (!activeOutlet) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button 
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: '#F1F5F9',
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    color: '#0F172A',
                    fontSize: 13,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                }}
            >
                <Store size={16} color="#7C3AED" />
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {activeOutlet.name}
                </span>
                <ChevronDown size={14} style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                    minWidth: 220,
                    background: 'white',
                    border: '1px solid',
                    borderColor: '#E2E8F0',
                    borderRadius: 14,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    zIndex: 200,
                    overflow: 'hidden',
                    // Ganti animasi library dengan CSS transition sederhana:
                    opacity: 1,
                    transform: 'translateY(0)',
                    transition: 'opacity 150ms ease, transform 150ms ease',
                }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid', borderColor: '#F1F5F9', marginBottom: 4 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {t('outlet_select_title')}
                        </div>
                    </div>

                    <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                        {outlets.filter(o => o.is_active).map(outlet => (
                            <button key={outlet.id} onClick={() => { setActiveOutlet(outlet); setOpen(false); }}
                                style={{
                                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 12px', borderRadius: 8, border: 'none',
                                    background: activeOutlet.id === outlet.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                                    cursor: 'pointer', fontFamily: 'inherit',
                                    color: '#0F172A',
                                    textAlign: 'left', fontSize: 13, fontWeight: 500,
                                    transition: 'background 0.15s',
                                }}>
                                <Store size={14} style={{ opacity: activeOutlet.id === outlet.id ? 1 : 0.4 }} />
                                {outlet.name}
                                {activeOutlet.id === outlet.id && <Check size={14} style={{ marginLeft: 'auto', color: '#7C3AED' }} />}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid', borderColor: '#F1F5F9' }}>
                        {canUseMultiOutlet ? (
                            <button onClick={() => { onManage?.(); setOpen(false); }}
                                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: '#7C3AED', fontSize: 13, fontWeight: 600 }}>
                                <Plus size={16} />
                                {t('kasir_manage_outlets')}
                            </button>
                        ) : (
                            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', color: '#94A3B8', fontSize: 11, fontWeight: 500 }}>
                                <Lock size={12} />
                                {t('outlet_ultimate_limit')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {open && <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />}
        </div>
    );
}
