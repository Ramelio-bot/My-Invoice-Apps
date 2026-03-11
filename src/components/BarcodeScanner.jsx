import { Html5QrcodeScanner } from 'html5-qrcode'
import { useEffect, useRef } from 'react'
import { useLang } from '../context/LanguageContext'

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null)
    const { t } = useLang();

    useEffect(() => {
        const scanner = new Html5QrcodeScanner('barcode-reader', {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.6,
            supportedScanTypes: [0] // barcode only, no QR
        })

        scanner.render(
            (decodedText) => {
                onScan(decodedText)
                scanner.clear()
            },
            (error) => { /* ignore scan errors */ }
        )

        scannerRef.current = scanner
        return () => scanner.clear().catch(() => {})
    }, [])

    return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden w-full max-w-sm border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        📷 {t('scan_barcode') || 'Scan Barcode'}
                    </h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        ✕
                    </button>
                </div>
                <div className="p-4">
                    <div id="barcode-reader" className="rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-700" />
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-4 text-center font-medium">
                        {t('aim_camera') || 'Arahkan kamera ke barcode produk'}
                    </p>
                </div>
            </div>
        </div>
    )
}

export default BarcodeScanner
