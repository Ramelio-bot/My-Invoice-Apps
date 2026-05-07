
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function Karir() {
    const { t } = useLang();
//     const navigate = useNavigate();

    const PURPLE = '#7C3AED';
//     const cardStyle = { borderRadius: 20, padding: '28px 24px', transition: 'all 0.2s' };

    const values = [
        { num: '01', title: t('career_value_v1_t'), desc: t('career_value_v1_d') },
        { num: '02', title: t('career_value_v2_t'), desc: t('career_value_v2_d') },
        { num: '03', title: t('career_value_v3_t'), desc: t('career_value_v3_d') },
    ];

    const benefits = [
        { 
            title: t('career_benefit_1_t') || 'Kerja Fleksibel (WFA)', 
            desc: t('career_benefit_1_d') || 'Bekerja dengan nyaman dari mana saja. Kami menilai hasil nyata, bukan sekadar jam duduk di meja kantor.' 
        },
        { 
            title: t('career_benefit_2_t') || 'Lingkungan Inovatif', 
            desc: t('career_benefit_2_d') || 'Eksplorasi teknologi terbaru dan realisasikan ide-ide liar Anda bersama tim yang penuh semangat.' 
        },
        { 
            title: t('career_benefit_3_t') || 'Pertumbuhan Karir', 
            desc: t('career_benefit_3_d') || 'Dukungan penuh untuk belajar hal baru, ruang diskusi terbuka, dan kesempatan memimpin proyek.' 
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-300">

            <LandingNavbar />

            {/* HERO */}
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                        style={{ background: `${PURPLE}15`, color: PURPLE }}
                    >
                        <span></span>
                        {t('karir_badge')}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        {t('karir_hero_1')}
                        <br />
                        <span style={{ color: PURPLE }}>{t('karir_hero_2')}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        {t('karir_hero_desc')}
                    </p>
                </div>
            </div>

            {/* VALUES */}
            <div className="py-20 px-6 bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map((v, i) => (
                        <div key={i} className="p-8 rounded-3xl border bg-white border-slate-200 transition-all hover:scale-105">
                            <div className="text-4xl font-black mb-6" style={{ color: PURPLE, opacity: 0.3 }}>{v.num}</div>
                            <h3 className="text-xl font-black mb-4">{v.title}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* JOBS — EMPTY STATE */}
            <div className="py-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            {t('karir_values_badge')}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {t('karir_values_title')}
                        </h2>
                    </div>

                    {/* JOBS EMPTY — RECRUITMENT CLOSED */}
                    <div className="p-10 md:p-20 rounded-[40px] text-center border-2 border-dashed border-slate-200 bg-white shadow-sm">
                        <div className="w-20 h-20 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl">🏜️</span>
                        </div>

                        <h3 className="text-2xl font-black mb-4">
                            {t('karir_empty_title')}
                        </h3>

                        <p className="text-slate-600 max-w-md mx-auto mb-10 text-lg">
                            {t('karir_empty_desc')}
                        </p>

                        <div className="p-6 inline-flex rounded-2xl bg-white shadow-xl border border-slate-100">
                            <div className="text-left">
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {t('karir_info_label')}
                                </span>
                                <span className="font-bold text-violet-600">hello.myinvoice@gmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BENEFITS */}
            <div className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-violet-600 uppercase tracking-[0.2em] mb-4">
                            {t('karir_offer_badge')}
                        </h2>
                        <h3 className="text-3xl md:text-5xl font-black">
                            {t('karir_offer_title')}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((b, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-white shadow-xl shadow-slate-100 border border-slate-100">
                                <h4 className="text-lg font-black mb-3">{b.title}</h4>
                                <p className="text-slate-600 text-sm leading-relaxed">{b.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECRUITMENT CLOSED NOTICE */}
            <div className="py-24 px-6 bg-slate-100 border-t border-slate-100">
                <div className="max-w-4xl mx-auto bg-white text-slate-900 border border-slate-200 rounded-[40px] p-10 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>

                    <div className="relative z-10">
                        <div className="inline-block px-4 py-1 rounded-full text-xs font-black bg-violet-100 text-violet-700 mb-6 uppercase tracking-widest">
                            {t('karir_notice_badge')}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-6">
                            {t('karir_notice_title')}
                        </h2>

                        <p className="text-slate-600 text-lg mb-10 leading-relaxed uppercase">
                            {t('karir_notice_desc')}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-slate-100">
                            <div>
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    {t('career_status_label')}
                                </div>
                                <div className="text-xl font-bold text-red-500">
                                    {t('career_status_closed')}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    {t('career_pos_available')}
                                </div>
                                <div className="text-xl font-bold text-slate-900">
                                    {t('career_pos_count')}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-sm text-slate-500 font-bold">
                            {t('karir_general_q')}
                            <span className="text-slate-900">hello.myinvoice@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
