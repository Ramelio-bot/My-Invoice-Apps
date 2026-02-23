export default function LoadingSkeleton({ rows = 3, height = 24, gap = 12 }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="shimmer"
                    style={{
                        height,
                        width: i % 3 === 2 ? '60%' : i % 2 === 1 ? '80%' : '100%',
                        borderRadius: 8,
                    }}
                />
            ))}
        </div>
    );
}

export function CardSkeleton({ count = 4 }) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
        }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card" style={{ animation: 'none' }}>
                    <div className="shimmer" style={{ height: 16, width: '50%', marginBottom: 12 }} />
                    <div className="shimmer" style={{ height: 32, width: '70%', marginBottom: 8 }} />
                    <div className="shimmer" style={{ height: 14, width: '40%' }} />
                </div>
            ))}
        </div>
    );
}
