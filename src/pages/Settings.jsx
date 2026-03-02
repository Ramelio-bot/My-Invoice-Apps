import { useState } from 'react';
import { Settings2, Hash, Save, RotateCcw } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useDocSettings } from '../hooks/useDocSettings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useCompanyProfile } from '../hooks/useCompanyProfile';
import { useToast } from '../context/ToastContext';

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

    const isID = lang === 'ID';

    // Local editable states
    const [docSettings, setDocSettings] = useState({ ...DEFAULTS, ...settings });
    const [companyForm, setCompanyForm] = useState({
        name: profile?.name || '', address: profile?.address || '',
        phone: profile?.phone || '', email: profile?.email || '', website: profile?.website || '',
    });

    const saveAll = () => {
        setSettings(docSettings);
        setProfile({ ...profile, ...companyForm });
        showToast(isID ? 'Pengaturan disimpan!' : 'Settings saved!', 'success');
    };

    const resetDoc = () => { setDocSettings({ ...DEFAULTS }); };

    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';
    const card = dark ? '#1E293B' : 'white';
    const bd = dark ? '#334155' : '#E2E8F0';
    const bg2 = dark ? '#0F172A' : '#F8FAFC';

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
        </div>
    );
}
