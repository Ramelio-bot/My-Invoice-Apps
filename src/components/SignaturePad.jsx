import { useRef, useEffect, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LanguageContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

const STORAGE_KEY = 'saved_signature';

/**
 * A canvas-based signature pad.
 *
 * @param {object} props
 * @param {string|null} props.value      - Current signature as base64 data URL (or null)
 * @param {function}    props.onChange   - Called with base64 string when signature changes, or null when cleared
 * @param {boolean}     [props.readOnly] - If true, show image only (no drawing)
 */
export default function SignaturePad({ value, onChange, readOnly = false }) {
    const { dark } = useTheme();
    const { lang } = useLang();
    const [savedSig, setSavedSig] = useLocalStorage(STORAGE_KEY, null);

    const canvasRef = useRef(null);
    const drawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });

    // Draw saved value onto canvas on mount
    useEffect(() => {
        if (value && canvasRef.current) {
            const img = new Image();
            img.onload = () => {
                const ctx = canvasRef.current?.getContext('2d');
                if (ctx) { ctx.clearRect(0, 0, 400, 160); ctx.drawImage(img, 0, 0); }
            };
            img.src = value;
        }
    }, [value]);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * (canvas.width / rect.width),
            y: (src.clientY - rect.top) * (canvas.height / rect.height),
        };
    };

    const startDraw = useCallback((e) => {
        if (readOnly) return;
        e.preventDefault();
        drawing.current = true;
        const canvas = canvasRef.current;
        lastPos.current = getPos(e, canvas);
    }, [readOnly]);

    const draw = useCallback((e) => {
        if (!drawing.current || readOnly) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = dark ? '#F1F5F9' : '#1E293B';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastPos.current = pos;
    }, [dark, readOnly]);

    const endDraw = useCallback(() => {
        if (!drawing.current) return;
        drawing.current = false;
        const dataURL = canvasRef.current?.toDataURL('image/png');
        onChange?.(dataURL);
    }, [onChange]);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onChange?.(null);
    };

    const saveSignature = () => {
        const dataURL = canvasRef.current?.toDataURL('image/png');
        if (dataURL) setSavedSig(dataURL);
    };

    const useSaved = () => {
        if (!savedSig) return;
        const img = new Image();
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx) { ctx.clearRect(0, 0, 400, 160); ctx.drawImage(img, 0, 0); }
        };
        img.src = savedSig;
        onChange?.(savedSig);
    };

    const bd = dark ? '#334155' : '#E2E8F0';
    const bg = dark ? '#0F172A' : '#F8FAFC';

    if (readOnly && value) {
        return (
            <div style={{ border: `1px solid ${bd}`, borderRadius: 10, padding: 8, background: bg, display: 'inline-block' }}>
                <img src={value} alt="Signature" style={{ maxHeight: 80, display: 'block' }} />
            </div>
        );
    }

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={400} height={160}
                style={{ border: `1.5px solid ${bd}`, borderRadius: 10, background: bg, cursor: readOnly ? 'default' : 'crosshair', width: '100%', display: 'block', touchAction: 'none' }}
                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
            {!readOnly && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                    <button onClick={clearCanvas} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trash2 size={13} /> {t('sig_clear')}
                    </button>
                    <button
                        onClick={saveSignature}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-200 hover:shadow-violet-300 transition-all hover:scale-[1.02]"
                    >
                        {t('sig_save')}
                    </button>
                    {onUseSaved && (
                        <button
                            onClick={onUseSaved}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-all"
                        >
                            {t('sig_use_saved')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
