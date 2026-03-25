import { useNavigate } from 'react-router-dom';
import { ExternalLink, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
    ID: {
        title: 'Blog My Invoice',
        subtitle: 'Tips bisnis, panduan keuangan, dan berita terbaru untuk UMKM Indonesia.',
        featured: 'Artikel Pilihan',
        btnRead: 'Baca Artikel',
        btnAll: 'Baca Semua Artikel',
        articles: [
            {
                title: '5 Cara Ampuh Menagih Piutang Klien Tanpa Merusak Hubungan',
                desc: 'Pelajari strategi komunikasi dan penggunaan tools otomatis untuk memastikan invoice Anda dibayar tepat waktu.',
                readTime: '5 min read',
                category: 'Tips Bisnis'
            },
            {
                title: 'Panduan Lengkap Menghitung HPP untuk Bisnis F&B',
                desc: 'Jangan sampai rugi! Ini cara tepat menghitung Harga Pokok Penjualan agar profit margin tetap terjaga.',
                readTime: '8 min read',
                category: 'Keuangan'
            },
            {
                title: 'Pentingnya Digitalisasi Dokumen Usaha di Era Modern',
                desc: 'Tinggalkan cara manual. Ketahui mengapa beralih ke invoice digital bisa menghemat waktu dan biaya operasional Anda.',
                readTime: '4 min read',
                category: 'Teknologi'
            }
        ]
    },
    EN: {
        title: 'My Invoice Blog',
        subtitle: 'Business tips, financial guides, and latest news for Indonesian SMEs.',
        featured: 'Featured Articles',
        btnRead: 'Read Article',
        btnAll: 'Read All Articles',
        articles: [
            {
                title: '5 Effective Ways to Collect Client Debts Without Ruining Relationships',
                desc: 'Learn communication strategies and automated tools to ensure your invoices are paid on time.',
                readTime: '5 min read',
                category: 'Business Tips'
            },
            {
                title: 'Complete Guide to Calculating COGS for F&B Businesses',
                desc: 'Don\'t lose money! Here\'s the right way to calculate Cost of Goods Sold to maintain profit margins.',
                readTime: '8 min read',
                category: 'Finance'
            },
            {
                title: 'The Importance of Business Document Digitalization in Modern Era',
                desc: 'Leave manual methods behind. Find out why switching to digital invoices can save your operational time and costs.',
                readTime: '4 min read',
                category: 'Technology'
            }
        ]
    }
};

export default function Blog() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const navigate = useNavigate();
    const { user } = useAuth();
    const c = copy[lang];

    const handleRedirect = () => {
        window.open('https://artikel.myinvoice.space', '_blank');
    };

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${dark ? 'bg-[#0F172A]' : 'bg-slate-50'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <LandingNavbar />
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: dark ? 'rgba(124,58,237,0.2)' : '#EDE9FE', color: '#7C3AED' }}>
                        <BookOpen size={16} />
                        Resource Center
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-black mb-6 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {c.title}
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {c.subtitle}
                    </p>
                </div>

                {/* Featured Articles Grid */}
                <div className="mb-12">
                    <h2 className={`text-2xl font-bold mb-8 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.featured}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {c.articles.map((article, i) => (
                            <div
                                key={i}
                                onClick={handleRedirect}
                                className={`group cursor-pointer rounded-2xl flex flex-col h-full border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${dark ? 'bg-slate-800/80 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-violet-100'}`}
                            >
                                <div className={`h-48 rounded-t-2xl relative overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                                    {/* Dummy Image Placeholder */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                                        <BookOpen size={48} className="text-violet-500/30" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-full text-xs font-bold text-violet-600 dark:text-violet-400">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className={`flex items-center gap-2 text-sm font-semibold mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        <Clock size={14} />
                                        {article.readTime}
                                    </div>
                                    <h3 className={`text-xl font-bold mb-3 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors ${dark ? 'text-white' : 'text-slate-900'}`}>
                                        {article.title}
                                    </h3>
                                    <p className={`mb-6 line-clamp-3 flex-grow ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                                        {article.desc}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-violet-600 dark:text-violet-400 mt-auto">
                                        {c.btnRead}
                                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Big CTA out to blog subdomain */}
                <div className="text-center mt-16 pb-8">
                    <button
                        onClick={handleRedirect}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-1 hover:shadow-violet-600/50"
                    >
                        {c.btnAll}
                        <ExternalLink size={20} />
                    </button>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
