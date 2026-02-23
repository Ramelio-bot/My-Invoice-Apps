import { useState } from 'react';
import { Check, Zap, Crown } from 'lucide-react';
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
    'Semua fitur tanpa batas',
    'Priority support',
];

export default function Upgrade() {
    const { dark } = useTheme();
    const { isPro, activatePro } = usePlan();
    const { showToast } = useToast();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');

    const handleActivate = (e) => {
        e.preventDefault();
        const success = activatePro(code);
        if (success) {
            showToast('Selamat! Akun Anda telah diupgrade ke PRO!', 'success');
            setCode('');
            setError('');
        } else {
            setError('Kode aktivasi tidak valid. Periksa kembali kode Anda.');
            showToast('Kode tidak valid', 'error');
        }
    };

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDE9FE', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
                    <Zap size={14} color="#7C3AED" fill="#7C3AED" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>Upgrade Plan</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', color: dark ? '#F1F5F9' : '#1E293B', letterSpacing: '-0.5px' }}>
                    Pilih Plan yang Tepat
                </h1>
                <p style={{ margin: 0, color: '#64748B', fontSize: 16 }}>
                    Mulai gratis, upgrade kapanpun saat bisnis Anda berkembang.
                </p>
            </div>

            {/* Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
                {/* FREE */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #64748B' }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 1 }}>Free</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: dark ? '#F1F5F9' : '#1E293B' }}>Rp 0</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>/bulan</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {FREE_FEATURES.map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check size={11} color="#64748B" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 13, color: '#64748B' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                    {!isPro ? (
                        <div style={{ padding: '10px 16px', background: '#F1F5F9', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                            Plan Aktif
                        </div>
                    ) : null}
                </div>

                {/* PRO Monthly */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #7C3AED', position: 'relative' }}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: 1 }}>PRO Bulanan</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: '#7C3AED' }}>Rp 99.000</span>
                            <span style={{ fontSize: 13, color: '#94A3B8' }}>/bulan</span>
                        </div>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {PRO_FEATURES.map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check size={11} color="#7C3AED" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 13, color: dark ? '#E2E8F0' : '#374151' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                    {isPro ? (
                        <div style={{ padding: '10px 16px', background: '#EDE9FE', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                            Plan Aktif
                        </div>
                    ) : (
                        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                            <Zap size={15} /> Pilih Plan Ini
                        </button>
                    )}
                </div>

                {/* PRO 6 Months */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #F59E0B', position: 'relative', background: dark ? '#1E293B' : 'linear-gradient(135deg, #FFFBEB, #FEF3C7)' }}>
                    {/* POPULER badge */}
                    <div style={{ position: 'absolute', top: -14, right: 20, background: '#F59E0B', color: 'white', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
                        POPULER
                    </div>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: 1 }}>PRO 6 Bulan</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: '#D97706' }}>Rp 449.000</span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748B' }}>Hemat Rp 145.000 vs bulanan!</p>
                    </div>
                    <div style={{ marginBottom: 24 }}>
                        {PRO_FEATURES.map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Check size={11} color="#D97706" strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: 13, color: dark ? '#E2E8F0' : '#374151' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                    {isPro ? (
                        <div style={{ padding: '10px 16px', background: '#FEF3C7', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#D97706' }}>
                            Plan Aktif
                        </div>
                    ) : (
                        <button className="btn btn-warning" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                            <Crown size={15} /> Pilih Hemat Ini!
                        </button>
                    )}
                </div>
            </div>

            {/* Activation Code */}
            <div className="card" style={{ animation: 'none', maxWidth: 480, margin: '0 auto' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: dark ? '#F1F5F9' : '#1E293B' }}>Punya Kode Aktivasi?</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748B' }}>
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

            {/* Footer note */}
            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94A3B8' }}>
                Untuk info pembelian, hubungi kami di support@myinvoice.space
            </p>
        </div>
    );
}
