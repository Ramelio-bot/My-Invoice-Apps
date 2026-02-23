import { ArrowUp, ArrowDown } from 'lucide-react';
import { useCountUp } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';
import { useTheme } from '../context/ThemeContext';

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel, prefix = '' }) {
    const animated = useCountUp(Math.abs(value || 0), 1000);
    const { dark } = useTheme();

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
        <div className="card" style={{ cursor: 'default', borderTop: `3px solid ${c.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: textSecondary }}>
                        {title}
                    </p>
                    <p style={{
                        margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
                        color: textPrimary,
                        animation: 'countUp 600ms cubic-bezier(0.4,0,0.2,1) forwards',
                    }}>
                        {prefix}{typeof value === 'number' ? formatIDR(animated) : value}
                    </p>
                </div>
                <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: c.bg, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginLeft: 12,
                }}>
                    <Icon size={22} color={c.icon} strokeWidth={2} />
                </div>
            </div>
            {trend !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {trend >= 0
                        ? <ArrowUp size={14} color="#10B981" />
                        : <ArrowDown size={14} color="#EF4444" />
                    }
                    <span style={{ fontSize: 12, fontWeight: 600, color: trend >= 0 ? '#10B981' : '#EF4444' }}>
                        {Math.abs(trend)}%
                    </span>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>{trendLabel || 'vs bulan lalu'}</span>
                </div>
            )}
        </div>
    );
}
