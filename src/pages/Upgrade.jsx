import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, ToggleLeft, ToggleRight } from 'lucide-react';
import { usePlan } from '../context/PlanContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export default function Upgrade() {
    const navigate = useNavigate();
    const { dark } = useTheme();
    const { t, lang } = useLanguage();
    const { isPro, activatePro } = usePlan();
    const { showToast } = useToast();
    const { user, profile, refreshProfile, trialActive, trialDaysLeft, loading } = useAuth();

    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [billing, setBilling] = useState('monthly');
    const [activatingTrial, setActivatingTrial] = useState(false);

    // Dynamic translation for features
    const FREE_FEATURES = [
        t('upgrade_feat_free_1'),
        t('upgrade_feat_free_2'),
        t('upgrade_feat_free_3'),
        t('upgrade_feat_free_4'),
        t('upgrade_feat_free_5'),
        t('upgrade_feat_free_6'),
    ];

    const PRO_FEATURES = [
        t('upgrade_feat_pro_1'),
        t('upgrade_feat_pro_2'),
        t('upgrade_feat_pro_3'),
        t('upgrade_feat_pro_4'),
        t('upgrade_feat_pro_5'),
        t('upgrade_feat_pro_6'),
    ];

    const ULT_FEATURES = [
        t('upgrade_feat_ult_1'),
        t('upgrade_feat_ult_2'),
        t('upgrade_feat_ult_3'),
        t('upgrade_feat_ult_4'),
        t('upgrade_feat_ult_5'),
    ];

    const PRICES = {
        monthly: {
            free: { label: 'Rp 0', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: null },
            pro: { label: 'Rp 129.000', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: null, annual: null },
            ultimate: { label: 'Rp 149.000', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: null, annual: null },
        },
        yearly: {
            free: { label: 'Rp 0', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: null },
            pro: { label: 'Rp 103.200', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: t('upgrade_save_20'), annual: 'Rp 1.238.400/' + t('upgrade_yearly').toLowerCase() },
            ultimate: { label: 'Rp 119.200', sub: '/' + t('upgrade_monthly').toLowerCase(), badge: t('upgrade_save_20'), annual: 'Rp 1.430.400/' + t('upgrade_yearly').toLowerCase() },
        },
    };

    const text = dark ? '#F1F5F9' : '#1E293B';
    const sub = dark ? '#94A3B8' : '#64748B';
    const prices = PRICES[billing];

    const [loadTimeout, setLoadTimeout] = useState(false);
    useEffect(() => {
        if (loading || !profile) {
            const timer = setTimeout(() => setLoadTimeout(true), 5000);
            return () => clearTimeout(timer);
        } else {
            setLoadTimeout(false);
        }
    }, [loading, profile]);

    if (loading || !profile) {
        return (
            <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 20, textAlign: 'center' }}>
                {!loadTimeout ? (
                    <>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                        <span className="text-slate-500 font-medium">{t('loading')}</span>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>⏳</div>
                        <h3 style={{ fontWeight: 800, color: text }}>Gagal memuat profil / Failed to load profile</h3>
                        <p style={{ color: sub, maxWidth: 350, margin: '0 auto 20px', fontSize: 14 }}>
                            Koneksi mungkin lambat atau sesi Anda berakhir. Silakan coba segarkan halaman.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                        >
                            {lang === 'ID' ? 'Segarkan Halaman' : 'Refresh Page'}
                        </button>
                    </>
                )}
            </div>
        );
    }

    const handleStartTrial = async () => {
        setActivatingTrial(true);
        try {
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    plan: 'free',
                    trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('id', user.id);

            if (dbError) throw dbError;
            await refreshProfile();
            showToast(t('upgrade_success'), 'success');
            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            showToast('Gagal mengaktifkan Trial.', 'error');
        } finally {
            setActivatingTrial(false);
        }
    };


    const handleActivate = (e) => {
        e.preventDefault();
        const success = activatePro(code);
        if (success) {
            showToast(t('upgrade_success'), 'success');
            setCode(''); setError('');
        } else {
            setError(lang === 'ID' ? 'Kode aktivasi tidak valid.' : 'Invalid activation code.');
            showToast('Invalid Code', 'error');
        }
    };

    const FeatureRow = ({ f }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dark ? '#CBD5E1' : '#64748B', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: dark ? '#E2E8F0' : '#374151' }}>{f}</span>
        </div>
    );

    return (
        <div className="page-enter" style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EDE9FE', borderRadius: 100, padding: '6px 16px', marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{t('nav_upgrade')}</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 12px', color: text, letterSpacing: '-0.5px' }}>
                    {t('upgrade_title')}
                </h1>
                <p style={{ margin: '0 0 24px', color: sub, fontSize: 16 }}>
                    {t('upgrade_subtitle')}
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
                        {t('upgrade_monthly')}
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
                        {t('upgrade_yearly')}
                        <span style={{ background: billing === 'yearly' ? 'rgba(255,255,255,0.25)' : '#EDE9FE', color: billing === 'yearly' ? 'white' : '#7C3AED', borderRadius: 100, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
                            {t('upgrade_save_20')}
                        </span>
                    </button>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
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
                    {(!isPro && profile?.plan === 'free' && profile?.trial_ends_at === null) && (
                        <button
                            onClick={handleStartTrial}
                            disabled={activatingTrial}
                            className="btn"
                            style={{ width: '100%', justifyContent: 'center', padding: '10px', background: 'transparent', border: '1.5px solid #7C3AED', color: '#7C3AED', fontWeight: 600, fontSize: 13, transition: 'all 200ms', cursor: activatingTrial ? 'not-allowed' : 'pointer', marginBottom: 12 }}
                        >
                            {activatingTrial ? t('loading') : `${t('upgrade_choose_plan')} (14 ${t('upgrade_trial_left')})`}
                        </button>
                    )}
                    {(!isPro && (!profile || (profile.plan === 'free' && profile.trial_ends_at !== null))) && (
                        <div style={{ padding: '10px 16px', background: '#F1F5F9', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span>{t('upgrade_current_plan')}</span>
                            {trialActive && <span style={{ fontSize: 11, color: '#D97706' }}>{t('upgrade_trial_left')}: {trialDaysLeft} {t('upgrade_trial_left')}</span>}
                        </div>
                    )}
                </div>

                {/* PRO */}
                <div className="card" style={{ animation: 'none', borderTop: '3px solid #7C3AED', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: -14, right: 20, background: '#7C3AED', color: 'white', borderRadius: 100, padding: '4px 12px', fontSize: 11, fontWeight: 800, letterSpacing: 0.5 }}>
                        {t('upgrade_popular')}
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
                        <div style={{ padding: '10px 16px', background: '#EDE9FE', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{t('upgrade_current_plan')}</div>
                    ) : (
                        <button 
                            onClick={() => {
                                const url = billing === 'yearly' 
                                    ? 'https://my-invoice.myr.id/pl/myinvoice-pro-annual-plan-12-bulan'
                                    : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan';
                                window.location.href = url;
                            }} 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                        >
                            {t('upgrade_choose_plan')}
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
                        {ULT_FEATURES.map(f => (
                            <FeatureRow key={f} f={f} checkBg="#FEF3C7" checkColor="#D97706" />
                        ))}
                    </div>
                    <button 
                        onClick={() => {
                            const url = billing === 'yearly'
                                ? 'https://my-invoice.myr.id/pl/myinvoice-ultimate-annual-plan-12-bulan'
                                : 'https://my-invoice.myr.id/pl/my-invoice-pro-bulanan-7spr';
                            window.location.href = url;
                        }} 
                        className="btn btn-warning" 
                        style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                    >
                        {t('upgrade_choose_plan')}
                    </button>
                </div>
            </div>

            {/* Activation Code */}
            <div className="card" style={{ animation: 'none', maxWidth: 480, margin: '0 auto' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: text }}>{t('upgrade_code_title')}</h2>
                <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                    {t('upgrade_code_desc')}
                </p>
                <form onSubmit={handleActivate}>
                    <div className="form-group">
                        <label className="label">{t('upgrade_activate_btn')}</label>
                        <input
                            className="input"
                            value={code}
                            onChange={e => { setCode(e.target.value); setError(''); }}
                            placeholder={t('upgrade_code_placeholder')}
                            style={{ fontFamily: 'monospace', fontSize: 14, letterSpacing: 1 }}
                        />
                        {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#EF4444' }}>{error}</p>}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                        {t('upgrade_activate_btn')}
                    </button>
                </form>
                {isPro && (
                    <div style={{ marginTop: 20, padding: '12px 16px', background: '#ECFDF5', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Check size={18} color="#10B981" strokeWidth={3} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#059669' }}>{t('upgrade_success')}</span>
                    </div>
                )}
            </div>

            <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94A3B8' }}>
                {t('upgrade_contact')} support@myinvoice.space
            </p>
        </div>
    );
}
