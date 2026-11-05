import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLang } from "../context/LanguageContext";
import { supabase } from "../lib/supabase";
import { Star, AlertTriangle, CheckCircle, Check, LogIn } from 'lucide-react';

export default function ProSuccess() {
    const { user, profile, loading: authLoading, refreshProfile } = useAuth();
    const { lang } = useLang();
    const isEn = lang === 'EN';
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const trxId = searchParams.get("trx_id") || searchParams.get("order_id") || searchParams.get("payment_id") || searchParams.get("id");

    const dbPlan = profile?.plan?.toLowerCase();
    const isPaidPro = dbPlan === 'pro' && !profile?.trial_ends_at;
    const isPaidUltimate = dbPlan === 'ultimate';
    const isAlreadyUpgraded = isPaidPro || isPaidUltimate || (Boolean(trxId) && profile?.last_payment_trx_id === trxId);

    const [verifying, setVerifying] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [claimed, setClaimed] = useState(false);

    const isClaimed = claimed || isAlreadyUpgraded;
    const isLoading = authLoading || (Boolean(user) && !isClaimed && !errorMsg && verifying);

    useEffect(() => {
        if (isPaidUltimate) {
            navigate('/ultimate-success' + window.location.search, { replace: true });
        }
    }, [isPaidUltimate, navigate]);

    useEffect(() => {
        if (authLoading || !user || isAlreadyUpgraded) return;

        let isMounted = true;
        let pollInterval = null;

        const checkPlanStatus = async () => {
            try {
                if (trxId) {
                    const { data: claimSuccess, error } = await supabase.rpc('claim_upgrade', {
                        p_trx_id: trxId
                    });

                    if (error) {
                        console.error("ProSuccess Claim Error:", error);
                    }

                    if (claimSuccess) {
                        const updated = refreshProfile ? await refreshProfile(true) : null;
                        if (isMounted) {
                            if (updated?.plan?.toLowerCase() === 'ultimate') {
                                navigate('/ultimate-success' + window.location.search, { replace: true });
                                return;
                            }
                            setClaimed(true);
                            setVerifying(false);
                            clearInterval(pollInterval);
                            return;
                        }
                    }
                }

                // Always poll profile from DB in case Mayar webhook auto-upgraded by email
                if (refreshProfile) {
                    const updated = await refreshProfile(true);
                    const updatedPlan = updated?.plan?.toLowerCase();
                    if (updatedPlan === 'ultimate') {
                        if (isMounted) {
                            clearInterval(pollInterval);
                            navigate('/ultimate-success' + window.location.search, { replace: true });
                        }
                        return;
                    }
                    if ((updatedPlan === 'pro' && !updated?.trial_ends_at) || (trxId && updated?.last_payment_trx_id === trxId)) {
                        if (isMounted) {
                            setClaimed(true);
                            setVerifying(false);
                            clearInterval(pollInterval);
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
    }, [user, authLoading, trxId, isAlreadyUpgraded, refreshProfile, isEn, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">
                    {isEn ? "Verifying PRO payment..." : "Memverifikasi pembayaran PRO..."}
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

    if (errorMsg && !isClaimed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">
                        {isEn ? "Verification Incomplete" : "Verifikasi Belum Selesai"}
                    </h1>
                    <p className="text-gray-500 mb-6 text-sm">{errorMsg}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all cursor-pointer"
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
                    {isEn ? "Thank you for subscribing. Your account has been upgraded to PRO." : "Terima kasih telah berlangganan. Akun kamu berhasil di-upgrade ke PRO."}
                </p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-black text-lg shadow-sm border border-blue-200">
                        PRO <Star size={18} fill="currentColor" />
                    </span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">
                        {isEn ? "Unlocked PRO Features:" : "Fitur PRO yang didapat:"}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "100% White-Label (No watermark)" : "100% Tanpa watermark di PDF & Struk"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Expanded POS & Document Quotas" : "Kuota Transaksi Kasir & Dokumen Besar"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Company Logo & Store QRIS" : "Logo Perusahaan & QRIS Toko"}</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-green-500 inline mr-1" /> {isEn ? "Full financial reports & Excel export" : "Laporan laba rugi lengkap & ekspor Excel"}</li>
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
