import React from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase, Sparkles, Laptop, Users, Rocket, Home,
  Mail, Clock, ArrowRight, CheckCircle2
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function Karir() {
  const { lang } = useLang();
  const isEn = lang === 'EN';

  const copy = {
    badge: isEn ? 'Careers & Opportunities • Coming Soon' : 'Peluang Karir & Rekrutmen • Segera Hadir',
    title: isEn ? 'Career Opportunities & Recruitment Opening Soon' : 'Rekrutmen & Peluang Karir Segera Dibuka',
    subtitle: isEn
      ? 'All open positions are temporarily paused for internal structuring. We are gearing up to welcome visionary engineers, designers, and growth partners to scale our UMKM ecosystem.'
      : 'Saat ini rekrutmen tim sedang ditutup sementara untuk penataan internal. Kami sedang bersiap membuka kesempatan baru bagi para talenta rekayasa perangkat lunak, desain produk, dan pemasaran.',
    expected: isEn ? 'Status: Recruitment Paused • Next Batch Opening Soon' : 'Status: Rekrutmen Ditutup Sementara • Pembukaan Gelombang Baru Segera',

    values: [
      {
        icon: Laptop,
        title: isEn ? 'Flexible Remote-First (WFA)' : 'Kerja Fleksibel & Remote (WFA)',
        desc: isEn
          ? 'Work from anywhere with high autonomy. We evaluate real tangible outcomes and engineering impact, not seat time.'
          : 'Bekerja dengan nyaman dari mana saja. Kami mengutamakan hasil karya nyata, kecepatan iterasi, dan kepuasan pengguna.'
      },
      {
        icon: Users,
        title: isEn ? 'Real Impact for Indonesian UMKM' : 'Dampak Nyata untuk Jutaan UMKM',
        desc: isEn
          ? 'Build mission-critical tools that power everyday commerce for thousands of independent businesses and shops.'
          : 'Bangun teknologi administrasi dan kasir yang setiap hari diandalkan ribuan pemilik bisnis kecil menengah di seluruh Indonesia.'
      },
      {
        icon: Rocket,
        title: isEn ? 'Rapid Growth & Ownership' : 'Ruang Belajar & Kepemimpinan',
        desc: isEn
          ? 'Zero bureaucracy. Experiment with modern full-stack frameworks, launch real features, and steer product directions.'
          : 'Dukungan penuh untuk bereksperimen dengan teknologi modern, ruang diskusi terbuka, dan kesempatan memimpin modul produk.'
      }
    ],

    ctaHome: isEn ? 'Back to Homepage' : 'Kembali ke Beranda',
    ctaProduct: isEn ? 'Explore MyInvoice Features' : 'Jelajahi Fitur MyInvoice',
    contactLabel: isEn ? 'Want to drop your spontaneous resume or portfolio in advance?' : 'Ingin mengirimkan resume atau portofolio Anda lebih awal?',
    contactEmail: 'hello.myinvoice@gmail.com'
  };

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          {/* BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs sm:text-sm font-bold mb-8 shadow-xs">
            <Briefcase size={16} className="text-violet-600" />
            <span>{copy.badge}</span>
          </div>

          {/* HEADLINE */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.12] mb-6 max-w-3xl mx-auto">
            {copy.title}
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl mx-auto mb-8">
            {copy.subtitle}
          </p>

          {/* STATUS PILL */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 text-xs font-semibold shadow-xs mb-14">
            <Clock size={14} className="text-zinc-400" />
            <span>{copy.expected}</span>
          </div>

          {/* CULTURE / PREVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-14">
            {copy.values.map((v, idx) => {
              const IconComp = v.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                      <IconComp size={22} />
                    </div>
                    <h3 className="text-base font-black text-zinc-950 mb-2">
                      {v.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                      {v.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
            <Link
              to="/"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-zinc-950 hover:bg-black text-white font-bold text-sm shadow-md transition-all inline-flex items-center justify-center gap-2 no-underline"
            >
              <Home size={16} />
              <span>{copy.ctaHome}</span>
            </Link>
            <Link
              to="/buat-invoice-gratis"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-sm border border-zinc-200 shadow-xs transition-all inline-flex items-center justify-center gap-2 no-underline"
            >
              <span>{copy.ctaProduct}</span>
              <ArrowRight size={16} className="text-violet-600" />
            </Link>
          </div>

          {/* GENERAL TALENT INQUIRY CALLOUT */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 max-w-xl mx-auto shadow-xs">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-1">
              <Mail size={14} className="text-zinc-400" />
              <span>{copy.contactLabel}</span>
            </div>
            <a
              href={`mailto:${copy.contactEmail}?subject=Spontaneous%20Application%20-%20MyInvoice`}
              className="text-sm sm:text-base font-black text-violet-700 hover:underline inline-block"
            >
              {copy.contactEmail}
            </a>
          </div>

        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
