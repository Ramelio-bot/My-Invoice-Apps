import { useState } from 'react';
import { Check, Zap, Crown, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const FREE_FEATURES = [
    'Max 10 transaksi/hari',
    'Max 3 klien',
    'Max 4x download/bulan',
    'Watermark pada PDF',
    'Rekap 7 hari terakhir',
    'Laporan terkunci',
];

const PRO_FEATURES = [
    'Transaksi unlimited',
    'Klien unlimited',
    'Download PDF unlimited',
    'Tanpa watermark',
    'Laporan lengkap + export',
    'Template dokumen (7 pilihan)',
    'Hutang & Piutang unlimited',
    'Export Excel & CSV',
    'Priority support',
];

const PRICES = {
    monthly: {
        free: { label: 'Rp 0', sub: '/bulan', badge: null },
        pro: { label: 'Rp 99.000', sub: '/bulan', badge: null, annual: null },
        ultimate: { label: 'Rp 149.000', sub: '/bulan', badge: null, annual: null },
    },
    yearly: {
        free: { label: 'Rp 0', sub: '/bulan', badge: null },
        pro: { label: 'Rp 79.000', sub: '/bulan', badge: 'Hemat Rp 240.000!', annual: 'Rp 948.000/tahun' },
        ultimate: { label: 'Rp 119.000', sub: '/bulan', badge: 'Hemat Rp 360.000!', annual: 'Rp 1.428.000/tahun' },
    },
};

export default function Upgrade() {
    const { dark } = useTheme();
    const { isPro, activatePro } = usePlan();
    const { showToast } = useToast();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [billing, setBilling] = useState('monthly');

    const handleActivate = (e) => {
        e.preventDefault();
        const success = activatePro(code);
        if (success) {
            showToast('Selamat! Akun Anda telah diupgrade ke PRO!', 'success');
            setCode(''); setError('');
        } else {
            setError('Kode aktivasi tidak valid. Periksa kembali kode Anda.');
            showToast('Kode tidak valid', 'error');
        }
    };

    const text = dark ? '#F1F5F9' : '#1E293B';
    const sub = dark ? '#94A3B8' : '#64748B';
    const prices = PRICES[billing];

    const FeatureRow = ({ f, check, checkBg, checkColor }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: checkBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={11} color={checkColor} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 13, color: dark ? '#E2E8F0' : '#374151' }}>{f}</span>
        </div>
    );

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDE9FE', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
                    <Zap size={14} color="#7C3AED" fill="#7C3AED" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>Upgrade Plan</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', color: text, letterSpacing: '-0.5px' }}>
                    Pilih Plan yang Tepat
                </h1>
                <p style={{ margin: '0 0 24px', color: sub, fontSize: 16 }}>
                    Mulai gratis, upgrade kapanpun saat bisnis Anda berkembang.
                </p>

                {/* Billing Toggle */}
                <div style={{ display: 'inline-flex', alignItems: 'center', background: dark ? '#1E293B' : '#F1F5F9', borderRadius: 100, padding: 4, gap: 0 }}>
                    <button
                        onClick={() => setBilling('monthly')}
                        style={{
                            padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                            background: billing === 'monthly' ? 'white' : 'transparent',
                            color: billing === 'monthly' ? '#7C3AED' : sub,
                            fontWeight: 700, fontSize: 14,
                            boxShadow: billing === 'monthly' ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                            transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
                        }}
                    >
                        Bulanan
                    </button>
                    <button
                        onClick={() => setBilling('yearly')}
                        style={{
                            padding: '8px 20px', borderRadius: 100, border: 'none', cursor: 'pointer',
                            background: billing === 'yearly' ? '#7C3AED' : 'transparent',
                            color: billing === 'yearly' ? 'white' : sub,
                            fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
                            boxShadow: billing === 'yearly' ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
                            transition: 'all 250ms cubic-bezier(0.4,0,0.2,1)',
                        }}
                    >
                        Tahunan
                        <span style={{ background: billing === 'yearly' ? 'rgba(255,255,255,0.25)' : '#EDE9FE', color: billing === 'yearly' ? 'white' : '#7C3AED', borderRadius: 100, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
                            Hemat 20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
                {/* FREE */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #64748B' }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>Free</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 30, fontWeight: 900, color: text, transition: 'all 300ms' }}>{prices.free.label}</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>{prices.free.sub}</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {FREE_FEATURES.map(f => (
                            <FeatureRow key={f} f={f} checkBg="#F1F5F9" checkColor="#64748B" />
                        ))}
                    </div>
                    {!isPro && (
                        <div style={{ padding: '10px 16px', background: '#F1F5F9', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                            Plan Aktif
                        </div>
                    )}
                </div>

                {/* PRO */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #7C3AED', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -14, right: 20, background: '#7C3AED', color: 'white', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
                        POPULER
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>PRO</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, transition: 'all 300ms' }}>
                            <span style={{ fontSize: 30, fontWeight: 900, color: '#7C3AED', transition: 'all 300ms' }}>{prices.pro.label}</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>{prices.pro.sub}</span>
                        </div>
                        {prices.pro.annual && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{prices.pro.annual}</p>
                        )}
                        {prices.pro.badge && (
                            <span style={{ display: 'inline-block', marginTop: 6, background: '#ECFDF5', color: '#10B981', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
                                {prices.pro.badge}
                            </span>
                        )}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {PRO_FEATURES.map(f => (
                            <FeatureRow key={f} f={f} checkBg="#EDE9FE" checkColor="#7C3AED" />
                        ))}
                    </div>
                    {isPro ? (
                        <div style={{ padding: '10px 16px', background: '#EDE9FE', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>Plan Aktif</div>
                    ) : (
                        <button onClick={() => window.location.href = import.meta.env.VITE_MAYAR_PRO_PAYMENT_URL} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                            <Zap size={15} /> Pilih Plan Ini
                        </button>
                    )}
                </div>

                {/* ULTIMATE */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #F59E0B', position: 'relative', background: dark ? '#1E293B' : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: 1 }}>Ultimate</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 30, fontWeight: 900, color: '#D97706', transition: 'all 300ms' }}>{prices.ultimate.label}</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>{prices.ultimate.sub}</span>
                        </div>
                        {prices.ultimate.annual && (
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: sub }}>{prices.ultimate.annual}</p>
                        )}
                        {prices.ultimate.badge && (
                            <span style={{ display: 'inline-block', marginTop: 6, background: '#FEF3C7', color: '#D97706', borderRadius: 100, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>
                                {prices.ultimate.badge}
                            </span>
                        )}
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {[...PRO_FEATURES, 'Dedicated account manager', 'Custom domain invoice'].map(f => (
                            <FeatureRow key={f} f={f} checkBg="#FEF3C7" checkColor="#D97706" />
                        ))}
                    </div>
                    <button onClick={() => window.location.href = import.meta.env.VITE_MAYAR_ULTIMATE_PAYMENT_URL} className="btn btn-warning" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                        <Crown size={15} /> Pilih Ultimate
                    </button>
                </div>
            </div>

            {/* Activation Code */}
            <div className="card" style={{ animation: 'none', maxWidth: 480, margin: '0 auto' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: text }}>Punya Kode Aktivasi?</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                    Masukkan kode aktivasi PRO yang Anda terima setelah pembayaran.
                </p>
                <form onSubmit={handleActivate}>
                    <div className="form-group">
                        <label className="label">Kode Aktivasi</label>
                        <input
                            className="input"
                            value={code}
                            onChange={e => { setCode(e.target.value); setError(''); }}
                            placeholder="Contoh: MYINVOICE-PRO-XXXX"
                            style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 1 }}
                        />
                        {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#EF4444' }}>{error}</p>}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                        <Zap size={15} /> Aktifkan PRO
                    </button>
                </form>
                {isPro && (
                    <div style={{ marginTop: 20, padding: '12px 16px', background: '#ECFDF5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Check size={18} color="#10B981" strokeWidth={3} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>Akun PRO Aktif! Nikmati semua fitur tanpa batas.</span>
                    </div>
                )}
            </div>

            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94A3B8' }}>
                Untuk info pembelian, hubungi kami di support@myinvoice.space
            </p>
        </div>
    );
}
