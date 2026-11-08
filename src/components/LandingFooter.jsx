import { Link } from 'react-router-dom';
import { FileText, Instagram, Facebook } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function LandingFooter() {
    const { t, lang } = useLang();
    const isEn = lang === 'EN';

    const scrollTo = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <footer className="py-24 px-6 border-t transition-colors" style={{ background: 'var(--landing-bg)', borderColor: 'var(--landing-border)' }}>
            <div className="max-w-[1200px] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-left">
                    {/* Col 1: Brand */}
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <FileText size={20} className="text-white" />
                            </div>
                            <span className="text-2xl font-black" style={{ color: 'var(--landing-text)' }}>My Invoice</span>
                        </div>
                        <p className="max-w-xs leading-relaxed m-0" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_tagline')}</p>
                        
                        {/* Social Links */}
                        <div className="flex items-center gap-4 mt-2">
                            <a href="https://www.instagram.com/myinvoice.space/" target="_blank" rel="noreferrer" aria-label="Instagram MyInvoice" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.facebook.com/profile.php?id=61588304236538" target="_blank" rel="noreferrer" aria-label="Facebook MyInvoice" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300">
                                <Facebook size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Col 2: Info */}
                    <div>
                        <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_info')}</h5>
                        <div className="flex flex-col gap-4 text-[15px] font-bold">
                            <span onClick={() => scrollTo('faq')} className="cursor-pointer hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_nav_faq')}</span>
                            <Link to="/aplikasi-kasir-offline" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Offline POS Application' : 'Aplikasi Kasir Offline'}</Link>
                            <Link to="/aplikasi-kasir-kafe" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Cafe POS & Mini Resto' : 'Kasir Kafe & Resto Mini'}</Link>
                            <Link to="/buat-invoice-gratis" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Free Invoice Generator' : 'Buat Invoice Gratis'}</Link>
                            <Link to="/software-invoice-freelance" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Freelance & Services Invoicing' : 'Invoice Freelance & Jasa'}</Link>
                            <Link to="/buat-kwitansi-gratis" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Free Payment Receipt (Kwitansi)' : 'Buat Kwitansi Gratis'}</Link>
                            <Link to="/buat-penawaran-harga-gratis" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Free Price Quotation (SPH)' : 'Buat Penawaran Harga Gratis'}</Link>
                            <Link to="/kalkulator-hpp-gratis" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{isEn ? 'Free COGS (HPP) Calculator' : 'Kalkulator HPP Gratis'}</Link>
                        </div>
                    </div>

                    {/* Col 3: Legal */}
                    <div>
                        <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_legal')}</h5>
                        <div className="flex flex-col gap-4 text-[15px] font-bold">
                            <Link to="/privacy" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_policy')}</Link>
                            <Link to="/terms" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_terms')}</Link>
                        </div>
                    </div>

                    {/* Col 4: Partner */}
                    <div>
                        <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_partner')}</h5>
                        <div className="flex flex-col gap-4 text-[15px] font-bold">
                            <Link to="/affiliate" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>
                                {t('landing_footer_affiliate')}
                            </Link>
                            <Link to="/karir" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>
                                {t('landing_footer_career') || (isEn ? 'Career' : 'Karir')}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sub-footer: Solusi Industri Internal Links */}
                <div className="pt-8 pb-8 mb-8 border-t text-left" style={{ borderColor: 'var(--landing-border)' }}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700 m-0">
                            {isEn ? 'Industry Solutions & POS' : 'Solusi Usaha & Kasir Spesifik'}
                        </span>
                        <Link to="/solusi" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 no-underline">
                            <span>{isEn ? 'View All 20+ Solutions →' : 'Lihat Semua 20+ Solusi Industri →'}</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-2.5 gap-x-4 text-xs font-medium" style={{ color: 'var(--landing-text-muted)' }}>
                        <Link to="/invoice-untuk-desainer" className="hover:text-primary transition-colors no-underline">Invoice Desainer Grafis</Link>
                        <Link to="/invoice-untuk-kontraktor" className="hover:text-primary transition-colors no-underline">Invoice Kontraktor</Link>
                        <Link to="/invoice-untuk-fotografer" className="hover:text-primary transition-colors no-underline">Invoice Fotografer</Link>
                        <Link to="/invoice-untuk-catering" className="hover:text-primary transition-colors no-underline">Invoice Catering</Link>
                        <Link to="/invoice-untuk-rental-mobil" className="hover:text-primary transition-colors no-underline">Invoice Rental Mobil</Link>
                        <Link to="/invoice-untuk-konsultan" className="hover:text-primary transition-colors no-underline">Invoice Konsultan</Link>
                        <Link to="/invoice-untuk-percetakan" className="hover:text-primary transition-colors no-underline">Invoice Percetakan</Link>
                        <Link to="/invoice-untuk-event-organizer" className="hover:text-primary transition-colors no-underline">Invoice Event Organizer</Link>
                        <Link to="/aplikasi-kasir-laundry" className="hover:text-primary transition-colors no-underline">Kasir Laundry Kiloan</Link>
                        <Link to="/aplikasi-kasir-barbershop" className="hover:text-primary transition-colors no-underline">Kasir Barbershop</Link>
                        <Link to="/aplikasi-kasir-bengkel" className="hover:text-primary transition-colors no-underline">Kasir Bengkel Motor</Link>
                        <Link to="/aplikasi-kasir-vape" className="hover:text-primary transition-colors no-underline">Kasir Vape Store</Link>
                        <Link to="/aplikasi-kasir-petshop" className="hover:text-primary transition-colors no-underline">Kasir Pet Shop</Link>
                        <Link to="/aplikasi-kasir-toko-baju" className="hover:text-primary transition-colors no-underline">Kasir Toko Baju</Link>
                        <Link to="/aplikasi-kasir-toko-kelontong" className="hover:text-primary transition-colors no-underline">Kasir Toko Kelontong</Link>
                        <Link to="/aplikasi-kasir-cuci-motor" className="hover:text-primary transition-colors no-underline">Kasir Cuci Motor & Mobil</Link>
                        <Link to="/buat-penawaran-harga-kontraktor" className="hover:text-primary transition-colors no-underline">SPH Kontraktor & RAB</Link>
                        <Link to="/buat-penawaran-harga-catering" className="hover:text-primary transition-colors no-underline">SPH Catering Kantor</Link>
                        <Link to="/buat-penawaran-harga-pengadaan-it" className="hover:text-primary transition-colors no-underline">SPH Pengadaan IT</Link>
                        <Link to="/buat-penawaran-harga-interior" className="hover:text-primary transition-colors no-underline">SPH Desain Interior</Link>
                    </div>
                </div>

                {/* Copyright & Legal Section */}
                <div className="pt-8 border-t flex flex-col-reverse md:flex-row items-center justify-between gap-4" style={{ borderColor: 'var(--landing-border)' }}>
                    <p className="m-0 text-sm font-semibold opacity-50 tracking-wide" style={{ color: 'var(--landing-text)' }}>
                        © {new Date().getFullYear()} MyInvoice.space. {isEn ? 'All rights reserved.' : 'Seluruh hak cipta dilindungi.'}
                    </p>
                    
                    <div className="flex items-center gap-6 text-sm font-semibold opacity-50" style={{ color: 'var(--landing-text)' }}>
                        <Link to="/privacy" className="no-underline hover:text-primary hover:opacity-100 transition-all duration-300" style={{ color: 'inherit' }}>{t('landing_footer_policy')}</Link>
                        <Link to="/terms" className="no-underline hover:text-primary hover:opacity-100 transition-all duration-300" style={{ color: 'inherit' }}>{t('landing_footer_terms')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
