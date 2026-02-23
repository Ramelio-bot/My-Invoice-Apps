import { ArrowUp, ArrowDown } from 'lucide-react';
import { useCountUp } from '../hooks/useLocalStorage';
import { formatIDR } from '../utils/currency';

export default function StatCard({ title, value, icon: Icon, color, trend, trendLabel, prefix = '' }) {
    const animated = useCountUp(Math.abs(value || 0), 1000);

    const colorMap = {
        green: { bg: '#ECFDF5', icon: '#10B981', text: '#065F46', border: '#10B981' },
        red: { bg: '#FEF2F2', icon: '#EF4444', text: '#991B1B', border: '#EF4444' },
        purple: { bg: '#EDE9FE', icon: '#7C3AED', text: '#5B21B6', border: '#7C3AED' },
        amber: { bg: '#FEF3C7', icon: '#F59E0B', text: '#92400E', border: '#D97706' },
        blue: { bg: '#EFF6FF', icon: '#3B82F6', text: '#1D4ED8', border: '#3B82F6' },
    };

    const c = colorMap[color] || colorMap.purple;

    return (
        <div className="card" style={{ cursor: 'default', borderTop: `3px solid ${c.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#64748B' }}>
                        {title}
                    </p>
                    <p style={{
                        margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px',
                        color: '#1E293B',
                        animation: 'countUp 600ms cubic-bezier(0.4,0,0.2,1) forwards',
                    }} className="dark:text-slate-100">
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
