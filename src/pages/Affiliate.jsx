import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function Affiliate() {
    const { t } = useLang();
//     const navigate = useNavigate();
    const [refs, setRefs] = useState(10);
    const [plan, setPlan] = useState(25800);

    const commissions = [
        { plan: 'PRO Monthly', rate: '20%', amount: 25800, base: t('currency_symbol') === '$' ? '$8.00/mo' : 'Rp 129.000/bln' },
        { plan: 'ULTIMATE Monthly', rate: '20%', amount: 29800, base: t('currency_symbol') === '$' ? '$10.00/mo' : 'Rp 149.000/bln' },
        { plan: 'PRO Annual', rate: '15%', amount: 154000, base: t('currency_symbol') === '$' ? '$65.00/yr' : 'Rp 1.029.000/thn' },
        { plan: 'ULTIMATE Annual', rate: '11%', amount: 164000, base: t('currency_symbol') === '$' ? '$95.00/yr' : 'Rp 1.490.000/thn' },
    ];

    const faqs = [
        {
            q: t('aff_faq_1_q'),
            a: t('aff_faq_1_a')
        },
        {
            q: t('aff_faq_2_q'),
            a: t('aff_faq_2_a')
        },
        {
            q: t('aff_faq_3_q'),
            a: t('aff_faq_3_a')
        },
        {
            q: t('aff_faq_4_q'),
            a: t('aff_faq_4_a')
        },
        {
            q: t('aff_faq_5_q'),
            a: t('aff_faq_5_a')
        },
        {
            q: t('aff_faq_6_q'),
            a: t('aff_faq_6_a')
        },
    ];

    const [openFaq, setOpenFaq] = useState(0);

    const PURPLE = '#7C3AED';
    const MAYAR_AFFILIATE_URL = 'https://web.mayar.id/sign-in/referral/qBcmbLZ';

    const totalComm = refs * plan;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-300">

            <LandingNavbar />

            {/* HERO */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                        style={{ background: `${PURPLE}15`, color: PURPLE }}
                    >
                        <span>✨</span>
                        {t('aff_badge')}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        {t('aff_hero_1')}
                        <br />
                        <span style={{ color: PURPLE }}>{t('aff_hero_2')}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {t('aff_hero_desc')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href={MAYAR_AFFILIATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
                            style={{ backgroundColor: PURPLE }}
                        >
                            {t('aff_cta_start')}
                        </a>
                        <a
                            href="#cara-kerja"
                            className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-2xl transition-all border border-slate-200 shadow-sm"
                        >
                            {t('aff_cta_learn')}
                        </a>
                    </div>
                </div>
            </div>

            {/* COMMISSION CARDS */}
            <div className="py-20 px-6 bg-white border-y border-slate-100">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            {t('aff_struct_badge')}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-4">
                            {t('aff_struct_title')}
                        </h2>
                        <p className="text-slate-600">
                            {t('aff_struct_desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {commissions.map((c, i) => (
                            <div key={i} className="p-8 rounded-3xl border bg-white border-slate-200 transition-all hover:border-violet-500 shadow-xl shadow-slate-100">
                                <div className="text-sm font-bold text-slate-500 mb-2">{c.plan}</div>
                                <div className="text-4xl font-black mb-1" style={{ color: PURPLE }}>{c.rate}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">{t('aff_per_sale')}</div>
                                <div className="text-xl font-black mb-1 text-slate-900">≈ Rp {c.amount.toLocaleString(t('locale_code'))}</div>
                                <div className="text-xs text-slate-500 font-medium">{t('aff_from')} {c.base}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CALCULATOR */}
            <div className="py-24 px-6 bg-slate-50">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-[40px] overflow-hidden border bg-white border-slate-200 p-8 md:p-16 shadow-2xl shadow-slate-200/50">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div
                                    className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                    style={{ background: `${PURPLE}15`, color: PURPLE }}
                                >
                                    {t('aff_calc_badge')}
                                </div>

                                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                                    {t('aff_calc_title')}
                                </h2>
                                <p className="text-slate-600 text-lg mb-0">
                                    {t('aff_calc_desc')}
                                </p>
                            </div>

                            <div className="p-8 rounded-3xl bg-slate-50 border-slate-200 border shadow-2xl">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-500 mb-3">
                                        {t('aff_calc_refs_label')}
                                    </label>
                                    <input
                                        type="number"
                                        value={refs}
                                        onChange={(e) => setRefs(parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '1px solid', borderColor: '#E2E8F0', borderRadius: 12, fontSize: 16, fontWeight: 600, color: '#0F172A', fontFamily: 'monospace', outline: 'none' }}
                                    />
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-slate-500 mb-3">
                                        {t('aff_calc_plan_label')}
                                    </label>
                                    <select
                                        value={plan}
                                        onChange={(e) => setPlan(parseInt(e.target.value))}
                                        style={{ width: '100%', padding: '14px 16px', background: '#F8FAFC', border: '1px solid', borderColor: '#E2E8F0', borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#0F172A', outline: 'none' }}
                                    >
                                        {commissions.map((c, i) => (
                                            <option key={i} value={c.amount}>{c.plan} — Rp {c.amount.toLocaleString(t('locale_code'))}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <div className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                                        {t('aff_calc_est_label')}
                                    </div>

                                    <div className="text-4xl md:text-5xl font-black" style={{ color: PURPLE }}>
                                        Rp {totalComm.toLocaleString(t('locale_code'))}
                                    </div>

                                    <div className="mt-2 text-xs font-bold text-slate-400">
                                        {refs} referral × Rp {plan.toLocaleString(t('locale_code'))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HOW IT WORKS */}
            <div id="cara-kerja" className="py-24 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            {t('aff_how_badge')}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {t('aff_how_title')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { num: '01', title: t('aff_how_s1_title'), desc: t('aff_how_s1_desc') },
                            { num: '02', title: t('aff_how_s2_title'), desc: t('aff_how_s2_desc') },
                            { num: '03', title: t('aff_how_s3_title'), desc: t('aff_how_s3_desc') },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="text-8xl font-black absolute -top-10 -left-4 opacity-5 pointer-events-none" style={{ color: PURPLE }}>{item.num}</div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black mb-4">{item.title}</h3>
                                    <p className="text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FAQ */}
            <div className="py-24 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            FAQ
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black">
                            {t('aff_faq_title')}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-6 rounded-2xl border bg-white border-slate-200">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left', fontSize: 15, fontWeight: 700, color: '#0F172A', fontFamily: 'inherit', padding: 0 }}
                                >
                                    {faq.q}
                                    <span className="text-xl opacity-50">
                                        {openFaq === i ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 text-sm md:text-base text-slate-600 leading-relaxed">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="py-24 px-6 bg-slate-100 text-slate-900">
                <div className="max-w-4xl mx-auto rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {t('aff_cta_footer_title')}
                        </h2>
                        <p className="text-slate-600 text-lg mb-10">
                            {t('aff_cta_footer_desc')}
                        </p>

                        <a
                            href={MAYAR_AFFILIATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-10 py-5 bg-violet-600 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-105"
                            style={{ backgroundColor: PURPLE }}
                        >
                            {t('aff_cta_footer_btn')}
                        </a>
                    </div>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
