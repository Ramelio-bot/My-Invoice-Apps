import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
import { Star, AlertTriangle, CheckCircle, Check, LogIn } from 'lucide-react';

export default function ProSuccess() {
    const { user, profile, loading: authLoading, refreshProfile, effectivePlan } = useAuth();
    const { lang } = useLang();
    const isEn = lang === 'EN';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const trxId = searchParams.get("trx_id") || searchParams.get("order_id") || searchParams.get("payment_id") || searchParams.get("id");
    const isAlreadyUpgraded = effectivePlan === 'pro' || effectivePlan === 'ultimate' || (Boolean(trxId) && profile?.last_payment_trx_id === trxId);

    const [verifying, setVerifying] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [claimed, setClaimed] = useState(false);

    const isClaimed = claimed || isAlreadyUpgraded;
    const isMissingTrx = !trxId;
    const isLoading = authLoading || (Boolean(user) && !isClaimed && !isMissingTrx && !errorMsg && verifying);

    useEffect(() => {
        if (authLoading || !user || !trxId || isAlreadyUpgraded) return;

        let isMounted = true;
        let pollInterval = null;

        const checkPlanStatus = async () => {
            try {
                const { data: claimSuccess, error } = await supabase.rpc('claim_upgrade', {
                    p_trx_id: trxId
                });

                if (error) {
                    console.error("ProSuccess Claim Error:", error);
                }

                if (claimSuccess) {
                    if (refreshProfile) await refreshProfile(true);
                    if (isMounted) {
                        setClaimed(true);
                        setVerifying(false);
                        clearInterval(pollInterval);
                    }
                } else {
                    if (refreshProfile) {
                        const updated = await refreshProfile(true);
                        if (updated?.plan === 'pro' || updated?.plan === 'ultimate' || updated?.last_payment_trx_id === trxId) {
                            if (isMounted) {
                                setClaimed(true);
                                setVerifying(false);
                                clearInterval(pollInterval);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("ProSuccess Polling Error:", e);
            }
        };

        checkPlanStatus();

        pollInterval = setInterval(() => {
            checkPlanStatus();
        }, 2500);

        const timeout = setTimeout(() => {
            if (isMounted) {
                clearInterval(pollInterval);
                setErrorMsg(isEn
                    ? "Verification timed out. If you have completed payment, please refresh this page shortly or check your dashboard."
                    : "Waktu tunggu verifikasi habis. Jika Anda sudah membayar, silakan muat ulang halaman ini nanti atau cek dashboard.");
                setVerifying(false);
            }
        }, 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            clearTimeout(timeout);
        };
    }, [user, authLoading, trxId, isAlreadyUpgraded, refreshProfile, isEn]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">
                    {isEn ? "Verifying payment..." : "Memverifikasi pembayaran..."}
                </p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-blue-100">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <CheckCircle size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        {isEn ? "Payment Received!" : "Pembayaran Diterima!"}
                    </h1>
                    <p className="text-gray-600 mb-6 text-sm">
                        {isEn
                            ? "Please sign in to your MyInvoice account to claim and activate your PRO plan instantly."
                            : "Silakan masuk ke akun My Invoice Anda untuk mengklaim dan mengaktifkan paket PRO secara instan."}
                    </p>
                    <button
                        onClick={() => navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search))}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                    >
                        <LogIn size={18} /> {isEn ? "Sign In & Activate Plan" : "Masuk & Aktifkan Paket"}
                    </button>
                </div>
            </div>
        );
    }

    const finalError = isMissingTrx
        ? (isEn ? "Transaction ID not found in URL. Unable to verify." : "ID Transaksi tidak ditemukan di URL. Tidak dapat memverifikasi.")
        : errorMsg;
    if (finalError && !isClaimed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        {isEn ? "Verification Incomplete" : "Verifikasi Belum Selesai"}
                    </h1>
                    <p className="text-gray-500 mb-6 text-sm">{finalError}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                    >
                        {isEn ? "Back to Dashboard" : "Kembali ke Dashboard"}
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">
                        {isEn ? (
                            <>Contact <strong>hello.myinvoice@gmail.com</strong> if you were charged but your plan is not active yet.</>
                        ) : (
                            <>Hubungi <strong>hello.myinvoice@gmail.com</strong> jika saldo Anda terpotong namun paket belum aktif.</>
                        )}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100">
                <div className="mb-4 flex justify-center text-blue-600"><CheckCircle size={64} /></div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">
                    {isEn ? "Congratulations! You are now PRO!" : "Selamat! Kamu sekarang PRO!"}
                </h1>
                <p className="text-gray-500 mb-6">
                    {isEn ? "Thank you for subscribing. Your account has been upgraded." : "Terima kasih telah berlangganan. Akun kamu berhasil di-upgrade."}
                </p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-black text-lg shadow-sm border border-blue-200">
                        PRO <Star size={18} fill="currentColor" />
                    </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        {isEn ? "Unlocked Features:" : "Fitur yang didapat:"}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Invoices & documents: Unlimited" : "Invoice & dokumen: Unlimited"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "POS Cashier: Unlimited transactions" : "Kasir POS: Unlimited transaksi"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Clients: Unlimited" : "Klien: Unlimited"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Full financial reports" : "Laporan keuangan lengkap"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "No watermark" : "Tanpa watermark"}</li>
                    </ul>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1 cursor-pointer"
                >
                    {isEn ? "Get Started →" : "Mulai Gunakan →"}
                </button>
                <p className="text-xs text-gray-400 mt-6 font-medium">
                    {isEn ? "Payment confirmation and receipt have been sent to your email." : "Konfirmasi pembayaran dan invoice dikirim ke email kamu."}
                </p>
            </div>
        </div>
    );
}
