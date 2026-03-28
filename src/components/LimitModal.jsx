import { Lock, Crown, Zap } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

/**
 * LimitModal — shows as an overlay popup when a FREE user hits a usage limit.
 * Props:
 *   plan     : 'PRO' | 'ULTIMATE'  (default 'PRO')
 *   feature  : display name of the feature (e.g. 'Clients')
 *   onClose  : callback to close the modal
 */
export default function LimitModal({ plan = 'PRO', feature, onClose }) {
    const { lang } = useLang();
    const navigate = useNavigate();

    const isUltimate = plan === 'ULTIMATE';
    const color = isUltimate ? '#7C3AED' : '#3B82F6';
    const bgSolid = isUltimate
        ? 'linear-gradient(135deg, #7C3AED, #5B21B6)'
        : 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
    const priceText = isUltimate ? 'Rp 149.000/bln' : 'Rp 129.000/bln';
    const badgeBg = isUltimate ? '#7C3AED22' : '#3B82F622';

    const title = t('limit_reached_title');
    const message = t('limit_reached_message').replace('{feature}', feature).replace('{plan}', plan);

    return (
        <div
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 16, animation: 'scaleIn 180ms cubic-bezier(0.4,0,0.2,1) forwards'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: 20, padding: '36px 32px',
                    maxWidth: 420, width: '100%', textAlign: 'center',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                    animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin'
                }}
            >
                {/* Lock icon */}
                <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: isUltimate ? '#EDE9FE' : '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <Lock size={36} color={color} />
                </div>

                {/* Plan badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 100, marginBottom: 14,
                    background: badgeBg, color: color, fontSize: 12,
                    fontWeight: 800, border: `1px solid ${color}44`
                }}>
                    {isUltimate ? <Crown size={12} /> : <Zap size={12} />}
                    {plan} PLAN
                </div>

                <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 900, color: '#1E293B' }}>
                    {title}
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>
                    {message}
                </p>

                {/* Pricing */}
                <div style={{
                    padding: '12px 16px', borderRadius: 12, marginBottom: 20,
                    background: isUltimate ? '#F5F3FF' : '#EFF6FF',
                    border: `1px solid ${color}33`, textAlign: 'left'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 900, color: color, fontSize: 16 }}>{plan}</span>
                        <span style={{ fontWeight: 700, color: '#1E293B', fontSize: 15 }}>
                            {priceText}
                        </span>
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                            t('limit_docs_unlimited'),
                            t('limit_clients_unlimited'),
                            t('limit_reports_complete'),
                        ].map(item => (
                            <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                                <span style={{ color: '#10B981', fontWeight: 700 }}>✓</span> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CTA */}
                <button
                    onClick={() => { onClose(); navigate('/upgrade'); }}
                    style={{
                        width: '100%', padding: '14px 24px', borderRadius: 12,
                        border: 'none', color: 'white', fontWeight: 800, fontSize: 15,
                        cursor: 'pointer', marginBottom: 10, background: bgSolid,
                        boxShadow: `0 8px 20px -4px ${color}66`,
                        transition: 'opacity 0.15s', fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
                    onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                    ⭐ {t('upgrade_to_plan').replace('{plan}', plan)} — {priceText}
                </button>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none', border: 'none', color: '#94A3B8',
                        fontWeight: 700, fontSize: 14, cursor: 'pointer',
                        padding: '8px 16px', borderRadius: 8, transition: 'color 0.15s',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}
                    onMouseOver={e => e.currentTarget.style.color = '#475569'}
                    onMouseOut={e => e.currentTarget.style.color = '#94A3B8'}
                >
                    ← {t('maybe_later')}
                </button>
            </div>
        </div>
    );
}
