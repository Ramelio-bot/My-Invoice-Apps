import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function Karir() {
    const { lang } = useLang();
    const { dark } = useTheme();
    const navigate = useNavigate();

    const PURPLE = '#7C3AED';
    const cardStyle = { background: dark ? '#1E293B' : 'white', border: '1px solid', borderColor: dark ? '#334155' : '#E2E8F0', borderRadius: 20, padding: '28px 24px', transition: 'all 0.2s' };

    const values = [
        { num: '01', title: { id: 'Dampak Nyata', en: 'Real Impact' }, desc: { id: 'Fitur yang kami bangun langsung digunakan oleh pemilik usaha nyata. Pekerjaan Anda berdampak langsung.', en: 'Features we build are directly used by real business owners. Your work makes a direct impact.' } },
        { num: '02', title: { id: 'Pertumbuhan Cepat', en: 'Fast Growth' }, desc: { id: 'Kami bergerak dan belajar cepat. Setiap anggota tim mendapat ruang untuk berkembang melampaui peran formal.', en: 'We move and learn fast. Every team member gets room to grow beyond their formal role.' } },
        { num: '03', title: { id: 'Kepemilikan Penuh', en: 'Full Ownership' }, desc: { id: 'Kami mempercayakan tanggung jawab penuh atas pekerjaan Anda. Tidak ada hierarki yang menghambat ide baik.', en: 'We trust you with full ownership of your work. No hierarchy blocking good ideas.' } },
        { num: '04', title: { id: 'Transparansi', en: 'Transparency' }, desc: { id: 'Keputusan bisnis, angka pertumbuhan, dan arah strategi dibagikan secara terbuka kepada seluruh tim.', en: 'Business decisions, growth numbers, and strategic direction are shared openly with the entire team.' } },
    ];

    const benefits = [
        { title: { id: 'Fleksibilitas Kerja', en: 'Work Flexibility' }, desc: { id: 'Kami mengutamakan hasil, bukan jam kerja. Atur ritme kerja Anda selama target tercapai.', en: 'We prioritize results, not hours. Set your own rhythm as long as targets are met.' } },
        { title: { id: 'Akses Produk Penuh', en: 'Full Product Access' }, desc: { id: 'Seluruh anggota tim mendapat akses ULTIMATE tanpa biaya untuk digunakan sendiri maupun keluarga.', en: 'All team members get free ULTIMATE access for personal and family use.' } },
        { title: { id: 'Lingkungan Belajar', en: 'Learning Environment' }, desc: { id: 'Kami mendukung pengembangan diri melalui akses ke kursus dan sumber belajar yang relevan.', en: 'We support personal development through access to relevant courses and learning resources.' } },
        { title: { id: 'Peran Bermakna', en: 'Meaningful Role' }, desc: { id: 'Di tahap ini, setiap anggota tim memiliki pengaruh signifikan terhadap arah produk dan perusahaan.', en: 'At this stage, every team member has significant influence on product and company direction.' } },
        { title: { id: 'Kompensasi Kompetitif', en: 'Competitive Compensation' }, desc: { id: 'Kompensasi yang adil dan transparan, ditinjau secara berkala seiring pertumbuhan perusahaan.', en: 'Fair and transparent compensation, reviewed regularly as the company grows.' } },
        { title: { id: 'Tim yang Solid', en: 'Solid Team' }, desc: { id: 'Bekerja bersama orang-orang yang peduli dengan kualitas pekerjaan dan pertumbuhan satu sama lain.', en: 'Work with people who care about work quality and each other\'s growth.' } },
    ];

    return (
        <div className={`min-h-screen ${dark ? 'bg-[#0F172A] text-white' : 'bg-white text-slate-800'} font-sans`}>

            {/* BACK BUTTON */}
            <div style={{ padding: '16px 24px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 50 }}>
                <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/dashboard')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: dark ? '#94A3B8' : '#64748B', fontSize: 14, fontWeight: 600, fontFamily: 'inherit', padding: '8px 0', transition: 'color 0.2s' }}>
                    ← {lang === 'ID' ? 'Kembali' : 'Back'}
                </button>
            </div>

            {/* HERO */}
            <div className="pt-32 pb-24 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                        style={{ background: `${PURPLE}15`, color: PURPLE }}
                    >
                        <span></span>
                        {lang === 'ID' ? 'Karir di My Invoice' : 'Careers at My Invoice'}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
                        {lang === 'ID' ? 'Bangun masa depan bersama' : 'Build the future with'}
                        <br />
                        <span style={{ color: PURPLE }}>{lang === 'ID' ? 'tim kami.' : 'our team.'}</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        {lang === 'ID'
                            ? 'My Invoice sedang membangun infrastruktur keuangan digital untuk jutaan UMKM di Indonesia. Kami mencari orang-orang yang ingin membuat dampak nyata.'
                            : 'My Invoice is building digital financial infrastructure for millions of Indonesian SMEs. We are looking for people who want to make a real impact.'}
                    </p>
                </div>
            </div>

            {/* VALUES */}
            <div className="py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
                <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {values.map((v, i) => (
                        <div key={i} className={`p-8 rounded-3xl border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} transition-all hover:scale-105`}>
                            <div className="text-4xl font-black mb-6" style={{ color: PURPLE, opacity: 0.3 }}>{v.num}</div>
                            <h3 className="text-xl font-black mb-4">{lang === 'ID' ? v.title.id : v.title.en}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{lang === 'ID' ? v.desc.id : v.desc.en}</p>
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
                            {lang === 'ID' ? 'Posisi Tersedia' : 'Open Positions'}
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-4">
                            {lang === 'ID' ? 'Lowongan yang sedang dibuka' : 'Current job openings'}
                        </h2>
                    </div>

                    {/* JOBS EMPTY — RECRUITMENT CLOSED */}
                    <div className={`p-10 md:p-20 rounded-[40px] text-center border-2 border-dashed ${dark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'}`}>
                        <div className="w-20 h-20 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                            <span className="text-3xl">🏜️</span>
                        </div>

                        <h3 className="text-2xl font-black mb-4">
                            {lang === 'ID' ? 'Rekrutmen Belum Dibuka' : 'Recruitment Not Yet Open'}
                        </h3>

                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-10 text-lg">
                            {lang === 'ID'
                                ? 'Kami saat ini belum membuka rekrutmen. Pantau halaman ini secara berkala — kami akan mengumumkan posisi tersedia di sini ketika waktunya tiba.'
                                : 'We are not currently running an active recruitment process. Check back regularly — we will announce available positions here when the time comes.'}
                        </p>

                        <div className="p-6 inline-flex rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700">
                            <div className="text-left">
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {lang === 'ID' ? 'Informasi: ' : 'Info: '}
                                </span>
                                <span className="font-bold text-violet-600 dark:text-violet-400">hello.myinvoice@gmail.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BENEFITS */}
            <div className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-sm font-black text-violet-600 uppercase tracking-[0.2em] mb-4">
                            {lang === 'ID' ? 'Yang Kami Tawarkan' : 'What We Offer'}
                        </h2>
                        <h3 className="text-3xl md:text-5xl font-black">
                            {lang === 'ID' ? 'Lebih dari sekadar pekerjaan' : 'More than just a job'}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {benefits.map((b, i) => (
                            <div key={i} className={`p-8 rounded-3xl ${dark ? 'bg-[#1E293B]' : 'bg-white'} shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800`}>
                                <h4 className="text-lg font-black mb-3">{lang === 'ID' ? b.title.id : b.title.en}</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{lang === 'ID' ? b.desc.id : b.desc.en}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECRUITMENT CLOSED NOTICE */}
            <div className="py-24 px-6 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-[40px] p-10 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>

                    <div className="relative z-10">
                        <div className="inline-block px-4 py-1 rounded-full text-xs font-black bg-white/10 text-white mb-6 uppercase tracking-widest">
                            {lang === 'ID' ? 'Pemberitahuan' : 'Notice'}
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-6">
                            {lang === 'ID' ? 'Rekrutmen Belum Dibuka Saat Ini' : 'Recruitment Is Not Open at This Time'}
                        </h2>

                        <p className="text-slate-400 text-lg mb-10 leading-relaxed uppercase">
                            {lang === 'ID'
                                ? 'My Invoice saat ini tidak sedang dalam proses rekrutmen aktif. Kami akan mengumumkan lowongan secara resmi di halaman ini ketika posisi tersedia. Tidak ada jalur pendaftaran yang dibuka saat ini.'
                                : 'My Invoice is not currently in an active recruitment process. We will formally announce vacancies on this page when positions become available. No application channels are open at this time.'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-10 border-t border-white/10">
                            <div>
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    {lang === 'ID' ? 'Status Rekrutmen' : 'Recruitment Status'}
                                </div>
                                <div className="text-xl font-bold text-red-400">
                                    {lang === 'ID' ? 'Belum Dibuka' : 'Not Open'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    {lang === 'ID' ? 'Posisi Tersedia' : 'Available Positions'}
                                </div>
                                <div className="text-xl font-bold">
                                    {lang === 'ID' ? '0 posisi' : '0 positions'}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-sm text-slate-500 font-bold">
                            {lang === 'ID' ? 'Pertanyaan umum: ' : 'General inquiries: '}
                            <span className="text-white">hello.myinvoice@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
