import { ArrowUp, ArrowDown } from 'lucide-react';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { useLang } from '../context/LanguageContext';

export default function StatCard({ 
    title, 
    value, 
    icon: Icon, 
    badge,
    badgeColor = 'slate',
    color = 'slate', 
    trend, 
    trendLabel, 
    prefix = '', 
    onClick, 
    onMouseEnter, 
    onMouseLeave, 
    style = {}, 
    subtitle,
    subValue 
}) {
    const { t } = useLang();

    const formattedValue = typeof value === 'number' ? formatCompactCurrency(value) : (value || '0');
    const fullValue = typeof value === 'number' ? formatIDR(value) : value;

    const getFontSize = (str) => {
        if (typeof str !== 'string') return 'text-xl md:text-2xl';
        if (str.length > 15) return 'text-base md:text-lg';
        if (str.length > 12) return 'text-lg md:text-xl';
        return 'text-xl md:text-2xl';
    };

    const badgeColorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        violet: 'bg-violet-50 text-violet-700 border-violet-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        slate: 'bg-slate-100 text-slate-600 border-slate-200'
    };

    const iconBadgeClasses = {
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
        green: 'bg-emerald-50 text-emerald-600 border-emerald-200/70',
        violet: 'bg-indigo-50 text-indigo-600 border-indigo-200/70',
        purple: 'bg-indigo-50 text-indigo-600 border-indigo-200/70',
        red: 'bg-rose-50 text-rose-600 border-rose-200/70',
        amber: 'bg-amber-50 text-amber-600 border-amber-200/70',
        slate: 'bg-slate-50 text-slate-600 border-slate-200/70'
    }[color] || 'bg-slate-50 text-slate-600 border-slate-200/70';

    const valueColorClass = 'text-slate-900';

    return (
        <div 
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between" 
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
                    <span className="text-xs font-semibold text-slate-500 truncate">
                        {title}
                    </span>
                    {badge ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${badgeColorClasses[badgeColor] || badgeColorClasses.slate}`}>
                            {badge}
                        </span>
                    ) : Icon ? (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${iconBadgeClasses}`}>
                            <Icon size={16} strokeWidth={2.2} />
                        </div>
                    ) : null}
                </div>
                
                <p 
                    title={fullValue}
                    className={`${getFontSize(formattedValue)} font-black ${valueColorClass} tracking-tight font-mono`}
                    style={{
                        margin: 0,
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

            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                {trend !== undefined ? (
                    <div className="flex items-center gap-1 font-bold" style={{ color: trend >= 0 ? '#059669' : '#DC2626' }}>
                        {trend >= 0 ? <ArrowUp size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={3} />}
                        <span>{Math.abs(trend)}%</span>
                        <span className="font-normal text-slate-400 ml-1">{trendLabel || t('stat_vs_last_month')}</span>
                    </div>
                ) : subtitle ? (
                    <span className="text-slate-400 font-medium truncate">{subtitle}</span>
                ) : <span className="text-slate-400">{t('period_month')}</span>}

                {subValue && (
                    <span className="text-slate-600 font-semibold shrink-0 ml-2">{subValue}</span>
                )}
            </div>
        </div>
    );
}
