import { useState } from 'react';
import { Settings2, Hash, Save, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useDocSettings } from '../hooks/useDocSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Receipt, Ticket, Plus, Trash2, Power, PowerOff, Gift } from 'lucide-react';
import { useEffect } from 'react';

const DOC_KEYS = [
    { key: 'inv', labelID: 'Invoice', labelEN: 'Invoice' },
    { key: 'kwt', labelID: 'Kwitansi', labelEN: 'Receipt' },
    { key: 'tt', labelID: 'Tanda Terima', labelEN: 'Delivery Receipt' },
    { key: 'sph', labelID: 'Penawaran Harga', labelEN: 'Quotation' },
    { key: 'po', labelID: 'Purchase Order', labelEN: 'Purchase Order' },
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
    const { lang } = useLang();
    const { showToast } = useToast();
    const { settings, setSettings, preview, DEFAULTS } = useDocSettings();
    const { profile, setProfile } = useCompanyProfile();
    const { effectivePlan, isAdmin, user, profile: authProfile } = useAuth();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const isID = lang === 'ID';

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

    // Local editable states
    const [docSettings, setDocSettings] = useState({ ...DEFAULTS, ...settings });
    const [companyForm, setCompanyForm] = useState({
        name: authProfile?.name || profile?.name || '', 
        address: authProfile?.address || profile?.address || '',
        phone: authProfile?.phone || profile?.phone || '', 
        email: authProfile?.email || profile?.email || '', 
        website: authProfile?.website || profile?.website || '',
        store_name: authProfile?.store_name || profile?.store_name || 'My Store', 
        store_address: authProfile?.store_address || profile?.store_address || '',
        store_phone: authProfile?.store_phone || profile?.store_phone || '', 
        store_footer: authProfile?.store_footer || profile?.store_footer || 'Thank you!',
        store_logo_url: authProfile?.store_logo_url || profile?.store_logo_url || '',
        loyalty_enabled: authProfile?.loyalty_enabled ?? profile?.loyalty_enabled ?? false,
        points_per_amount: authProfile?.points_per_amount || profile?.points_per_amount || 1000,
        points_value: authProfile?.points_value || profile?.points_value || 10
    });

    // Sync form with authProfile when it loads
    useEffect(() => {
        if (authProfile) {
            setCompanyForm(prev => ({
                ...prev,
                name: authProfile.full_name || authProfile.name || prev.name,
                address: authProfile.address || prev.address,
                phone: authProfile.phone || prev.phone,
                email: authProfile.email || prev.email,
                website: authProfile.website || prev.website,
                store_name: authProfile.store_name || prev.store_name,
                store_address: authProfile.store_address || prev.store_address,
                store_phone: authProfile.store_phone || prev.store_phone,
                store_footer: authProfile.store_footer || prev.store_footer,
                store_logo_url: authProfile.store_logo_url || prev.store_logo_url,
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
                    store_name: companyForm.store_name,
                    store_address: companyForm.store_address,
                    store_phone: companyForm.store_phone,
                    store_footer: companyForm.store_footer,
                    store_logo_url: companyForm.store_logo_url,
                    full_name: companyForm.name
                })
                .eq('id', user.id);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to save store profile to Supabase', err);
            showToast(isID ? 'Gagal menyimpan pengaturan ke database' : 'Failed to save settings to database', 'error');
            return;
        }

        showToast(isID ? 'Pengaturan disimpan!' : 'Settings saved!', 'success');
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
            showToast(isID ? 'Ukuran logo maksimal 200KB. Kompres gambar terlebih dahulu.' : 'Max logo size is 200KB. Please compress the image.', 'error');
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
            showToast(isID ? 'Logo toko berhasil diunggah' : 'Store logo uploaded successfully', 'success');
        } catch (err) {
            console.error(err);
            showToast(isID ? 'Gagal mengunggah logo' : 'Failed to upload logo', 'error');
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const fetchVouchers = async () => {
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
    };

    useEffect(() => {
        if (effectivePlan === 'ultimate' || effectivePlan === 'pro' || isAdmin) {
            fetchVouchers();
        }
    }, [effectivePlan, isAdmin, user.id]);

    const handleAddVoucher = async () => {
        if (!voucherForm.code || !voucherForm.discount_value || !voucherForm.valid_until) {
            showToast(isID ? 'Isi form dengan lengkap' : 'Please fill all required fields', 'error');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('kasir_vouchers')
                .insert({
                    user_id: user.id,
                    code: voucherForm.code.toUpperCase(),
                    discount_type: voucherForm.discount_type,
                    discount_value: parseFloat(voucherForm.discount_value),
                    valid_until: new Date(voucherForm.valid_until).toISOString(),
                    max_uses: voucherForm.max_uses ? parseInt(voucherForm.max_uses) : 0,
                    min_purchase: voucherForm.min_purchase ? parseFloat(voucherForm.min_purchase) : 0,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    showToast(isID ? 'Kode voucher sudah digunakan' : 'Voucher code already exists', 'error');
                } else {
                    throw error;
                }
                return;
            }

            setVouchers([data, ...vouchers]);
            setVoucherForm({
                code: '', discount_type: 'persen', discount_value: '', valid_until: '', max_uses: '', min_purchase: ''
            });
            showToast(isID ? 'Voucher ditambahkan' : 'Voucher added', 'success');
        } catch (err) {
            console.error('Failed to add voucher', err);
            showToast(isID ? 'Gagal menambah voucher' : 'Failed to add voucher', 'error');
        }
    };

    const handleToggleVoucher = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('kasir_vouchers')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setVouchers(vouchers.map(v => v.id === id ? { ...v, is_active: !currentStatus } : v));
        } catch (err) {
            console.error('Failed to toggle active status', err);
        }
    };

    const handleDeleteVoucher = async (id) => {
        if (!window.confirm(isID ? 'Hapus voucher ini?' : 'Delete this voucher?')) return;
        try {
            const { error } = await supabase
                .from('kasir_vouchers')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setVouchers(vouchers.filter(v => v.id !== id));
            showToast(isID ? 'Voucher dihapus' : 'Voucher deleted', 'success');
        } catch (err) {
            console.error('Failed to delete voucher', err);
        }
    };

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
        <div className="page-enter" style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: text }}>
                        {isID ? 'Pengaturan' : 'Settings'}
                    </h1>
                    <p style={{ margin: 0, fontSize: 14, color: sub }}>
                        {isID ? 'Atur profil perusahaan dan format nomor dokumen.' : 'Configure company profile and document number format.'}
                    </p>
                </div>
                <button onClick={saveAll} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Save size={16} /> {isID ? 'Simpan Semua' : 'Save All'}
                </button>
            </div>

            {/* Company Profile */}
            <SectionCard title={isID ? 'Profil Perusahaan' : 'Company Profile'} icon={Settings2} card={card} bd={bd} text={text}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                    {[
                        { key: 'name', labelID: 'Nama Perusahaan', labelEN: 'Company Name' },
                        { key: 'address', labelID: 'Alamat', labelEN: 'Address' },
                        { key: 'phone', labelID: 'Telepon', labelEN: 'Phone' },
                        { key: 'email', labelID: 'Email', labelEN: 'Email' },
                        { key: 'website', labelID: 'Website', labelEN: 'Website' },
                    ].map(f => (
                        <div key={f.key} className="form-group" style={{ margin: 0 }}>
                            <label className="label">{isID ? f.labelID : f.labelEN}</label>
                            <input className="input" value={companyForm[f.key]} onChange={e => setCompanyForm(v => ({ ...v, [f.key]: e.target.value }))} />
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* Document Number Format */}
            <SectionCard title={isID ? 'Format Nomor Dokumen' : 'Document Number Format'} icon={Hash} card={card} bd={bd} text={text}>
                {/* Global settings */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 20, padding: '16px', background: bg2, borderRadius: 12 }}>
                    {/* Separator */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{isID ? 'Separator' : 'Separator'}</p>
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
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{isID ? 'Sertakan Tahun' : 'Include Year'}</p>
                        <button onClick={() => setDocSettings(s => ({ ...s, include_year: !s.include_year }))}
                            style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${docSettings.include_year ? '#7C3AED' : bd}`, background: docSettings.include_year ? '#EDE9FE' : 'transparent', color: docSettings.include_year ? '#7C3AED' : sub, fontWeight: 700, cursor: 'pointer' }}>
                            {docSettings.include_year ? (isID ? 'Ya' : 'Yes') : (isID ? 'Tidak' : 'No')}
                        </button>
                    </div>
                    {/* Include month */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{isID ? 'Sertakan Bulan' : 'Include Month'}</p>
                        <button onClick={() => setDocSettings(s => ({ ...s, include_month: !s.include_month }))}
                            style={{ padding: '8px 20px', borderRadius: 8, border: `1.5px solid ${docSettings.include_month ? '#7C3AED' : bd}`, background: docSettings.include_month ? '#EDE9FE' : 'transparent', color: docSettings.include_month ? '#7C3AED' : sub, fontWeight: 700, cursor: 'pointer' }}>
                            {docSettings.include_month ? (isID ? 'Ya' : 'Yes') : (isID ? 'Tidak' : 'No')}
                        </button>
                    </div>
                    {/* Start number */}
                    <div>
                        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: sub }}>{isID ? 'Nomor Awal' : 'Starting Number'}</p>
                        <input type="number" min={1} className="input" value={docSettings.start_num ?? 1}
                            onChange={e => setDocSettings(s => ({ ...s, start_num: parseInt(e.target.value) || 1 }))}
                            style={{ width: 100 }} />
                    </div>
                </div>

                {/* Per-document prefix */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    {DOC_KEYS.map(d => (
                        <div key={d.key} style={{ padding: 14, background: bg2, borderRadius: 10 }}>
                            <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: sub }}>{isID ? d.labelID : d.labelEN}</p>
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
                    <RotateCcw size={13} /> {isID ? 'Reset ke Default' : 'Reset to Defaults'}
                </button>
            </SectionCard>

            {/* Receipt Customization (ULTIMATE feature) */}
            {(effectivePlan === 'ultimate' || isAdmin) && (
                <SectionCard title={isID ? 'Kustomisasi Struk (ULTIMATE)' : 'Receipt Customization (ULTIMATE)'} icon={Receipt} card={card} bd={bd} text={text}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                        {isID ? 'Kustomisasi tampilan struk kasir kamu.' : 'Customize your cashier receipt appearance.'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="label">{isID ? 'Nama Toko' : 'Store Name'}</label>
                            <input className="input" placeholder="My Store" value={companyForm.store_name} onChange={e => setCompanyForm(v => ({ ...v, store_name: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="label">{isID ? 'Nomor Telepon' : 'Phone Number'}</label>
                            <input className="input" placeholder="08123456789" value={companyForm.store_phone} onChange={e => setCompanyForm(v => ({ ...v, store_phone: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{isID ? 'Alamat Toko' : 'Store Address'}</label>
                            <input className="input" placeholder="Jl. Raya Utama No. 1" value={companyForm.store_address} onChange={e => setCompanyForm(v => ({ ...v, store_address: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{isID ? 'Pesan Footer' : 'Footer Message'}</label>
                            <input className="input" placeholder="Thank you!" value={companyForm.store_footer} onChange={e => setCompanyForm(v => ({ ...v, store_footer: e.target.value }))} />
                        </div>
                        <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                            <label className="label">{isID ? 'Logo Toko' : 'Store Logo'}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {companyForm.store_logo_url && (
                                    <img src={companyForm.store_logo_url} alt="Store Logo" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: 8, border: `1px solid ${bd}`, background: bg2 }} />
                                )}
                                <div>
                                    <input type="file" accept="image/*" id="store-logo-upload" style={{ display: 'none' }} onChange={handleLogoUpload} />
                                    <label htmlFor="store-logo-upload" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', padding: '8px 16px', fontSize: 13, background: bg2, border: `1px solid ${bd}`, color: text, borderRadius: 8 }}>
                                        {isUploadingLogo ? (isID ? 'Mengunggah...' : 'Uploading...') : (isID ? 'Pilih Gambar Logo' : 'Choose Logo Image')}
                                    </label>
                                    {companyForm.store_logo_url && (
                                        <button onClick={() => setCompanyForm(prev => ({ ...prev, store_logo_url: null }))} style={{ marginLeft: 8, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 13, fontWeight: 600 }}>
                                            {isID ? 'Hapus' : 'Remove'}
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
                <SectionCard title={isID ? 'Manajemen Voucher' : 'Voucher Management'} icon={Ticket} card={card} bd={bd} text={text}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                        {isID ? 'Buat kode voucher diskon untuk pelanggan Kasir.' : 'Manage discount voucher codes for POS Cashier.'}
                    </p>
                    
                    {/* Add Voucher Form */}
                    <div style={{ padding: 16, background: bg2, border: `1px solid ${bd}`, borderRadius: 12, marginBottom: 20 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: text }}>
                            {isID ? 'Tambah Voucher Baru' : 'Add New Voucher'}
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                            <div style={{ flex: '1 1 150px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Kode Voucher</label>
                                <input className="input" placeholder="PROMO2026" value={voucherForm.code} onChange={e => setVoucherForm(v => ({...v, code: e.target.value.toUpperCase()}))} style={{ textTransform: 'uppercase' }} />
                            </div>
                            <div style={{ width: 90 }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Tipe</label>
                                <select className="input" value={voucherForm.discount_type} onChange={e => setVoucherForm(v => ({...v, discount_type: e.target.value}))}>
                                    <option value="persen">% Persen</option>
                                    <option value="nominal">Rp Nominal</option>
                                </select>
                            </div>
                            <div style={{ flex: '1 1 100px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Nilai Diskon</label>
                                <input type="number" className="input" placeholder={voucherForm.discount_type === 'persen' ? '15' : '10000'} value={voucherForm.discount_value} onChange={e => setVoucherForm(v => ({...v, discount_value: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 140px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Tgl Berakhir</label>
                                <input type="date" className="input" value={voucherForm.valid_until} onChange={e => setVoucherForm(v => ({...v, valid_until: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Min Belanja (Opsional)</label>
                                <input type="number" className="input" placeholder="0" value={voucherForm.min_purchase} onChange={e => setVoucherForm(v => ({...v, min_purchase: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 120px' }}>
                                <label className="label" style={{ fontSize: 11, marginBottom: 4 }}>Batas Pakai (Opsional)</label>
                                <input type="number" className="input" placeholder="0" value={voucherForm.max_uses} onChange={e => setVoucherForm(v => ({...v, max_uses: e.target.value}))} />
                            </div>
                            <div style={{ flex: '1 1 100%', display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button onClick={handleAddVoucher} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}>
                                    <Plus size={14} /> {isID ? 'Tambah' : 'Add'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Vouchers List */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: 600, width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${bd}`, color: sub }}>
                                    <th style={{ padding: '12px 0' }}>Kode</th>
                                    <th>Diskon</th>
                                    <th>Valid s.d</th>
                                    <th>Dipakai</th>
                                    <th>Syarat</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoadingVouchers ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
                                ) : vouchers.length === 0 ? (
                                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 20, color: sub }}>Belum ada voucher</td></tr>
                                ) : (
                                    vouchers.map(v => (
                                        <tr key={v.id} style={{ borderBottom: `1px solid ${bd}` }}>
                                            <td style={{ padding: '12px 0', fontWeight: 700, color: text }}>{v.code}</td>
                                            <td style={{ color: '#10B981', fontWeight: 700 }}>
                                                {v.discount_type === 'persen' ? `${v.discount_value}%` : `Rp ${v.discount_value.toLocaleString('id-ID')}`}
                                            </td>
                                            <td style={{ color: text }}>{new Date(v.valid_until).toLocaleDateString('id-ID')}</td>
                                            <td style={{ color: text }}>
                                                {v.used_count} {v.max_uses > 0 ? `/ ${v.max_uses}` : ''}
                                            </td>
                                            <td style={{ color: sub, fontSize: 11 }}>
                                                {v.min_purchase > 0 ? `Min: Rp ${v.min_purchase.toLocaleString('id-ID')}` : 'Tanpa syarat'}
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                                    background: v.is_active ? '#D1FAE5' : '#FEE2E2',
                                                    color: v.is_active ? '#065F46' : '#991B1B'
                                                }}>
                                                    {v.is_active ? 'AKTIF' : 'NONAKTIF'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleToggleVoucher(v.id, v.is_active)} title="Toggle Status"
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, padding: 4 }}>
                                                        {v.is_active ? <PowerOff size={16} /> : <Power size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteVoucher(v.id)} title="Delete"
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

            {/* Loyalty Program Settings (PRO/ULTIMATE) */}
            {(effectivePlan === 'ultimate' || effectivePlan === 'pro' || isAdmin) && (
                <SectionCard title={isID ? 'Program Loyalty (Poin)' : 'Loyalty Program (Points)'} icon={Gift} card={card} bd={bd} text={text}>
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: sub }}>
                        {isID ? 'Atur sistem poin pelanggan untuk memberikan reward diskon.' : 'Configure customer point system to reward discounts.'}
                    </p>
                    <div style={{ padding: 16, background: bg2, border: `1px solid ${bd}`, borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: text }}>
                                    {isID ? 'Aktifkan Program Loyalty' : 'Enable Loyalty Program'}
                                </h4>
                                <p style={{ margin: 0, fontSize: 13, color: sub }}>
                                    {isID ? 'Pelanggan bisa mengumpulkan dan menukar poin di Kasir.' : 'Customers can earn and redeem points in Cashier.'}
                                </p>
                            </div>
                            <button
                                onClick={() => setCompanyForm({...companyForm, loyalty_enabled: !companyForm.loyalty_enabled})}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    companyForm.loyalty_enabled ? 'bg-purple-600' : 'bg-gray-600'
                                }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    companyForm.loyalty_enabled ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                            </button>
                        </div>

                        {companyForm.loyalty_enabled && (
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', borderTop: `1px solid ${bd}`, paddingTop: 16 }}>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label className="label">{isID ? 'Minimal Belanja untuk 1 Poin (Rp)' : 'Min. Spend for 1 Point (Rp)'}</label>
                                    <input type="number" className="input" min="1" 
                                        value={companyForm.points_per_amount} 
                                        onChange={(e) => setCompanyForm({...companyForm, points_per_amount: Number(e.target.value)})} 
                                    />
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: sub }}>
                                        {isID ? 'Contoh: Setiap belanja Rp 1.000 dapat 1 Poin.' : 'E.g., Spend Rp 1,000 get 1 Point.'}
                                    </p>
                                </div>
                                <div style={{ flex: '1 1 200px' }}>
                                    <label className="label">{isID ? 'Nilai Tukar 1 Poin (Rp)' : 'Value of 1 Point (Rp)'}</label>
                                    <input type="number" className="input" min="1" 
                                        value={companyForm.points_value} 
                                        onChange={(e) => setCompanyForm({...companyForm, points_value: Number(e.target.value)})} 
                                    />
                                    <p style={{ margin: '4px 0 0', fontSize: 11, color: sub }}>
                                        {isID ? 'Contoh: 1 Poin = Potongan Rp 10.' : 'E.g., 1 Point = Rp 10 discount.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
