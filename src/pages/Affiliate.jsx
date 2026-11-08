import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Coins, TrendingUp, ShieldCheck, ArrowRight, Home,
  Mail, Clock, CheckCircle2
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import LandingNavbar from '../components/LandingNavbar';
import LandingFooter from '../components/LandingFooter';

export default function Affiliate() {
  const { lang } = useLang();
  const isEn = lang === 'EN';

  const copy = {
    badge: isEn ? 'MyInvoice Affiliate Program • Coming Soon' : 'Program Afiliasi MyInvoice • Segera Hadir',
    title: isEn ? 'Affiliate & Partner Program Is Under Construction' : 'Program Kemitraan & Afiliasi Sedang Dipersiapkan',
    subtitle: isEn
      ? 'We are building a transparent revenue-sharing system with automated payout tracking and high-converting marketing kits. The official launch will be announced soon!'
      : 'Kami sedang merancang sistem bagi hasil transparan, pelacakan komisi otomatis, dan materi promosi eksklusif untuk kreator serta pelaku bisnis. Nantikan peluncuran resminya segera!',
    expected: isEn ? 'Launch Target: Q1 2027 • In Active Development' : 'Target Rilis: Q1 2027 • Dalam Tahap Pengembangan Aktif',

    features: [
      {
        icon: Coins,
        title: isEn ? 'Attractive Recurring Commission' : 'Komisi Menarik & Berulang',
        desc: isEn
          ? 'Earn steady recurring revenue from every store or UMKM that activates a PRO or ULTIMATE plan using your referral link.'
          : 'Dapatkan komisi berulang yang transparan dari setiap toko atau pelaku usaha yang mengaktifkan paket PRO atau ULTIMATE.'
      },
      {
        icon: TrendingUp,
        title: isEn ? 'Real-Time Analytics Dashboard' : 'Dashboard Analitik Real-Time',
        desc: isEn
          ? 'Monitor clicks, conversion rates, and accrued commissions in real-time with comprehensive performance statistics.'
          : 'Pantau jumlah klik tautan, konversi pendaftaran, dan saldo komisi secara langsung dari dashboard analitik terpadu.'
      },
      {
        icon: ShieldCheck,
        title: isEn ? 'Direct Bank Disbursements' : 'Pencairan Otomatis & Aman',
        desc: isEn
          ? 'Fast, secure, and hassle-free monthly commission payouts directly to your local Indonesian bank account.'
          : 'Pencairan komisi bulanan cepat dan aman langsung ke rekening bank lokal Anda tanpa potongan tersembunyi.'
      }
    ],

    ctaHome: isEn ? 'Back to Homepage' : 'Kembali ke Beranda',
    ctaRegister: isEn ? 'Create Free Account First' : 'Daftar Akun Gratis Dulu',
    contactLabel: isEn ? 'Interested in early partnership or agency collaboration?' : 'Tertarik menjadi mitra awal atau agensi kolaborator?',
    contactEmail: 'hello.myinvoice@gmail.com'
  };

  return (
    <div className="bg-[#FAFAFA] text-zinc-900 font-sans min-h-screen flex flex-col antialiased selection:bg-zinc-900 selection:text-white" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <LandingNavbar />

      <main className="flex-grow pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">

          {/* BADGE */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs sm:text-sm font-bold mb-8 shadow-xs">
            <Sparkles size={16} className="text-violet-600 animate-pulse" />
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

          {/* PREVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left mb-14">
            {copy.features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                      <IconComp size={22} />
                    </div>
                    <h3 className="text-base font-black text-zinc-950 mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed m-0">
                      {feat.desc}
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
              to="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-zinc-50 text-zinc-800 font-bold text-sm border border-zinc-200 shadow-xs transition-all inline-flex items-center justify-center gap-2 no-underline"
            >
              <span>{copy.ctaRegister}</span>
              <ArrowRight size={16} className="text-violet-600" />
            </Link>
          </div>

          {/* CONTACT CALLOUT */}
          <div className="bg-white rounded-2xl border border-zinc-200/80 p-5 sm:p-6 max-w-xl mx-auto shadow-xs">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-1">
              <Mail size={14} className="text-zinc-400" />
              <span>{copy.contactLabel}</span>
            </div>
            <a
              href={`mailto:${copy.contactEmail}`}
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
