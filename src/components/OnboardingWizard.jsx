import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
    Utensils, Store, Wrench, Shirt, Activity, BookOpen, Home, Briefcase,
    FileText, Wallet, Users, BarChart2,
    CheckCircle2, ArrowRight, ArrowLeft, Image as ImageIcon, CheckCircle
} from 'lucide-react';

const businessTypes = [
    { id: 'kuliner', label: 'Kuliner / F&B', icon: Utensils },
    { id: 'retail', label: 'Retail / Toko', icon: Store },
    { id: 'jasa', label: 'Jasa / Service', icon: Wrench },
    { id: 'fashion', label: 'Fashion', icon: Shirt },
    { id: 'kesehatan', label: 'Kesehatan / Kecantikan', icon: Activity },
    { id: 'pendidikan', label: 'Pendidikan', icon: BookOpen },
    { id: 'properti', label: 'Properti', icon: Home },
    { id: 'lainnya', label: 'Lainnya', icon: Briefcase },
];

const featuresList = [
    { id: 'kasir', label: 'Kasir / POS', icon: Store, desc: 'Transaksi penjualan harian' },
    { id: 'invoice', label: 'Invoice', icon: FileText, desc: 'Buat & kirim invoice ke klien' },
    { id: 'hutang', label: 'Hutang Piutang', icon: Wallet, desc: 'Tracking utang & piutang' },
    { id: 'karyawan', label: 'Karyawan', icon: Users, desc: 'Kelola shift & performa' },
    { id: 'laporan', label: 'Laporan', icon: BarChart2, desc: 'Analisis bisnis & omzet' },
];

export default function OnboardingWizard({ onComplete }) {
    const { user, refreshProfile } = useAuth();
    const { t } = useLang();
    const { dark } = useTheme();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    const [form, setForm] = useState({
        storeName: '',
        storeAddress: '',
        storePhone: '',
        businessType: '',
        mainFeatures: [], // array of feature ids
        logoFile: null,
        logoPreview: null
    });

    const isStepValid = () => {
        if (step === 1) return form.storeName.trim().length > 0;
        if (step === 2) return form.businessType !== '';
        if (step === 3) return form.mainFeatures.length > 0;
        return true;
    };

    const handleFeatureSelect = (id) => {
        setForm(prev => {
            if (prev.mainFeatures.includes(id)) {
                return { ...prev, mainFeatures: prev.mainFeatures.filter(f => f !== id) };
            }
            return { ...prev, mainFeatures: [...prev.mainFeatures, id] };
        });
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // basic validation
        if (file.size > 2 * 1024 * 1024) {
            alert(t('hpp_toast_save_failed') + ' Logo > 2MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, logoFile: file, logoPreview: previewUrl }));
    };

    const completeOnboarding = async (forcedForm = form) => {
        if (!user) return;
        setLoading(true);

        try {
            let logoUrl = null;

            // 1. Upload logo if exists
            if (forcedForm.logoFile) {
                const fileExt = forcedForm.logoFile.name.split('.').pop();
                const fileName = `${user.id}/logo_${Date.now()}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('company-logos')
                    .upload(fileName, forcedForm.logoFile, { upsert: true });
                
                if (!uploadError) {
                    const { data: publicUrlData } = supabase.storage
                        .from('company-logos')
                        .getPublicUrl(fileName);
                    logoUrl = publicUrlData.publicUrl;
                }
            }

            // 2. Update profiles table
            const { error: updateError } = await supabase.from('profiles').update({
                store_name: forcedForm.storeName || user.email?.split('@')[0] || 'My Store',
                store_address: forcedForm.storeAddress || null,
                store_phone: forcedForm.storePhone || null,
                business_type: forcedForm.businessType || null,
                onboarding_completed: true,
                ...(logoUrl && { company_logo: logoUrl }) // conditionally update if uploaded
            }).eq('id', user.id);

            if (updateError) throw updateError;

            // Update AuthContext to reflect changes globally
            try {
                await refreshProfile(true);
            } catch (err) {
                console.error('refreshProfile error:', err);
            }

            // 3. Callback and Redirect
            if (onComplete) {
                onComplete();
            }

            const redirectMap = {
                kasir: '/kasir',
                invoice: '/invoice',
                hutang: '/hutang-piutang',
                karyawan: '/karyawan',
                laporan: '/laporan-kasir'
            };

            const firstFeature = forcedForm.mainFeatures[0];
            const targetPath = redirectMap[firstFeature] || '/dashboard';
            
            // Ensure navigation happens
            navigate(targetPath);
            
            // Fallback for extreme cases
            setTimeout(() => {
                if (window.location.pathname === '/register' || window.location.pathname === '/') {
                    window.location.href = targetPath;
                }
            }, 1000);

        } catch (err) {
            console.error('Error completing onboarding:', err);
            alert(t('hpp_toast_system_error'));
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        // Provide minimum defaults to bypass requirements if skipped mid-way
        const skippedForm = {
            ...form,
            storeName: form.storeName || 'My Store',
            businessType: form.businessType || 'lainnya',
            mainFeatures: form.mainFeatures.length > 0 ? form.mainFeatures : ['invoice']
        };
        completeOnboarding(skippedForm);
    };

    const stepsTitles = [
        t('onboard_step1'),
        t('onboard_step2'),
        t('onboard_step3'),
        t('onboard_step4'),
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 99999,
            background: dark ? '#0F172A' : '#F8FAFC',
            display: 'flex', flexDirection: 'column'
        }} className="animate-in fade-in duration-300">
            {/* Top Progress Bar & Header */}
            <div style={{ background: dark ? '#1E293B' : 'white', borderBottom: `1px solid ${dark ? '#334155' : '#E2E8F0'}` }}>
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg text-slate-900 dark:text-white">MyInvoice.space</h1>
                        <p className="text-sm text-slate-500">{t('onboard_subtitle')}</p>
                    </div>
                    {/* Skip button for step 1-3 */}
                    {step < 4 && (
                        <button
                            onClick={handleSkip}
                            disabled={loading}
                            className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                        >
                            {t('onboard_skip')}
                        </button>
                    )}
                </div>

                {/* Progress Indicators */}
                <div className="max-w-4xl mx-auto px-6 pb-6 pt-4">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
                        <div 
                            className="absolute top-1/2 left-0 h-1 bg-violet-600 -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${((step - 1) / 3) * 100}%` }}
                        />

                        {stepsTitles.map((title, idx) => {
                            const num = idx + 1;
                            const isActive = step === num;
                            const isDone = step > num;
                            return (
                                <div key={num} className="relative z-10 flex flex-col items-center gap-2">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                                        ${isActive ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30' : 
                                          isDone ? 'bg-violet-600 text-white' : 
                                          'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}
                                    `}>
                                        {isDone ? <CheckCircle2 size={16} /> : num}
                                    </div>
                                    <span className={`text-xs font-semibold hidden md:block ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pt-8 pb-32 px-4">
                <div className="max-w-2xl mx-auto">
                    
                    {/* Step 1: Info Toko */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{t('onboard_title')}</h2>
                                <p className="text-slate-500 text-lg">{t('onboard_step1')}</p>
                            </div>

                            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        {t('onboard_store_name')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.storeName}
                                        onChange={e => setForm({ ...form, storeName: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                        placeholder={t('onboard_store_name_placeholder')}
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            {t('onboard_store_phone')}
                                        </label>
                                        <input
                                            type="tel"
                                            value={form.storePhone}
                                            onChange={e => setForm({ ...form, storePhone: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                            placeholder="0812..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            {t('onboard_store_address')}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.storeAddress}
                                            onChange={e => setForm({ ...form, storeAddress: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                            placeholder="Jl. Sudirman..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        {t('onboard_upload_logo')}
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                                            {form.logoPreview ? (
                                                <img src={form.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={24} className="text-slate-400" />
                                            )}
                                        </div>
                                        <label className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-lg cursor-pointer transition-colors">
                                            <span>Pilih File</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Jenis Usaha */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{t('onboard_business_type')}</h2>
                                <p className="text-slate-500 text-lg">Sesuaikan pengaturan aplikasi dengan jenis usaha Anda.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {businessTypes.map(type => {
                                    const Icon = type.icon;
                                    const isActive = form.businessType === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setForm({ ...form, businessType: type.id })}
                                            className={`
                                                flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all
                                                ${isActive ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 shadow-md shadow-violet-500/10' : 
                                                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-violet-300 dark:hover:border-violet-500/50'}
                                            `}
                                        >
                                            <div className={`p-3 rounded-full ${isActive ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                                <Icon size={24} />
                                            </div>
                                            <span className="text-sm font-semibold text-center">{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fitur Utama */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{t('onboard_features')}</h2>
                                <p className="text-slate-500 text-lg">Pilih fitur utama. Anda dapat mengubahnya nanti.</p>
                            </div>

                            <div className="space-y-3">
                                {featuresList.map(feat => {
                                    const Icon = feat.icon;
                                    const isSelected = form.mainFeatures.includes(feat.id);
                                    return (
                                        <button
                                            key={feat.id}
                                            onClick={() => handleFeatureSelect(feat.id)}
                                            className={`
                                                w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left
                                                ${isSelected ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 shadow-md shadow-violet-500/10' : 
                                                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-500/50'}
                                            `}
                                        >
                                            <div className={`
                                                w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                                ${isSelected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-transparent'}
                                            `}>
                                                {isSelected && <CheckCircle size={14} strokeWidth={3} />}
                                            </div>

                                            <div className={`p-3 rounded-xl shrink-0 ${isSelected ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                                                <Icon size={24} />
                                            </div>
                                            
                                            <div>
                                                <h3 className={`text-base font-bold mb-0.5 ${isSelected ? 'text-violet-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {feat.label}
                                                </h3>
                                                <p className="text-sm text-slate-500">{feat.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Done */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                            <div className="text-center py-12 px-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-500 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                    <CheckCircle size={48} strokeWidth={2.5} />
                                </div>
                                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{t('onboard_welcome')}</h2>
                                <p className="text-lg text-slate-500 mb-8">Toko {form.storeName} sudah siap digunakan.</p>

                                <div className="max-w-xs mx-auto text-left bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-6 mb-10 space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('onboard_summary_type')}</p>
                                        <p className="font-semibold text-slate-700 dark:text-slate-300 capitalize">
                                            {form.businessType || '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">{t('onboard_summary_features')}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {form.mainFeatures.map(feat => (
                                                <span key={feat} className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold rounded capitalize">
                                                    {feat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => completeOnboarding()}
                                    disabled={loading}
                                    className="w-full sm:w-auto px-10 py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-2xl font-bold text-lg inline-flex items-center justify-center gap-3 shadow-xl shadow-violet-500/30 transition-all hover:scale-105 active:scale-95"
                                >
                                    {loading ? t('loading') : t('onboard_finish')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Floating Navigation (Steps 1-3) */}
            {step < 4 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 z-50">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <button
                            onClick={() => setStep(s => Math.max(1, s - 1))}
                            disabled={step === 1 || loading}
                            className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-0 transition-all duration-300"
                        >
                            <ArrowLeft size={18} /> {t('onboard_back')}
                        </button>
                        
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepValid() || loading}
                            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 disabled:dark:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all duration-300"
                        >
                            {t('onboard_next')} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
