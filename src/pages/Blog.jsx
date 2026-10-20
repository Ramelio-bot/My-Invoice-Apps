import { ExternalLink, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

const copy = {
    ID: {
        title: 'Blog My Invoice',
        subtitle: 'Tips bisnis, panduan keuangan, dan berita terbaru untuk UMKM Indonesia.',
        featured: 'Artikel Pilihan & Panduan UMKM',
        btnRead: 'Baca Artikel Lengkap',
        btnAll: 'Buka Semua 36+ Artikel di Blog',
        articles: [
            {
                title: 'Cara Mencatat Kas Masuk dan Kas Keluar yang Benar untuk UMKM',
                desc: 'Pelajari langkah praktis mencatat arus kas bisnis agar cash flow tetap sehat, terhindar dari defisit, dan siap berkembang.',
                readTime: '6 min read',
                category: 'Keuangan',
                url: 'https://artikel.myinvoice.space/2026/07/cara-mencatat-kas-masuk-dan-kas-keluar.html'
            },
            {
                title: 'Jebakan "Bulan Depan Pasti Dibayar" & Cara Mengatasinya',
                desc: 'Piutang menumpuk karena janji klien? Simak tips proteksi cash flow dan sistem penagihan faktur otomatis yang profesional.',
                readTime: '5 min read',
                category: 'Manajemen',
                url: 'https://artikel.myinvoice.space/2026/05/jebakan-bulan-depan-pasti-dibayar-cara.html'
            },
            {
                title: 'Bocor Halus: Cara Mendeteksi Pengeluaran Usaha yang Tak Terasa',
                desc: 'Biaya operasional kecil yang luput dari catatan bisa menggerus laba bersih. Temukan cara audit dan efisiensi pengeluaran usaha Anda.',
                readTime: '7 min read',
                category: 'Cash Flow',
                url: 'https://artikel.myinvoice.space/2026/05/bocor-halus-cara-mendeteksi-pengeluaran.html'
            },
            {
                title: '5 Cara Ampuh Menagih Piutang Klien Tanpa Merusak Hubungan',
                desc: 'Pelajari strategi komunikasi dan penggunaan tools otomatis untuk memastikan invoice Anda dibayar tepat waktu.',
                readTime: '5 min read',
                category: 'Tips Bisnis',
                url: 'https://artikel.myinvoice.space/'
            },
            {
                title: 'Panduan Lengkap Menghitung HPP untuk Bisnis F&B',
                desc: 'Jangan sampai rugi! Ini cara tepat menghitung Harga Pokok Penjualan agar profit margin tetap terjaga.',
                readTime: '8 min read',
                category: 'Keuangan',
                url: 'https://artikel.myinvoice.space/'
            },
            {
                title: 'Pentingnya Digitalisasi Dokumen Usaha di Era Modern',
                desc: 'Tinggalkan cara manual. Ketahui mengapa beralih ke invoice digital bisa menghemat waktu dan biaya operasional Anda.',
                readTime: '4 min read',
                category: 'Teknologi',
                url: 'https://artikel.myinvoice.space/'
            }
        ]
    },
    EN: {
        title: 'My Invoice Blog',
        subtitle: 'Business tips, financial guides, and latest news for Indonesian SMEs.',
        featured: 'Featured Articles & Guides',
        btnRead: 'Read Full Article',
        btnAll: 'Open All 36+ Articles on Blog',
        articles: [
            {
                title: 'How to Properly Record Cash In and Cash Out for SMEs',
                desc: 'Learn practical steps to record business cash flow to keep finances healthy and prevent cash deficits.',
                readTime: '6 min read',
                category: 'Finance',
                url: 'https://artikel.myinvoice.space/2026/07/cara-mencatat-kas-masuk-dan-kas-keluar.html'
            },
            {
                title: 'The Trap of "Paid Next Month" & How to Overcome It',
                desc: 'Unpaid invoices piling up? Discover smart cash flow protection tips and automated reminder billing.',
                readTime: '5 min read',
                category: 'Management',
                url: 'https://artikel.myinvoice.space/2026/05/jebakan-bulan-depan-pasti-dibayar-cara.html'
            },
            {
                title: 'Hidden Leaks: How to Detect Subtle Business Expenses',
                desc: 'Small undetected operational costs can wipe out net profits. Audit and streamline your daily business costs.',
                readTime: '7 min read',
                category: 'Cash Flow',
                url: 'https://artikel.myinvoice.space/2026/05/bocor-halus-cara-mendeteksi-pengeluaran.html'
            },
            {
                title: '5 Effective Ways to Collect Client Debts Without Ruining Relationships',
                desc: 'Learn communication strategies and automated tools to ensure your invoices are paid on time.',
                readTime: '5 min read',
                category: 'Business Tips',
                url: 'https://artikel.myinvoice.space/'
            },
            {
                title: 'Complete Guide to Calculating COGS for F&B Businesses',
                desc: 'Don\'t lose money! Here is the right way to calculate Cost of Goods Sold to maintain profit margins.',
                readTime: '8 min read',
                category: 'Finance',
                url: 'https://artikel.myinvoice.space/'
            },
            {
                title: 'The Importance of Business Document Digitalization in Modern Era',
                desc: 'Leave manual methods behind. Find out why switching to digital invoices can save your operational time and costs.',
                readTime: '4 min read',
                category: 'Technology',
                url: 'https://artikel.myinvoice.space/'
            }
        ]
    }
};

export default function Blog() {
    const { lang } = useLang();
    const c = copy[lang];

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200 bg-slate-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <LandingNavbar />
            <div className="max-w-6xl mx-auto">

                {/* Header Section */}
                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: '#EDE9FE', color: '#7C3AED' }}>
                        <BookOpen size={16} />
                        Resource Center
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-slate-900">
                        {c.title}
                    </h1>
                    <p className="text-xl max-w-2xl mx-auto text-slate-600">
                        {c.subtitle}
                    </p>
                </div>

                {/* Featured Articles Grid */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-8 text-slate-900">{c.featured}</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {c.articles.map((article, i) => (
                            <a
                                key={i}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group cursor-pointer rounded-2xl flex flex-col h-full border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white border-slate-200 hover:border-violet-300 hover:shadow-violet-100 no-underline text-inherit"
                            >
                                <div className="h-48 rounded-t-2xl relative overflow-hidden bg-slate-100">
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
                                        <BookOpen size={48} className="text-violet-500/30" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-violet-600">
                                            {article.category}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex items-center gap-2 text-sm font-semibold mb-3 text-slate-500">
                                        <Clock size={14} />
                                        {article.readTime}
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 leading-snug group-hover:text-violet-600 transition-colors text-slate-900">
                                        {article.title}
                                    </h3>
                                    <p className="mb-6 line-clamp-3 flex-grow text-slate-600">
                                        {article.desc}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm font-bold text-violet-600 mt-auto">
                                        {c.btnRead}
                                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Big CTA out to blog subdomain */}
                <div className="text-center mt-16 pb-8">
                    <a
                        href="https://artikel.myinvoice.space/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-1 hover:shadow-violet-600/50 no-underline"
                    >
                        {c.btnAll}
                        <ExternalLink size={20} />
                    </a>
                </div>
            </div>
            <LandingFooter />
        </div>
    );
}
