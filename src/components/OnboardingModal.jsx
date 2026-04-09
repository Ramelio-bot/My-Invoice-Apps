import { useState } from 'react';
import { X, ArrowRight, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useCompanyProfile } from '../hooks/useCompanyProfile';

const STEPS = [
    { id: 'name', labelID: 'Nama Perusahaan / Usaha', labelEN: 'Company / Business Name', required: true, placeholder: 'PT Maju Bersama / Toko Serba Ada' },
    { id: 'address', labelID: 'Alamat Lengkap', labelEN: 'Full Address', required: true, placeholder: 'Jl. Sudirman No. 1, Jakarta' },
    { id: 'phone', labelID: 'Nomor Telepon', labelEN: 'Phone Number', required: true, placeholder: '0812-3456-7890' },
    { id: 'email', labelID: 'Email (opsional)', labelEN: 'Email (optional)', required: false, placeholder: 'hello.myinvoice@gmail.com', type: 'email' },
    { id: 'website', labelID: 'Website (opsional)', labelEN: 'Website (optional)', required: false, placeholder: 'www.perusahaan.com' },
];

// Group steps: page1 = name+address, page2 = phone+email+website
const PAGES = [
    [0, 1],    // Step 1: name, address
    [2, 3, 4], // Step 2: phone, email, website
];
const TOTAL_STEPS = PAGES.length;

export default function OnboardingModal() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const { setProfile } = useCompanyProfile();

    const [form, setForm] = useState({ name: '', address: '', phone: '', email: '', website: '' });
    const [step, setStep] = useState(0); // 0-indexed page

    const isID = t('locale_suffix') === 'ID';

    const currentFields = PAGES[step].map(i => STEPS[i]);
    const requiredOnPage = currentFields.filter(f => f.required);
    const canNext = requiredOnPage.every(f => form[f.id]?.trim());

    const handleSkip = () => {
        localStorage.setItem('onboarding_done', 'true');
        window.location.reload(); // easiest way to dismiss and re-render
    };

    const handleNext = () => {
        if (step < TOTAL_STEPS - 1) {
            setStep(s => s + 1);
        } else {
            // Save
            setProfile({ ...form, createdAt: new Date().toISOString() });
            localStorage.setItem('onboarding_done', 'true');
        }
    };

    const bg = dark ? '#1E293B' : 'white';
    const text = dark ? '#F1F5F9' : '#0F172A';
    const sub = dark ? '#94A3B8' : '#64748B';

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
        }}>
            <div style={{
                background: bg, borderRadius: 20,
                width: '100%', maxWidth: 480,
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                animation: 'scaleIn 200ms cubic-bezier(0.4,0,0.2,1) forwards',
                overflowY: 'auto',
                maxHeight: '90vh',
                scrollbarWidth: 'thin'
            }}>
                {/* Progress bar */}
                <div style={{ height: 4, background: dark ? '#334155' : '#E2E8F0' }}>
                    <div style={{
                        height: '100%', background: '#7C3AED',
                        width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
                        transition: 'width 400ms cubic-bezier(0.4,0,0.2,1)',
                    }} />
                </div>

                <div style={{ padding: '32px 32px 28px' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: '#7C3AED', letterSpacing: 1, textTransform: 'uppercase' }}>
                            {isID ? `Langkah ${step + 1} dari ${TOTAL_STEPS}` : `Step ${step + 1} of ${TOTAL_STEPS}`}
                        </p>
                        <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 900, color: text }}>
                            {step === 0
                                ? (isID ? 'Selamat Datang di My Invoice! 👋' : 'Welcome to My Invoice! 👋')
                                : (isID ? 'Informasi Kontak' : 'Contact Information')
                            }
                        </h2>
                        <p style={{ margin: 0, fontSize: 14, color: sub, lineHeight: 1.6 }}>
                            {step === 0
                                ? (isID ? 'Lengkapi profil perusahaan kamu agar dokumen lebih profesional.' : 'Complete your company profile for more professional documents.')
                                : (isID ? 'Data ini akan muncul di setiap dokumen yang kamu buat.' : 'This data will appear on every document you create.')
                            }
                        </p>
                    </div>

                    {/* Fields */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                        {currentFields.map(field => (
                            <div key={field.id} className="form-group" style={{ margin: 0 }}>
                                <label className="label">{isID ? field.labelID : field.labelEN}</label>
                                <input
                                    className="input"
                                    type={field.type || 'text'}
                                    value={form[field.id]}
                                    onChange={e => setForm(f => ({ ...f, [field.id]: e.target.value }))}
                                    placeholder={field.placeholder}
                                    autoFocus={PAGES[step][0] === STEPS.indexOf(field)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={handleSkip}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub, fontSize: 13, fontWeight: 600, padding: 0 }}
                        >
                            {isID ? 'Lewati' : 'Skip'}
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={!canNext}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: canNext ? '#7C3AED' : (dark ? '#334155' : '#E2E8F0'),
                                color: canNext ? 'white' : sub,
                                border: 'none', borderRadius: 10, padding: '11px 24px',
                                fontSize: 14, fontWeight: 700, cursor: canNext ? 'pointer' : 'not-allowed',
                                transition: 'all 200ms',
                            }}
                        >
                            {step < TOTAL_STEPS - 1
                                ? <>{isID ? 'Lanjut' : 'Next'} <ArrowRight size={16} /></>
                                : <><CheckCircle size={16} /> {isID ? 'Mulai Sekarang' : 'Get Started'}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
