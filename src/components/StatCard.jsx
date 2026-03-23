import { ArrowUp, ArrowDown } from 'lucide-react';
import { useCountUp } from '../hooks/useLocalStorage';
import { formatIDR, formatCompactCurrency } from '../utils/currency';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel, prefix = '', onClick, onMouseEnter, onMouseLeave, style = {}, subtitle }) {
    const { dark } = useTheme();
    const { lang } = useLang();

    const formattedValue = typeof value === 'number' ? formatCompactCurrency(animated) : value;
    const fullValue = typeof value === 'number' ? formatIDR(animated) : value;

    const getFontSize = (str) => {
        if (typeof str !== 'string') return 'text-xl md:text-2xl';
        if (str.length > 15) return 'text-sm md:text-base';
        if (str.length > 12) return 'text-base md:text-lg';
        if (str.length > 10) return 'text-lg md:text-xl';
        return 'text-xl md:text-2xl';
    };

    const colorMap = {
        green: { bg: dark ? 'rgba(16,185,129,0.15)' : '#ECFDF5', icon: '#10B981', border: '#10B981' },
        red: { bg: dark ? 'rgba(239,68,68,0.15)' : '#FEF2F2', icon: '#EF4444', border: '#EF4444' },
        purple: { bg: dark ? 'rgba(124,58,237,0.15)' : '#EDE9FE', icon: '#7C3AED', border: '#7C3AED' },
        amber: { bg: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', icon: '#F59E0B', border: '#D97706' },
        blue: { bg: dark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', icon: '#3B82F6', border: '#3B82F6' },
    };

    const c = colorMap[color] || colorMap.purple;
    const textPrimary = dark ? '#F1F5F9' : '#1E293B';
    const textSecondary = dark ? '#94A3B8' : '#64748B';

    return (
        <div 
            className="card transition-all" 
            style={{ 
                cursor: onClick ? 'pointer' : 'default', 
                borderTop: `3px solid ${c.border}`,
                minWidth: 0,
                padding: '20px 24px',
                ...style
            }}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div style={{ display: 'flex', alignItems: Icon ? 'flex-start' : 'center', justifyContent: 'space-between' }}>
                <div className="min-w-0 flex-1 overflow-hidden" style={{ overflow: 'hidden' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: textSecondary, textTransform: 'capitalize' }} className="truncate">
                        {title}
                    </p>
                    <p 
                        title={fullValue}
                        className={`${getFontSize(formattedValue)} font-bold`}
                        style={{
                            margin: 0, letterSpacing: '-0.5px',
                            color: textPrimary,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%',
                            minWidth: 0,
                            animation: 'countUp 600ms cubic-bezier(0.4,0,0.2,1) forwards',
                        }}
                    >
                        {prefix}{formattedValue}
                    </p>
                </div>
                {Icon && (
                    <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: c.bg, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginLeft: 12,
                    }}>
                        <Icon size={22} color={c.icon} strokeWidth={2} />
                    </div>
                )}
            </div>
            {trend !== undefined ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {trend >= 0
                        ? <ArrowUp size={14} color="#10B981" />
                        : <ArrowDown size={14} color="#EF4444" />
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: trend >= 0 ? '#10B981' : '#EF4444' }}>
                        {Math.abs(trend)}%
                    </span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{trendLabel || (lang === 'ID' ? 'vs bulan lalu' : 'vs last month')}</span>
                </div>
            ) : subtitle ? (
                <p style={{ margin: '8px 0 0', fontSize: 11, color: c.icon, fontWeight: 600 }}>{subtitle}</p>
            ) : null}
        </div>
    );
}
