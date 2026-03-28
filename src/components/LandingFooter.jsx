import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useLang } from '../context/LanguageContext';

export default function LandingFooter() {
    const { t } = useLang();

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
                    </div>

                    {/* Col 2: Info */}
                    <div>
                        <h5 className="text-[16px] font-black mb-6 uppercase tracking-wider opacity-40" style={{ color: 'var(--landing-text)' }}>{t('landing_footer_info')}</h5>
                        <div className="flex flex-col gap-4 text-[15px] font-bold">
                            <span onClick={() => scrollTo('faq')} className="cursor-pointer hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_nav_faq')}</span>
                            <a href="https://artikel.myinvoice.space/" target="_blank" rel="noreferrer" className="no-underline hover:text-primary transition-colors" style={{ color: 'var(--landing-text-muted)' }}>{t('landing_footer_blog')}</a>
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
                                {t('landing_footer_career') || 'Career'}
                            </Link>
                        </div>
                        <div className="mt-6">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                {t('landing_footer_made_with')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t text-center" style={{ borderColor: 'var(--landing-border)' }}>
                    <p className="m-0 text-sm font-bold opacity-60" style={{ color: 'var(--landing-text)' }}>
                        © 2026 myinvoice.space
                    </p>
                </div>
            </div>
        </footer>
    );
}
