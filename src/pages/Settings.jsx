import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Settings2, Hash, Save, RotateCcw, MessageCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useDocSettings } from '../hooks/useDocSettings';

import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Receipt, Ticket, Plus, Trash2, Power, PowerOff, Gift } from 'lucide-react';
import UpgradePrompt from '../components/UpgradePrompt';

const DOC_KEYS = (t) => [
    { key: 'inv', label: t('doc_type_inv') },
    { key: 'kwt', label: t('doc_type_kwt') },
    { key: 'tt', label: t('doc_type_tt') },
    { key: 'sph', label: t('doc_type_sph') },
    { key: 'po', label: t('doc_type_po') },
];
const SectionCard = ({ title, icon: Icon, children, card, bd, text }) => (
    <div style={{ background: card, borderRadius: 16, padding: 24, marginBottom: 20, border: `1px solid ${bd}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="#7C3AED" />
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: text }}>{title}</h3>
        </div>
        {children}
    </div>
);

export default function Settings() {
    const { dark } = useTheme();
    const { t } = useLang();
    const { showToast } = useToast();
    const { settings, setSettings, DEFAULTS } = useDocSettings();
    const { profile, setProfile } = useCompanyProfile();
    const { effectivePlan, isAdmin, user, profile: authProfile } = useAuth();
    const isUltimate = effectivePlan === 'ultimate' || isAdmin;
    const canAccessTelegram = isUltimate;
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    // Voucher Management States
    const [vouchers, setVouchers] = useState([]);
    const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
    const [voucherForm, setVoucherForm] = useState({
        code: '',
        discount_type: 'persen',
        discount_value: '',
        valid_until: '',
        max_uses: '',
        min_purchase: ''
    });

    // Telegram Integration States
    const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
    const [telegramAuthCode, setTelegramAuthCode] = useState(null);
    const [telegramCountdown, setTelegramCountdown] = useState(300);
    const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
    const countdownInterval = useRef(null);

    // Local editable states
    const [docSettings, setDocSettings] = useState({ ...DEFAULTS, ...settings });
    const [companyForm, setCompanyForm] = useState({
        name: authProfile?.store_name || authProfile?.full_name || authProfile?.name || profile?.name || '', 
        address: authProfile?.store_address || authProfile?.address || profile?.address || '',
        phone: authProfile?.store_phone || authProfile?.phone || profile?.phone || '', 
        email: authProfile?.email || profile?.email || '', 
        website: authProfile?.website || profile?.website || '',
        store_name: authProfile?.store_name || profile?.store_name || '', 
        store_address: authProfile?.store_address || profile?.store_address || '',
        store_phone: authProfile?.store_phone || profile?.store_phone || '', 
        store_footer: authProfile?.store_footer || profile?.store_footer || '',
        store_logo_url: authProfile?.company_logo || authProfile?.store_logo_url || profile?.store_logo_url || '',
        loyalty_enabled: authProfile?.loyalty_enabled ?? profile?.loyalty_enabled ?? false,
        points_per_amount: authProfile?.points_per_amount || profile?.points_per_amount || 1000,
        points_value: authProfile?.points_value || profile?.points_value || 10
    });

    useEffect(() => {
        if (authProfile) {
            setCompanyForm(prev => ({
                ...prev,
                name: authProfile.store_name || authProfile.full_name || authProfile.name || prev.name,
                address: authProfile.store_address || authProfile.address || prev.address,
                phone: authProfile.store_phone || authProfile.phone || prev.phone,
                email: authProfile.email || prev.email,
                website: authProfile.website || prev.website,
                store_name: authProfile.store_name || prev.store_name,
                store_address: authProfile.store_address || prev.store_address,
                store_phone: authProfile.store_phone || prev.store_phone,
                store_footer: authProfile.store_footer || prev.store_footer,
                store_logo_url: authProfile.company_logo || authProfile.store_logo_url || prev.store_logo_url,
                loyalty_enabled: authProfile.loyalty_enabled ?? prev.loyalty_enabled,
                points_per_amount: authProfile.points_per_amount || prev.points_per_amount,
                points_value: authProfile.points_value || prev.points_value,
            }));
        }
    }, [authProfile]);

    const saveAll = async () => {
        setSettings(docSettings);
        setProfile({ ...profile, ...companyForm });

        // Update Supabase profiles table
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    store_name: companyForm.store_name || companyForm.name,
                    store_address: companyForm.store_address || companyForm.address,
                    store_phone: companyForm.store_phone || companyForm.phone,
                    store_footer: companyForm.store_footer,
                    company_logo: companyForm.store_logo_url,
                    full_name: companyForm.name || companyForm.store_name
                })
                .eq('id', user.id);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to save store profile to Supabase', err);
            showToast(t('settings_toast_db_fail'), 'error');
            return;
        }

        showToast(t('settings_toast_saved'), 'success');
    };

    const resetDoc = () => { setDocSettings({ ...DEFAULTS }); };

    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';
    const card = dark ? '#1E293B' : 'white';
    const bd = dark ? '#334155' : '#E2E8F0';
    const bg2 = dark ? '#0F172A' : '#F8FAFC';

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validasi ukuran 200KB
        if (file.size > 200 * 1024) {
            showToast(t('settings_toast_logo_size'), 'error');
            return;
        }

        setIsUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `store_${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('company-logos').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(filePath);
            setCompanyForm(prev => ({ ...prev, store_logo_url: publicUrl }));
            showToast(t('settings_toast_logo_ok'), 'success');
        } catch (err) {
            console.error(err);
            const errMsg = (err.message || err.error || err.code || '').toString().toLowerCase();
            if (errMsg.includes('bucket not found') || errMsg.includes('404')) {
                showToast(t('settings_toast_logo_bucket_fail'), 'error');
            } else if (errMsg.includes('security policy') || errMsg.includes('permission denied') || errMsg.includes('403')) {
                showToast(t('settings_toast_logo_rls_fail'), 'error');
            } else {
                showToast(t('settings_toast_logo_fail'), 'error');
            }
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const fetchVouchers = useCallback(async () => {
        setIsLoadingVouchers(true);
        try {
            const { data, error } = await supabase
                .from('kasir_vouchers')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVouchers(data || []);
        } catch (err) {
            console.error('Failed to fetch vouchers', err);
        } finally {
            setIsLoadingVouchers(false);
        }
    }, [user.id]);

    useEffect(() => {
        if (effectivePlan === 'ultimate' || effectivePlan === 'pro' || isAdmin) {
            fetchVouchers();
        }
    }, [effectivePlan, isAdmin, user.id, fetchVouchers]);

    const handleAddVoucher = async () => {
        if (!voucherForm.code || !voucherForm.discount_value || !voucherForm.valid_until) {
            showToast(t('settings_toast_voucher_fill'), 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('kasir_vouchers')
                .insert({
                    user_id: user.id,
                    code: voucherForm.code.toUpperCase().replace(/\s/g, ''),
                    discount_type: voucherForm.discount_type,
                    discount_value: Math.abs(parseFloat(voucherForm.discount_value)),
                    valid_until: new Date(voucherForm.valid_until).toISOString(),
                    max_uses: voucherForm.max_uses ? Math.abs(parseInt(voucherForm.max_uses)) : 0,
                    min_purchase: voucherForm.min_purchase ? Math.abs(parseFloat(voucherForm.min_purchase)) : 0,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    showToast(t('settings_toast_voucher_dup'), 'error');
                } else {
                    throw error;
                }
                return;
            }

            setVoucherForm({
                code: '', discount_type: 'persen', discount_value: '', valid_until: '', max_uses: '', min_purchase: ''
            });
            showToast(t('settings_toast_voucher_ok'), 'success');
        } catch (err) {
            console.error('Failed to add voucher', err);
            showToast(t('settings_toast_voucher_fail'), 'error');
        }
    };

    const handleToggleVoucher = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('kasir_vouchers')
                .update({ is_active: !currentStatus })
                .eq('id', id)
                .eq('user_id', user.id); // [FIX F4-1C] — Defense-in-depth: pastikan hanya voucher milik user ini

            if (error) throw error;
            setVouchers(vouchers.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
        } catch (err) {
            console.error('Failed to toggle active status', err);
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!window.confirm(t('settings_delete_voucher_conf'))) return;
        try {
            const { error } = await supabase
                .from('kasir_vouchers')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id); // [FIX F4-1C] — Defense-in-depth: pastikan hanya voucher milik user ini

            if (error) throw error;
            setVouchers(vouchers.filter(v => v.id !== id));
            showToast(t('settings_toast_voucher_del'), 'success');
        } catch (err) {
            console.error('Failed to delete voucher', err);
        }
    };

    // Telegram Logic
    const closeTelegramModal = () => {
        setIsTelegramModalOpen(false);
        if (countdownInterval.current) clearInterval(countdownInterval.current);
        setTelegramAuthCode(null);
    };

    const generateTelegramCode = async () => {
        setIsLoadingTelegram(true);
        try {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            
            const { error } = await supabase
                .from('telegram_auth_codes')
                .insert({
                    user_id: user.id,
                    code: code,
                    expires_at: expiresAt
                });

            if (error) throw error;

            setTelegramAuthCode(code);
            setTelegramCountdown(300);
            setIsTelegramModalOpen(true);
            showToast("Kode verifikasi Telegram telah dibuat. Gunakan dalam 5 menit.", "success");

            if (countdownInterval.current) clearInterval(countdownInterval.current);
            countdownInterval.current = setInterval(() => {
                setTelegramCountdown(prev => {
                    if (prev <= 1) {
                        closeTelegramModal();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (err) {
            console.error('Failed to generate Telegram code', err);
            showToast("Gagal membuat kode. Coba lagi.", "error");
        } finally {
            setIsLoadingTelegram(false);
        }
    };

    useEffect(() => {
        return () => {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
        };
    }, []);

    // Build preview for a given key using current local state
    const buildPreview = (key) => {
        const s = docSettings;
        const prefix = s[`${key}_prefix`] || key.toUpperCase();
        const sep = s.separator || '/';
        const now = new Date();
        const year = String(now.getFullYear());
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const num = String(s.start_num ?? 1).padStart(3, '0');
        const parts = [prefix];
        if (s.include_year) parts.push(year);
        if (s.include_month) parts.push(month);
        parts.push(num);
        return parts.join(sep);
    };

    return (
        <div className="page-enter" style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto', paddingBottom: 'calc(env(safe-area-inset-bottom, 1rem) + 1.5rem)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: text }}>
                        {t('settings_title')}
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: sub }}>
                        {t('settings_subtitle')}
                    </p>
                </div>
                <button onClick={saveAll} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: '44px' }}>
                    <Save size={16} /> {t('settings_save_all')}
                </button>
            </div>

            {/* Company Profile */}
            <SectionCard title={t('settings_company_profile')} icon={Settings2} card={card} bd={bd} text={text}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    {[
                        { key: 'name', label: t('settings_comp_name') },
                        { key: 'address', label: t('settings_comp_address') },
                        { key: 'phone', label: t('settings_comp_phone') },
                        { key: 'email', label: t('inv_email') },
                        { key: 'website', label: t('inv_website') },
                    ].map(f => (
                        <div key={f.key} className="form-group" style={{ margin: 0 }}>
                            <label className="label">{f.label}</label>
                            <input className="input" value={companyForm[f.key]} onChange={e => setCompanyForm(v => ({ ...v, [f.key]: e.target.value }))} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Document Number Format */}
            <SectionCard title={t('settings_doc_format')} icon={Hash} card={card} bd={bd} text={text}>
                {/* Global settings */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20, padding: '16px', background: bg2, borderRadius: 12 }}>
                    {/* Separator */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{t('settings_separator')}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['/', '-'].map(sep => (
                                <button key={sep} onClick={() => setDocSettings(s => ({ ...s, separator: sep }))}
                                    style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${docSettings.separator === sep ? '#7C3AED' : bd}`, background: docSettings.separator === sep ? '#EDE9FE' : 'transparent', color: docSettings.separator === sep ? '#7C3AED' : sub, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                                    {sep}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Include year */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{t('settings_include_year')}</p>
                        <button onClick={() => setDocSettings(s => ({ ...s, include_year: !s.include_year }))}
                            style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${docSettings.include_year ? '#7C3AED' : bd}`, background: docSettings.include_year ? '#EDE9FE' : 'transparent', color: docSettings.include_year ? '#7C3AED' : sub, fontWeight: 700, cursor: 'pointer' }}>
                            {docSettings.include_year ? t('yes') : t('no')}
                        </button>
                    </div>
                    {/* Include month */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{t('settings_include_month')}</p>
                        <button onClick={() => setDocSettings(s => ({ ...s, include_month: !s.include_month }))}
                            style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${docSettings.include_month ? '#7C3AED' : bd}`, background: docSettings.include_month ? '#EDE9FE' : 'transparent', color: docSettings.include_month ? '#7C3AED' : sub, fontWeight: 700, cursor: 'pointer' }}>
                            {docSettings.include_month ? t('yes') : t('no')}
                        </button>
                    </div>
                    {/* Start number */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{t('settings_start_num')}</p>
                        <input type="number" min={1} className="input" value={docSettings.start_num ?? 1}
                            onChange={e => setDocSettings(s => ({ ...s, start_num: parseInt(e.target.value) || 1 }))}
                            style={{ width: 100 }} />
                    </div>
                </div>

                {/* Per-document prefix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {DOC_KEYS(t).map(d => (
                        <div key={d.key} style={{ padding: 14, background: bg2, borderRadius: 10 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: sub }}>{d.label}</p>
                            <input className="input" value={docSettings[`${d.key}_prefix`]}
                                onChange={e => setDocSettings(s => ({ ...s, [`${d.key}_prefix`]: e.target.value.toUpperCase() }))}
                                style={{ marginBottom: 6, fontSize: 13 }} />
                            <p style={{ margin: 0, fontSize: 11, color: '#7C3AED', fontWeight: 700, fontFamily: 'monospace' }}>
                                {buildPreview(d.key)}
                            </p>
                        </div>
                    ))}
                </div>

                <button onClick={resetDoc} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 13, fontWeight: 600 }}>
                    <RotateCcw size={13} /> {t('settings_reset_defaults')}
                </button>
            </SectionCard>

            {/* Receipt Customization (ULTIMATE feature) */}
            {(effectivePlan === 'ultimate' || isAdmin) && (
                <SectionCard title={t('settings_receipt_custom')} icon={Receipt} card={card} bd={bd} text={text}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                        {t('settings_receipt_desc')}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="label">{t('settings_store_name')}</label>
                            <input className="input" placeholder={t('settings_store_name')} value={companyForm.store_name} onChange={e => setCompanyForm(v => ({ ...v, store_name: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="label">{t('settings_comp_phone')}</label>
                            <input className="input" placeholder="08..." value={companyForm.store_phone} onChange={e => setCompanyForm(v => ({ ...v, store_phone: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{t('settings_store_address')}</label>
                            <input className="input" placeholder={t('form_address')} value={companyForm.store_address} onChange={e => setCompanyForm(v => ({ ...v, store_address: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{t('settings_footer_msg')}</label>
                            <input className="input" placeholder={t('settings_footer_msg')} value={companyForm.store_footer} onChange={e => setCompanyForm(v => ({ ...v, store_footer: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{t('settings_store_logo')}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {companyForm.store_logo_url && (
                                    <img src={companyForm.store_logo_url} alt="Store Logo" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8, border: `1px solid ${bd}`, background: bg2 }} />
                                )}
                                <div>
                                    <input type="file" accept="image/*" id="store-logo-upload" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                    <label htmlFor="store-logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '8px 16px', fontSize: 13, background: bg2, border: `1px solid ${bd}`, color: text, borderRadius: 8 }}>
                                        {isUploadingLogo ? t('settings_uploading') : t('settings_choose_logo')}
                                    </label>
                                    {companyForm.store_logo_url && (
                                        <button onClick={() => setCompanyForm(prev => ({ ...prev, store_logo_url: null }))} style={{ marginLeft: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13, fontWeight: 600 }}>
                                            {t('doc_delete')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Voucher Management (PRO/ULTIMATE) */}
            {(effectivePlan === 'ultimate' || effectivePlan === 'pro' || isAdmin) && (
                <SectionCard title={t('settings_voucher_mgmt')} icon={Ticket} card={card} bd={bd} text={text}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                        {t('settings_voucher_desc')}
                    </p>
                    
                    {/* Add Voucher Form */}
                    <div style={{ padding: 16, background: bg2, border: `1px solid ${bd}`, borderRadius: 12, marginBottom: 20 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: text }}>
                            {t('settings_add_voucher')}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                            <div style={{ flex: '1 1 150px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_code')}</label>
                                <input className="input" placeholder="PROMO2026" value={voucherForm.code} onChange={e => setVoucherForm(v => ({...v, code: e.target.value.toUpperCase()}))} style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div style={{ width: 90 }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_type')}</label>
                                <select className="input" value={voucherForm.discount_type} onChange={e => setVoucherForm(v => ({...v, discount_type: e.target.value}))}>
                                    <option value="persen">{t('settings_voucher_type_percent')}</option>
                                    <option value="nominal">{t('settings_voucher_type_nominal')}</option>
                                </select>
                            </div>
                            <div style={{ flex: '1 1 100px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_val')}</label>
                                <input type="number" className="input" placeholder={voucherForm.discount_type === 'persen' ? '15' : '10000'} value={voucherForm.discount_value} onChange={e => setVoucherForm(v => ({...v, discount_value: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_expiry')}</label>
                                <input type="date" className="input" value={voucherForm.valid_until} onChange={e => setVoucherForm(v => ({...v, valid_until: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_min')}</label>
                                <input type="number" className="input" placeholder="0" value={voucherForm.min_purchase} onChange={e => setVoucherForm(v => ({...v, min_purchase: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>{t('settings_voucher_max')}</label>
                                <input type="number" className="input" placeholder="0" value={voucherForm.max_uses} onChange={e => setVoucherForm(v => ({...v, max_uses: e.target.value}))} />
                            </div>
                            <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
                                <button onClick={handleAddVoucher} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', fontSize: 13, minHeight: '44px' }}>
                                    <Plus size={14} /> {t('add')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Vouchers List */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${bd}`, color: sub }}>
                                    <th style={{ padding: '12px 0' }}>{t('settings_col_code')}</th>
                                    <th>{t('settings_col_discount')}</th>
                                    <th>{t('settings_col_expiry')}</th>
                                    <th>{t('settings_col_used')}</th>
                                    <th>{t('settings_col_terms')}</th>
                                    <th>{t('settings_col_status')}</th>
                                    <th style={{ textAlign: 'right' }}>{t('settings_col_action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingVouchers ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>{t('loading')}...</td></tr>
                                ) : vouchers.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: '#71717a' }}>{t('settings_no_vouchers')}</td></tr>
                                ) : (
                                    vouchers.map(v => (
                                        <tr key={v.id} style={{ borderBottom: `1px solid ${bd}` }}>
                                            <td style={{ padding: '12px 0', fontWeight: 700, color: text }}>{v.code}</td>
                                            <td style={{ color: '#10B981', fontWeight: 700 }}>
                                                {v.discount_type === 'persen' ? `${v.discount_value}%` : `Rp ${v.discount_value.toLocaleString(t('locale_code'))}`}
                                            </td>
                                            <td style={{ color: text }}>{new Date(v.valid_until).toLocaleDateString(t('locale_code'))}</td>
                                            <td style={{ color: text }}>
                                                {v.used_count} {v.max_uses > 0 ? `/ ${v.max_uses}` : ''}
                                            </td>
                                            <td style={{ color: sub, fontSize: 11 }}>
                                                {v.min_purchase > 0 ? `${t('settings_label_min')}: Rp ${v.min_purchase.toLocaleString(t('locale_code'))}` : t('settings_no_terms')}
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                                    background: v.is_active ? '#D1FAE5' : '#FEE2E2',
                                                    color: v.is_active ? '#065F46' : '#991B1B'
                                                }}>
                                                    {v.is_active ? t('settings_active') : t('settings_inactive')}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleToggleVoucher(v.id, v.is_active)} title={t('settings_action_toggle')}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, padding: 4 }}>
                                                        {v.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteVoucher(v.id)} title={t('delete')}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            )}

            {isUltimate ? (
                <SectionCard title={t('settings_loyalty_title')} icon={Gift} card={card} bd={bd} text={text}>
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: '0 0 16px', fontSize: 14, color: sub, lineHeight: 1.5 }}>
                            {t('settings_loyalty_desc')}
                        </p>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 'bold', color: text }}>
                            <input type="checkbox"
                                checked={companyForm.loyalty_enabled}
                                onChange={(e) => setCompanyForm({ ...companyForm, loyalty_enabled: e.target.checked })}
                                style={{ width: 18, height: 18, accentColor: '#7C3AED' }}
                            />
                            {t('settings_loyalty_enable')}
                        </label>
                    </div>

                    {companyForm.loyalty_enabled && (
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16, padding: 16, background: dark ? '#0F172A' : '#F8FAFC', borderRadius: 12 }}>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="label">{t('settings_min_spend_pts')}</label>
                                <input type="number" className="input" min="1"
                                    value={companyForm.points_per_amount}
                                    onChange={(e) => setCompanyForm({ ...companyForm, points_per_amount: Number(e.target.value) })}
                                />
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: sub }}>
                                    {t('settings_pts_example_earn')}
                                </p>
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="label">{t('settings_pts_value')}</label>
                                <input type="number" className="input" min="1"
                                    value={companyForm.points_value}
                                    onChange={(e) => setCompanyForm({ ...companyForm, points_value: Number(e.target.value) })}
                                />
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: sub }}>
                                    {t('settings_pts_example_redeem')}
                                </p>
                            </div>
                        </div>
                    )}
                </SectionCard>
            ) : (
                <SectionCard title={t('settings_loyalty_title')} icon={Gift} card={card} bd={bd} text={text}>
                    <div className="py-4">
                        <UpgradePrompt 
                            plan="ULTIMATE" 
                            feature={t('settings_loyalty_title')} 
                            message={t('up_lock_ult_d')} 
                        />
                    </div>
                </SectionCard>
            )}

            {/* Telegram Integration Card (Ultimate Only) */}
            {canAccessTelegram && (
                <>
                    <SectionCard title="Integrasi Bot Telegram" icon={MessageCircle} card={card} bd={bd} text={text}>
                        <p style={{ margin: '0 0 16px', fontSize: 14, color: sub, lineHeight: 1.5 }}>
                            Hubungkan akun MyInvoice Anda dengan Telegram untuk mencatat transaksi dan melihat laporan secara instan via chat.
                        </p>
                        <button 
                            id="connect-telegram-btn"
                            onClick={generateTelegramCode}
                            disabled={isLoadingTelegram}
                            style={{ 
                                background: '#18181b', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 8, 
                                padding: '10px 20px', 
                                fontSize: 14, 
                                fontWeight: 600, 
                                cursor: 'pointer',
                                opacity: isLoadingTelegram ? 0.7 : 1,
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#27272a'}
                            onMouseOut={e => e.currentTarget.style.background = '#18181b'}
                        >
                            {isLoadingTelegram ? 'Memproses...' : 'Hubungkan ke Telegram'}
                        </button>
                    </SectionCard>

                    {isTelegramModalOpen && ReactDOM.createPortal(
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                            <div 
                                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
                                onClick={closeTelegramModal}
                                style={{ position: 'fixed', inset: 0, background: 'rgba(24, 24, 27, 0.6)', backdropFilter: 'blur(4px)' }}
                            />
                            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up z-[10000]" style={{ background: 'white', position: 'relative', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e4e4e7' }}>
                                <div className="text-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-4" style={{ width: 48, height: 48, borderRadius: '9999px', background: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <MessageCircle size={24} className="text-zinc-700" style={{ color: '#3f3f46' }} />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 mb-2" style={{ fontSize: 18, fontWeight: 700, color: '#18181b', marginBottom: 8 }}>
                                        Hubungkan ke Telegram
                                    </h3>
                                    <p className="text-sm text-zinc-500 mb-6" style={{ fontSize: 14, color: '#71717a', marginBottom: 24 }}>
                                        Buka Telegram dan cari bot <span className="font-mono bg-zinc-100 px-1 rounded" style={{ fontFamily: 'monospace', background: '#f4f4f5', padding: '0 4px', borderRadius: 4 }}>@MyInvoice_Assistant_bot</span>
                                    </p>
                                    
                                    {telegramAuthCode ? (
                                        <>
                                            <div className="bg-zinc-50 rounded-lg p-4 mb-4" style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
                                                <p className="text-xs text-zinc-500 mb-2" style={{ fontSize: 12, color: '#71717a', marginBottom: 8 }}>Kirim perintah ini ke bot:</p>
                                                <code className="text-lg font-mono font-bold bg-white px-3 py-2 rounded border border-zinc-200 block" style={{ fontSize: 18, fontFamily: 'monospace', fontWeight: 700, background: 'white', padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e7eb', display: 'block' }}>
                                                    /login {telegramAuthCode}
                                                </code>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(`/login ${telegramAuthCode}`);
                                                    showToast('Perintah disalin ke clipboard', 'success');
                                                }}
                                                className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition"
                                                style={{ width: '100%', padding: '8px 16px', background: '#18181b', color: 'white', borderRadius: 8, fontWeight: 500, border: 'none', cursor: 'pointer' }}
                                            >
                                                Salin Perintah
                                            </button>
                                            <p className="text-xs text-zinc-400 mt-4" style={{ fontSize: 12, color: '#a1a1aa', marginTop: 16 }}>
                                                Kode berlaku: {Math.floor(telegramCountdown / 60)}:{(telegramCountdown % 60).toString().padStart(2, '0')}
                                            </p>
                                        </>
                                    ) : (
                                        <div className="py-8">
                                            <div className="flex justify-center" style={{ display: 'flex', justifyContent: 'center' }}>
                                                <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" style={{ width: 32, height: 32, border: '2px solid #d4d4d8', borderTopColor: '#52525b', borderRadius: '9999px' }}></div>
                                            </div>
                                            <p className="text-sm text-zinc-500 mt-4" style={{ fontSize: 14, color: '#71717a', marginTop: 16 }}>Menyiapkan kode...</p>
                                        </div>
                                    )}

                                    <div className="mt-6 text-left border-t pt-4" style={{ marginTop: 24, textAlign: 'left', borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
                                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3" style={{ fontSize: 10, fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Panduan Penggunaan</p>
                                        <ul className="text-xs text-zinc-500 space-y-2 list-disc pl-4" style={{ fontSize: 12, color: '#71717a', paddingLeft: 16, margin: 0 }}>
                                            <li style={{ marginBottom: 8 }}><strong>Format Perintah:</strong> <br/> /bayar [nominal] [keterangan] <br/> /masuk [nominal] [keterangan]</li>
                                            <li><strong>Aturan Baku:</strong> <br/> 1. Nominal tanpa titik/koma (Contoh: 50000). <br/> 2. Kode OTP berlaku 5 menit. <br/> 3. Bot hanya memproses teks. <br/> 4. Bisa tautkan banyak akun Telegram.</li>
                                        </ul>
                                    </div>
                                    
                                    <button
                                        onClick={closeTelegramModal}
                                        className="mt-6 w-full py-2 border border-zinc-200 rounded-lg text-zinc-600 font-medium hover:bg-zinc-50 transition"
                                        style={{ width: '100%', padding: '8px 16px', border: '1px solid #e5e7eb', borderRadius: 8, color: '#52525b', fontWeight: 500, background: 'white', cursor: 'pointer', marginTop: 24 }}
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </>
            )}
        </div>
    );
}
