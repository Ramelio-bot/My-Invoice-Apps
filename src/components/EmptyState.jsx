export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="empty-state">
            {Icon && (
                <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: '#F1F5F9', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                }}>
                    <Icon size={28} color="#94A3B8" strokeWidth={1.5} />
                </div>
            )}
            {!Icon && (
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 16, opacity: 0.4 }}>
                    <rect width="80" height="80" rx="40" fill="#EDE9FE" />
                    <rect x="24" y="20" width="32" height="40" rx="4" fill="#C4B5FD" />
                    <rect x="28" y="28" width="20" height="3" rx="1.5" fill="#7C3AED" />
                    <rect x="28" y="34" width="24" height="3" rx="1.5" fill="#7C3AED" />
                    <rect x="28" y="40" width="16" height="3" rx="1.5" fill="#7C3AED" />
                </svg>
            )}
            <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#475569' }}>
                {title || 'Belum ada data'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#94A3B8' }}>
                {description || 'Data akan muncul di sini setelah ditambahkan'}
            </p>
            {action}
        </div>
    );
}
