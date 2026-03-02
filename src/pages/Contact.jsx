import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageSquare, Clock, Send, Globe } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const copy = {
    ID: {
        title: 'Hubungi Kami',
        subtitle: 'Ada pertanyaan atau kendala? Tim kami siap membantu Anda 24/7.',
        formName: 'Nama Lengkap',
        formEmail: 'Alamat Email',
        formSubject: 'Subjek Pertanyaan',
        formMessage: 'Pesan Anda',
        formSubmit: 'Kirim Pesan via Email',
        optGeneral: 'Pertanyaan Umum',
        optTechnical: 'Bantuan Teknis',
        optBilling: 'Billing & Pembayaran',
        optFeedback: 'Saran & Masukan',
        infoTitle: 'Informasi Kontak',
        infoEmail: 'Email Support',
        infoBlog: 'Blog Kami',
        infoSla: 'Waktu Respons',
        infoSlaDesc: 'Tim kami akan membalas pesan Anda dalam 1x24 jam pada hari kerja.',
    },
    EN: {
        title: 'Contact Us',
        subtitle: 'Have questions or issues? Our team is ready to help 24/7.',
        formName: 'Full Name',
        formEmail: 'Email Address',
        formSubject: 'Subject',
        formMessage: 'Your Message',
        formSubmit: 'Send via Email',
        optGeneral: 'General Inquiry',
        optTechnical: 'Technical Support',
        optBilling: 'Billing & Payment',
        optFeedback: 'Feedback & Suggestions',
        infoTitle: 'Contact Information',
        infoEmail: 'Email Support',
        infoBlog: 'Our Blog',
        infoSla: 'Response Time',
        infoSlaDesc: 'Our team will reply to your message within 24 hours on business days.',
    }
};

export default function Contact() {
    const { dark } = useTheme();
    const { lang } = useLang();
    const navigate = useNavigate();
    const { user } = useAuth();
    const c = copy[lang];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: lang === 'ID' ? 'Pertanyaan Umum' : 'General Inquiry',
        message: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const mailtoLink = `mailto:support@myinvoice.space?subject=${encodeURIComponent(formData.subject)} - ${encodeURIComponent(formData.name)}&body=${encodeURIComponent(formData.message)}%0A%0AFrom: ${formData.name} (${formData.email})`;
        window.open(mailtoLink, '_blank');
    };

    const inputClass = `w-full rounded-xl border p-4 transition-colors focus:ring-2 focus:ring-violet-500 focus:outline-none ${dark
        ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
        }`;

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${dark ? 'bg-[#0F172A]' : 'bg-slate-50'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="max-w-6xl mx-auto">

                {/* Back Button */}
                <div className="sticky top-24 z-40 w-fit mb-8">
                    <button
                        onClick={() => user ? navigate('/dashboard') : navigate('/')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold shadow-sm transition-all hover:-translate-x-1 ${dark ? 'bg-slate-800 text-slate-300 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900'}`}
                    >
                        &larr; {lang === 'ID' ? 'Kembali' : 'Back'}
                    </button>
                </div>

                <div className="text-center mb-16 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 font-bold text-sm" style={{ background: dark ? 'rgba(124,58,237,0.2)' : '#EDE9FE', color: '#7C3AED' }}>
                        <MessageSquare size={16} />
                        Support
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-black mb-6 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {c.title}
                    </h1>
                    <p className={`text-xl max-w-2xl mx-auto ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {c.subtitle}
                    </p>
                </div>

                <div className="grid lg:grid-cols-5 gap-12 lg:gap-8 items-start">

                    {/* Contact Form */}
                    <div className={`lg:col-span-3 rounded-3xl p-8 md:p-10 shadow-xl border ${dark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-100'} backdrop-blur-sm`}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`block text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{c.formName}</label>
                                    <input
                                        type="text" required
                                        className={inputClass}
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className={`block text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{c.formEmail}</label>
                                    <input
                                        type="email" required
                                        className={inputClass}
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{c.formSubject}</label>
                                <select
                                    className={inputClass}
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                >
                                    <option value={c.optGeneral}>{c.optGeneral}</option>
                                    <option value={c.optTechnical}>{c.optTechnical}</option>
                                    <option value={c.optBilling}>{c.optBilling}</option>
                                    <option value={c.optFeedback}>{c.optFeedback}</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={`block text-sm font-bold ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{c.formMessage}</label>
                                <textarea
                                    required rows="5"
                                    className={`${inputClass} resize-none`}
                                    placeholder="Hello, I would like to ask about..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-violet-600/30 transition-all hover:-translate-y-1 hover:shadow-violet-600/50 flex justify-center items-center gap-2"
                            >
                                <Send size={20} />
                                {c.formSubmit}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <h3 className={`text-2xl font-bold mb-8 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.infoTitle}</h3>

                        <a href="mailto:support@myinvoice.space" className={`flex items-start gap-5 p-6 rounded-2xl border transition-all hover:-translate-y-1 ${dark ? 'bg-slate-800/50 border-slate-700 hover:border-violet-500' : 'bg-white border-slate-200 hover:border-violet-400 hover:shadow-md'}`}>
                            <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 flex items-center justify-center">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.infoEmail}</h4>
                                <p className={`font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>support@myinvoice.space</p>
                            </div>
                        </a>

                        <a href="https://blog.myinvoice.space" target="_blank" rel="noreferrer" className={`flex items-start gap-5 p-6 rounded-2xl border transition-all hover:-translate-y-1 ${dark ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md'}`}>
                            <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.infoBlog}</h4>
                                <p className={`font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>blog.myinvoice.space</p>
                            </div>
                        </a>

                        <div className={`mb-6 flex items-start gap-5 p-6 rounded-2xl border ${dark ? 'bg-[#1E1B4B]/30 border-violet-900/50' : 'bg-violet-50 border-violet-100'}`}>
                            <div className="mt-1 flex-shrink-0 w-12 h-12 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300 flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>{c.infoSla}</h4>
                                <p className={`leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-600'}`}>{c.infoSlaDesc}</p>
                            </div>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}
