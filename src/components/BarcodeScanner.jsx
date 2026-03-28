import { Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'
import { useLang } from '../context/LanguageContext'

const BarcodeScanner = ({ onScan, onClose }) => {
    const html5QrRef = useRef(null)
    const [started, setStarted] = useState(false)
    const { t } = useLang();

    const startCamera = async () => {
        try {
            html5QrRef.current = new Html5Qrcode('barcode-reader')
            await html5QrRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 150 } },
                (decodedText) => {
                    onScan(decodedText)
                    stopCamera()
                },
                (error) => { /* ignore */ }
            )
            setStarted(true)
        } catch (err) {
            console.error("Camera start error:", err)
        }
    }

    const stopCamera = async () => {
        try {
            if (html5QrRef.current && started) {
                await html5QrRef.current.stop()
                html5QrRef.current.clear()
            }
        } catch (err) {
            console.error("Camera stop error:", err)
        } finally {
            onClose()
        }
    }

    useEffect(() => {
        startCamera()
        return () => {
            if (html5QrRef.current) {
                html5QrRef.current.stop().catch(() => {})
            }
        }
    }, [])

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-sm border border-slate-200 scale-in">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        📷 {t('scan_barcode') || 'Scan Barcode'}
                    </h3>
                    <button onClick={stopCamera} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                        ✕
                    </button>
                </div>
                <div className="p-4">
                    <div id="barcode-reader" className="rounded-xl overflow-hidden border-2 border-slate-100" />
                    <p className="text-sm text-slate-500 mt-4 text-center font-medium">
                        {t('aim_camera') || 'Arahkan kamera ke barcode produk'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default BarcodeScanner
