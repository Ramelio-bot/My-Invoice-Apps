import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, CheckCircle, Zap } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
    ID: {
        heroTitle: 'Tentang My Invoice',
        heroSub: 'Menjadi platform keuangan terpercaya untuk UMKM Indonesia',
        missionTitle: 'Misi Kami',
        missionDesc: 'Membantu pemilik bisnis mengelola keuangan dengan mudah, profesional, dan efisien tanpa perlu keahlian akuntansi khusus.',
        stats1: 'Pengguna',
        stats2: 'Dokumen',
        stats3: 'Rating',
        stats4: 'Uptime',
        featuresTitle: 'Mengapa Memilih Kami?',
        feat1: 'Cepat & Mudah', feat1d: 'Buat Invoice, Kwitansi, atau PO dalam hitungan detik.',
        feat2: 'Aman di Cloud', feat2d: 'Data tersimpan dengan aman menggunakan enkripsi standar industri.',
        feat3: 'Laporan Otomatis', feat3d: 'Dapatkan insight bisnis dengan laporan keuangan otomatis.',
        feat4: 'Harga Fleksibel', feat4d: 'Mulai dengan gratis selamanya atau upgrade untuk fitur advance.',
        ctaTitle: 'Siap untuk memulai?',
        ctaBtn: 'Mulai Gratis',
    },
    EN: {
        heroTitle: 'About My Invoice',
        heroSub: 'Becoming the trusted financial platform for Indonesian SMEs',
        missionTitle: 'Our Mission',
        missionDesc: 'Helping business owners manage their finances easily, professionally, and efficiently without needing special accounting skills.',
        stats1: 'Users',
        stats2: 'Documents',
        stats3: 'Rating',
        stats4: 'Uptime',
        featuresTitle: 'Why Choose Us?',
        feat1: 'Fast & Easy', feat1d: 'Create Invoices, Receipts, or Pros in seconds.',
        feat2: 'Secure Cloud', feat2d: 'Data is stored safely using industry standard encryption.',
        feat3: 'Auto Reports', feat3d: 'Get business insights with automated financial reports.',
        feat4: 'Flexible Pricing', feat4d: 'Start free forever or upgrade for advanced features.',
        ctaTitle: 'Ready to start?',
        ctaBtn: 'Get Started Free',
    }
};

export default function About() {
    const { lang } = useLang();
    const navigate = useNavigate();
    const { user } = useAuth();
    const c = copy[lang];

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 transition-colors duration-200 bg-slate-50 text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="max-w-6xl mx-auto">

            <LandingNavbar />

                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                        <Users size={16} />
                        My Invoice
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">
                        {c.heroTitle}
                    </h1>
                    <p className="text-xl md:text-2xl max-w-3xl mx-auto text-slate-600">
                        {c.heroSub}
                    </p>
                </div>

                {/* Mission Section */}
                <div className="rounded-3xl p-8 md:p-12 mb-16 text-center shadow-xl border bg-white border-slate-100 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold mb-4">{c.missionTitle}</h2>
                    <p className="text-lg md:text-xl max-w-4xl mx-auto leading-relaxed text-slate-600">
                        "{c.missionDesc}"
                    </p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20 text-center">
                    {[
                        { label: c.stats1, val: '10.000+', icon: Users, color: '#3B82F6' },
                        { label: c.stats2, val: '500.000+', icon: Shield, color: '#10B981' },
                        { label: c.stats3, val: '4.9★', icon: Zap, color: '#F59E0B' },
                        { label: c.stats4, val: '99.9%', icon: CheckCircle, color: '#7C3AED' }
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="p-6 rounded-2xl border transition-transform hover:-translate-y-1 bg-white border-slate-200 shadow-sm">
                                <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${stat.color}15` }}>
                                    <Icon size={24} color={stat.color} />
                                </div>
                                <div className="text-3xl font-black mb-1">{stat.val}</div>
                                <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>

                {/* Features Split */}
                <div className="mb-20">
                    <h2 className="text-3xl font-bold text-center mb-12">{c.featuresTitle}</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            { t: c.feat1, d: c.feat1d, icon: Zap, c: '#7C3AED' },
                            { t: c.feat2, d: c.feat2d, icon: Shield, c: '#3B82F6' },
                            { t: c.feat3, d: c.feat3d, icon: CheckCircle, c: '#10B981' },
                            { t: c.feat4, d: c.feat4d, icon: Users, c: '#F59E0B' },
                        ].map((f, i) => (
                            <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                                <div className="mt-1 flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${f.c}20`, color: f.c }}>
                                    <f.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{f.t}</h3>
                                    <p className="text-slate-600 leading-relaxed">{f.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-8">{c.ctaTitle}</h2>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-10 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-1 hover:shadow-violet-600/50"
                    >
                        {c.ctaBtn}
                    </button>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
