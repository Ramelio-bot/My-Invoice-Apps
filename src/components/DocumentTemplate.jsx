import { useLocalStorage } from '../hooks/useLocalStorage';
import { useTheme } from '../context/ThemeContext';
import { usePlan } from '../context/PlanContext';
import { Lock } from 'lucide-react';

const TEMPLATES = [
    {
        id: 'minimalis',
        label: 'Minimalis',
        pro: false,
        preview: { header: '#F8FAFC', accent: '#1E293B', text: '#1E293B' },
    },
    {
        id: 'modern',
        label: 'Modern',
        pro: false,
        preview: { header: '#7C3AED', accent: '#7C3AED', text: 'white' },
    },
    {
        id: 'classic',
        label: 'Classic',
        pro: false,
        preview: { header: '#1E3A5F', accent: '#1E3A5F', text: 'white' },
    },
    {
        id: 'corporate',
        label: 'Corporate',
        pro: true,
        preview: { header: '#0F4C81', accent: '#F59E0B', text: 'white' },
    },
    {
        id: 'creative',
        label: 'Creative',
        pro: true,
        preview: { header: 'linear-gradient(135deg,#7C3AED,#EC4899)', accent: '#EC4899', text: 'white' },
    },
    {
        id: 'elegant',
        label: 'Elegant',
        pro: true,
        preview: { header: '#1C1C1C', accent: '#D4AF37', text: '#D4AF37' },
    },
    {
        id: 'bold',
        label: 'Bold',
        pro: true,
        preview: { header: '#000000', accent: '#EF4444', text: 'white' },
    },
];

export default function DocumentTemplate({ docType }) {
    const { dark } = useTheme();
    const { isPro } = usePlan();
    const [selected, setSelected] = useLocalStorage(`template_${docType}`, 'modern');

    const border = dark ? '#334155' : '#E2E8F0';
    const sub = dark ? '#94A3B8' : '#64748B';

    return (
        <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: sub, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Template Dokumen
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TEMPLATES.map(tpl => {
                    const isLocked = tpl.pro && !isPro;
                    const isSelected = selected === tpl.id && !isLocked;
                    return (
                        <button
                            key={tpl.id}
                            onClick={() => { if (!isLocked) setSelected(tpl.id); }}
                            title={isLocked ? `${tpl.label} — PRO` : tpl.label}
                            style={{
                                padding: 0,
                                border: `2px solid ${isSelected ? '#7C3AED' : border}`,
                                borderRadius: 10,
                                cursor: isLocked ? 'not-allowed' : 'pointer',
                                overflow: 'hidden',
                                background: 'none',
                                opacity: isLocked ? 0.65 : 1,
                                transition: 'all 150ms',
                                position: 'relative',
                                flexShrink: 0,
                                width: 72,
                            }}
                        >
                            {/* Mini thumbnail */}
                            <div style={{ width: 68, height: 48 }}>
                                {/* Header bar */}
                                <div style={{
                                    height: 14,
                                    background: tpl.preview.header,
                                    display: 'flex', alignItems: 'center',
                                    paddingLeft: 4, gap: 2,
                                }}>
                                    <div style={{ width: 20, height: 4, background: tpl.preview.text, borderRadius: 2, opacity: 0.9 }} />
                                </div>
                                {/* Body lines */}
                                <div style={{ padding: '4px 4px', background: 'white', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {[80, 60, 70, 50].map((w, i) => (
                                        <div key={i} style={{ height: 3, width: `${w}%`, background: '#E2E8F0', borderRadius: 2 }} />
                                    ))}
                                    {/* Color accent line */}
                                    <div style={{ height: 3, width: '40%', background: tpl.preview.accent, borderRadius: 2, marginTop: 1 }} />
                                </div>
                            </div>
                            {/* Label */}
                            <div style={{
                                fontSize: 9, fontWeight: 700, textAlign: 'center',
                                padding: '2px 0', color: isSelected ? '#7C3AED' : sub,
                                background: dark ? '#1E293B' : '#F8FAFC',
                            }}>
                                {tpl.label}
                            </div>
                            {/* Lock icon */}
                            {isLocked && (
                                <div style={{
                                    position: 'absolute', top: 4, right: 4,
                                    background: 'rgba(0,0,0,0.6)', borderRadius: 4,
                                    padding: 2, display: 'flex',
                                }}>
                                    <Lock size={8} color="white" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Hook for other components to read selected template
export function useDocTemplate(docType) {
    const [selected] = useLocalStorage(`template_${docType}`, 'modern');
    return TEMPLATES.find(t => t.id === selected) || TEMPLATES[1];
}
