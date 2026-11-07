import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel, prefix = '', onClick, onMouseEnter, onMouseLeave, style = {}, subtitle }) {
    const { dark } = useTheme();
    const { t } = useLang();

    const formattedValue = typeof value === 'number' ? formatCompactCurrency(value) : value;
    const fullValue = typeof value === 'number' ? formatIDR(value) : value;

    const getFontSize = (str) => {
        if (typeof str !== 'string') return 'text-xl md:text-2xl';
        if (str.length > 15) return 'text-sm md:text-base';
        if (str.length > 12) return 'text-base md:text-lg';
        if (str.length > 10) return 'text-lg md:text-xl';
        return 'text-xl md:text-2xl';
    };

    const colorMap = {
        green: { bg: dark ? 'rgba(16,185,129,0.12)' : '#ECFDF5', text: '#059669' },
        red: { bg: dark ? 'rgba(239,68,68,0.12)' : '#FEF2F2', text: '#DC2626' },
        purple: { bg: dark ? 'rgba(124,58,237,0.12)' : '#F5F3FF', text: '#7C3AED' },
        amber: { bg: dark ? 'rgba(245,158,11,0.12)' : '#FFFBEB', text: '#D97706' },
        blue: { bg: dark ? 'rgba(59,130,246,0.12)' : '#EFF6FF', text: '#2563EB' },
    };

    const c = colorMap[color] || colorMap.purple;
    const textPrimary = dark ? '#F8FAFC' : '#0F172A';

    return (
        <div 
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-all flex flex-col justify-between" 
            style={{ 
                cursor: onClick ? 'pointer' : 'default', 
                minWidth: 0,
                ...style
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                        {title}
                    </span>
                    {Icon && (
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: c.bg, color: c.text }}>
                            <Icon size={16} strokeWidth={2.2} />
                        </div>
                    )}
                </div>
                
                <p 
                    title={fullValue}
                    className={`${getFontSize(formattedValue)} font-black tracking-tight`}
                    style={{
                        margin: 0,
                        color: textPrimary,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                        minWidth: 0,
                    }}
                >
                    {prefix}{formattedValue}
                </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                {trend !== undefined ? (
                    <div className="flex items-center gap-1 font-bold" style={{ color: trend >= 0 ? '#059669' : '#DC2626' }}>
                        {trend >= 0 ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                        <span>{Math.abs(trend)}%</span>
                        <span className="font-normal text-slate-400 ml-1">{trendLabel || t('stat_vs_last_month')}</span>
                    </div>
                ) : subtitle ? (
                    <span className="text-slate-400 font-medium truncate">{subtitle}</span>
                ) : <span className="text-slate-400">{t('period_month')}</span>}
            </div>
        </div>
    );
}
