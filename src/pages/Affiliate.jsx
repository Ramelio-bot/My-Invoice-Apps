import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Affiliate() {
    const { lang } = useLang();
    const { dark } = useTheme();
    const navigate = useNavigate();
    const [refs, setRefs] = useState(10);
    const [plan, setPlan] = useState(25800);

    const commissions = [
        { plan: 'PRO Monthly', rate: '20%', amount: 25800, base: lang === 'ID' ? 'Rp 129.000/bln' : 'Rp 129,000/mo' },
        { plan: 'ULTIMATE Monthly', rate: '20%', amount: 29800, base: lang === 'ID' ? 'Rp 149.000/bln' : 'Rp 149,000/mo' },
        { plan: 'PRO Annual', rate: '15%', amount: 154000, base: lang === 'ID' ? 'Rp 1.029.000/thn' : 'Rp 1,029,000/yr' },
        { plan: 'ULTIMATE Annual', rate: '11%', amount: 164000, base: lang === 'ID' ? 'Rp 1.490.000/thn' : 'Rp 1,490,000/yr' },
    ];

    const faqs = [
        {
            q: { id: 'Siapa yang bisa menjadi affiliate My Invoice?', en: 'Who can become a My Invoice affiliate?' },
            a: { id: 'Siapa saja dapat mendaftar — konsultan bisnis, content creator, komunitas UMKM, akuntan, atau siapapun yang memiliki jaringan pelaku usaha.', en: 'Anyone can apply — business consultants, content creators, UMKM communities, accountants, or anyone with a network of business owners.' }
        },
        {
            q: { id: 'Apakah ada biaya untuk bergabung?', en: 'Is there a fee to join?' },
            a: { id: 'Tidak ada biaya apapun. Program affiliate My Invoice sepenuhnya gratis.', en: 'No fees at all. My Invoice affiliate program is completely free to join.' }
        },
        {
            q: { id: 'Bagaimana komisi dibayarkan?', en: 'How are commissions paid?' },
            a: { id: 'Komisi diproses melalui platform Mayar.id. Komisi diberikan satu kali per transaksi baru — tidak berlaku untuk perpanjangan langganan.', en: 'Commissions are processed through Mayar.id platform. Commissions are paid once per new transaction — not applicable for subscription renewals.' }
        },
        {
            q: { id: 'Apakah saya bisa memantau performa referral?', en: 'Can I track my referral performance?' },
            a: { id: 'Ya. Pantau jumlah klik, leads, dan konversi secara real-time melalui dashboard affiliate di Mayar.id.', en: 'Yes. Track clicks, leads, and conversions in real-time through your affiliate dashboard at Mayar.id.' }
        },
        {
            q: { id: 'Apakah ada materi promosi?', en: 'Are there promotional materials available?' },
            a: { id: 'Kami menyediakan materi promosi dasar. Untuk kebutuhan khusus, hubungi tim kami.', en: 'We provide basic promotional materials. For specific needs, contact our team.' }
        },
        {
            q: { id: 'Berapa lama proses pencairan komisi?', en: 'How long does commission payout take?' },
            a: { id: 'Pencairan mengikuti jadwal payout Mayar.id. Detail tersedia di dashboard Mayar Anda setelah mendaftar.', en: 'Payout follows Mayar.id schedule. Details are available in your Mayar dashboard after registration.' }
        },
    ];

    const [openFaq, setOpenFaq] = useState(0);

    const PURPLE = '#7C3AED';
    const MAYAR_AFFILIATE_URL = 'https://web.mayar.id/sign-in/referral/qBcmbLZ';

    const totalComm = refs * plan;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0F172A] text-slate-800 dark:text-white font-sans">

            {/* BACK BUTTON */}
            <div style={{ padding: '16px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 50 }}>
                <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#94A3B8' : '#64748B', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', padding: '8px 0', transition: 'color 0.2s' }}>
                    ← {lang === 'ID' ? 'Kembali' : 'Back'}
                </button>
            </div>

            {/* HERO */}
            <div className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                        style={{ background: `${PURPLE}15`, color: PURPLE }}
                    >
                        <span>✨</span>
                        {lang === 'ID' ? 'Program Affiliate' : 'Affiliate Program'}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        {lang === 'ID' ? 'Rekomendasikan My Invoice.' : 'Recommend My Invoice.'}
                        <br />
                        <span style={{ color: PURPLE }}>{lang === 'ID' ? 'Dapatkan komisi.' : 'Earn commissions.'}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        {lang === 'ID'
                            ? 'Bagikan My Invoice kepada rekan bisnis atau audiens Anda dan dapatkan komisi hingga 20% untuk setiap pelanggan baru.'
                            : 'Share My Invoice with your business network or audience and earn up to 20% commission for every new subscriber.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href={MAYAR_AFFILIATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
                            style={{ backgroundColor: PURPLE }}
                        >
                            {lang === 'ID' ? 'Mulai Sebagai Affiliate' : 'Start as Affiliate'}
                        </a>
                        <a
                            href="#cara-kerja"
                            className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold rounded-2xl transition-all"
                        >
                            {lang === 'ID' ? 'Pelajari Cara Kerja' : 'Learn How It Works'}
                        </a>
                    </div>
                </div>
            </div>

            {/* COMMISSION CARDS */}
            <div className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            {lang === 'ID' ? 'Struktur Komisi' : 'Commission Structure'}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-4">
                            {lang === 'ID' ? 'Komisi transparan, tidak ada biaya tersembunyi' : 'Transparent commissions, no hidden fees'}
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            {lang === 'ID' ? 'Komisi dibayarkan satu kali per transaksi baru melalui Mayar.id.' : 'Commissions paid once per new transaction via Mayar.id.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {commissions.map((c, i) => (
                            <div key={i} className="p-8 rounded-3xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all hover:border-violet-500 shadow-xl shadow-slate-200/50 dark:shadow-none">
                                <div className="text-sm font-bold text-slate-500 mb-2">{c.plan}</div>
                                <div className="text-4xl font-black mb-1" style={{ color: PURPLE }}>{c.rate}</div>
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">{lang === 'ID' ? 'per penjualan' : 'per sale'}</div>
                                <div className="text-xl font-black mb-1">≈ Rp {c.amount.toLocaleString('id-ID')}</div>
                                <div className="text-xs text-slate-500">{lang === 'ID' ? 'dari' : 'from'} {c.base}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CALCULATOR */}
            <div className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="rounded-[40px] overflow-hidden border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 p-8 md:p-16">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div
                                    className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                                    style={{ background: `${PURPLE}15`, color: PURPLE }}
                                >
                                    {lang === 'ID' ? 'Kalkulator Komisi' : 'Commission Calculator'}
                                </div>

                                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                                    {lang === 'ID' ? 'Hitung potensi penghasilan Anda' : 'Calculate your earning potential'}
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-0">
                                    {lang === 'ID' ? 'Tidak ada batas maksimum penghasilan. Semakin besar audiens, semakin besar potensi komisi Anda.' : 'No maximum earnings limit. The larger your audience, the greater your commission potential.'}
                                </p>
                            </div>

                            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 border shadow-2xl">
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-slate-500 mb-3">
                                        {lang === 'ID' ? 'Jumlah referral per bulan' : 'Referrals per month'}
                                    </label>
                                    <input
                                        type="number"
                                        value={refs}
                                        onChange={(e) => setRefs(parseInt(e.target.value) || 0)}
                                        style={{ width: '100%', padding: '14px 16px', background: dark ? '#0F172A' : '#F8FAFC', border: '1px solid', borderColor: dark ? '#334155' : '#E2E8F0', borderRadius: 12, fontSize: 16, fontWeight: 600, color: dark ? '#F8FAFC' : '#0F172A', fontFamily: 'monospace', outline: 'none' }}
                                    />
                                </div>

                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-slate-500 mb-3">
                                        {lang === 'ID' ? 'Paket yang dipilih' : 'Selected plan'}
                                    </label>
                                    <select
                                        value={plan}
                                        onChange={(e) => setPlan(parseInt(e.target.value))}
                                        style={{ width: '100%', padding: '14px 16px', background: dark ? '#0F172A' : '#F8FAFC', border: '1px solid', borderColor: dark ? '#334155' : '#E2E8F0', borderRadius: 12, fontSize: 15, fontWeight: 600, color: dark ? '#F8FAFC' : '#0F172A', outline: 'none' }}
                                    >
                                        {commissions.map((c, i) => (
                                            <option key={i} value={c.amount}>{c.plan} — Rp {c.amount.toLocaleString('id-ID')}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-widest">
                                        {lang === 'ID' ? 'Estimasi komisi' : 'Estimated commission'}
                                    </div>

                                    <div className="text-4xl md:text-5xl font-black" style={{ color: PURPLE }}>
                                        Rp {totalComm.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}
                                    </div>

                                    <div className="mt-2 text-xs font-bold text-slate-400">
                                        {refs} referral × Rp {plan.toLocaleString(lang === 'ID' ? 'id-ID' : 'en-US')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* HOW IT WORKS */}
            <div id="cara-kerja" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <div
                            className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4"
                            style={{ background: `${PURPLE}15`, color: PURPLE }}
                        >
                            {lang === 'ID' ? 'Cara Kerja' : 'How It Works'}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {lang === 'ID' ? 'Tiga langkah untuk mulai menghasilkan' : 'Three steps to start earning'}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { num: '01', title: { id: 'Daftar sebagai affiliate', en: 'Register as affiliate' }, desc: { id: 'Buat akun affiliate gratis melalui Mayar.id menggunakan tautan pendaftaran kami. Terbuka untuk siapa saja.', en: 'Create a free affiliate account via Mayar.id using our registration link. Open to everyone.' } },
                            { num: '02', title: { id: 'Bagikan tautan unik Anda', en: 'Share your unique link' }, desc: { id: 'Setelah terdaftar, bagikan tautan referral unik Anda kepada rekan bisnis, komunitas, atau audiens media sosial.', en: 'After registering, share your unique referral link with business contacts, communities, or social media audiences.' } },
                            { num: '03', title: { id: 'Terima komisi otomatis', en: 'Receive automatic commissions' }, desc: { id: 'Setiap langganan baru melalui tautan Anda, komisi langsung masuk ke akun Mayar Anda secara otomatis.', en: 'Every new subscription through your link, commission is automatically credited to your Mayar account.' } },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="text-8xl font-black absolute -top-10 -left-4 opacity-5 pointer-events-none" style={{ color: PURPLE }}>{item.num}</div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black mb-4">{lang === 'ID' ? item.title.id : item.title.en}</h3>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{lang === 'ID' ? item.desc.id : item.desc.en}</p>
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
                            {lang === 'ID' ? 'Pertanyaan yang sering diajukan' : 'Frequently asked questions'}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="p-6 rounded-2xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, textAlign: 'left', fontSize: 15, fontWeight: 700, color: dark ? '#F8FAFC' : '#0F172A', fontFamily: 'inherit', padding: 0 }}
                                >
                                    {lang === 'ID' ? faq.q.id : faq.q.en}
                                    <span className="text-xl opacity-50">
                                        {openFaq === i ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaq === i && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {lang === 'ID' ? faq.a.id : faq.a.en}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="py-24 px-6 bg-white dark:bg-[#0F172A] text-slate-900 dark:text-white">
                <div className="max-w-4xl mx-auto rounded-[40px] p-10 md:p-20 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${PURPLE}, #4C1D95)` }}>
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {lang === 'ID' ? 'Mulai hasilkan komisi hari ini.' : 'Start earning commissions today.'}
                        </h2>
                        <p className="text-white/80 text-lg mb-10">
                            {lang === 'ID' ? 'Daftar gratis. Tidak ada target minimum.' : 'Free registration. No minimum targets.'}
                        </p>

                        <a
                            href={MAYAR_AFFILIATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-10 py-5 bg-white text-violet-700 font-black rounded-2xl shadow-2xl transition-all hover:scale-105"
                        >
                            {lang === 'ID' ? 'Daftar Sekarang via Mayar.id' : 'Register Now via Mayar.id'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
