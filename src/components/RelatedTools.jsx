import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

const TOOLS = [
    {
        slug: 'buat-invoice-gratis',
        title: 'Buat Invoice Online Gratis',
        desc: 'Faktur tagihan resmi A4 PDF dengan stempel lunas dan kirim via WhatsApp.',
        badge: 'Faktur Tagihan'
    },
    {
        slug: 'buat-kwitansi-gratis',
        title: 'Buat Kwitansi Digital Terbilang',
        desc: 'Generator kwitansi pembayaran dengan ejaan kalimat terbilang rupiah otomatis.',
        badge: 'Kwitansi Resmi'
    },
    {
        slug: 'buat-penawaran-harga-gratis',
        title: 'Surat Penawaran Harga (SPH)',
        desc: 'Quotation harga profesional PDF, mudah dikonversi jadi invoice dalam 1 klik.',
        badge: 'Quotation Proyek'
    },
    {
        slug: 'kalkulator-hpp-gratis',
        title: 'Kalkulator HPP Resep & Menu',
        desc: 'Hitung modal per porsi makanan/minuman dan simulasi komisi GoFood/GrabFood.',
        badge: 'Kuliner & F&B'
    },
    {
        slug: 'aplikasi-kasir-offline',
        title: 'Aplikasi Kasir POS Offline',
        desc: 'Kasir toko dan warung yang tetap jalan tanpa internet & cetak struk Bluetooth.',
        badge: 'POS Tanpa Internet'
    },
    {
        slug: 'aplikasi-kasir-kafe',
        title: 'Kasir Kafe & Resto Mini',
        desc: 'Sistem POS modern untuk kedai kopi dan resto dengan struk dapur dan QRIS.',
        badge: 'Kafe & Resto'
    },
    {
        slug: 'software-invoice-freelance',
        title: 'Invoice Freelance & Agensi',
        desc: 'Kelola termin pembayaran DP, progres, dan pelunasan tagihan klien teratur.',
        badge: 'Freelance & Agensi'
    }
];

export default function RelatedTools({ currentSlug = '', limit = 3 }) {
    const { lang } = useLang();
    const isEn = lang === 'EN';

    const items = TOOLS.filter(t => t.slug !== currentSlug).slice(0, limit);

    return (
        <section className="my-16 pt-12 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
                <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 mb-2">
                        <Sparkles size={13} />
                        <span>{isEn ? 'Free Business Ecosystem' : 'Ekosistem Alat Bisnis Gratis'}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {isEn ? 'Other Free Business Tools You Might Need' : 'Alat Bisnis Gratis Lainnya untuk Usaha Anda'}
                    </h2>
                </div>
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-900 transition-colors"
                >
                    <span>{isEn ? 'View All Features' : 'Lihat Semua Fitur'}</span>
                    <ArrowRight size={13} />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {items.map((tool) => (
                    <Link
                        key={tool.slug}
                        to={`/${tool.slug}`}
                        className="group bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between no-underline"
                    >
                        <div>
                            <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80 mb-3 group-hover:bg-violet-50 group-hover:text-violet-700 group-hover:border-violet-200 transition-colors">
                                {tool.badge}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-violet-700 transition-colors m-0 mb-2 leading-snug">
                                {tool.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed m-0">
                                {tool.desc}
                            </p>
                        </div>

                        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-violet-700">
                            <span>{isEn ? 'Use Tool Free' : 'Gunakan Gratis'}</span>
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
