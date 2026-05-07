


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

export default function DocumentTemplate() {
    // Fitur ganti template dinonaktifkan untuk menghindari CSS conflict.
    // Fokus pada 1 template master yang stabil (modern).
    return null;
}

// Hook for other components to read selected template
export function useDocTemplate() {
    // Paksa menggunakan 'modern' sebagai master template yang stabil untuk semua tipe dokumen
    return TEMPLATES.find(t => t.id === 'modern') || TEMPLATES[1];
}
