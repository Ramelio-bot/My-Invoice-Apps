import { Lock, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

export default function UpgradePrompt({ plan = 'PRO', feature, message }) {
    const navigate = useNavigate();
    const { lang, t } = useLang();

    const isUltimate = plan === 'ULTIMATE';
    const color = isUltimate ? '#7C3AED' : '#3B82F6';
    const bgSolid = isUltimate ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)';
    const priceText = isUltimate ? 'Rp 149.000/bln' : 'Rp 129.000/bln';
    const badgeBg = isUltimate ? '#7C3AED22' : '#3B82F622';

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center p-8 animate-fade-in-up">
            <div className="bg-slate-100 p-5 rounded-full mb-6">
                <Lock size={48} className={isUltimate ? 'text-violet-500' : 'text-blue-500'} />
            </div>

            <div
                className="flex items-center gap-2 px-3 py-1 mb-4 rounded-full text-xs font-bold"
                style={{ backgroundColor: badgeBg, color: color, border: `1px solid ${color}44` }}
            >
                {isUltimate ? <Crown size={12} /> : <Zap size={12} />}
                <span>{plan} PLAN</span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-3">
                {feature}
            </h2>

            <p className="text-slate-500 max-w-md mb-8 text-sm leading-relaxed">
                {message || t('up_prompt_desc').replace('{plan}', plan)}
            </p>

            <button
                onClick={() => navigate('/upgrade')}
                className="px-8 py-3.5 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105 hover:shadow-xl flex items-center gap-3"
                style={{ background: bgSolid, boxShadow: `0 10px 25px -5px ${color}66` }}
            >
                {isUltimate ? <Crown size={18} /> : <Zap size={18} />}
                <span>{t('up_btn_upgrade')} {plan} — {priceText}</span>
            </button>

            <button
                onClick={() => navigate(-1)}
                className="mt-6 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
            >
                ← {t('up_btn_back')}
            </button>
        </div>
    );
}
