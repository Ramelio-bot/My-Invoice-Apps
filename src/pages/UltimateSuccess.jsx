import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { AlertTriangle, Users, Check, CheckCircle, LogIn } from 'lucide-react';

export default function UltimateSuccess() {
    const { user, profile, loading: authLoading, refreshProfile, effectivePlan } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const trxId = searchParams.get("trx_id") || searchParams.get("order_id") || searchParams.get("payment_id") || searchParams.get("id");
    const isAlreadyUpgraded = effectivePlan === 'ultimate' || (Boolean(trxId) && profile?.last_payment_trx_id === trxId);

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
                // Panggil RPC claim_upgrade untuk memproses transaksi di mayar_transactions
                const { data: claimSuccess, error } = await supabase.rpc('claim_upgrade', {
                    p_trx_id: trxId
                });

                if (error) {
                    console.error("UltimateSuccess Claim Error:", error);
                }

                if (claimSuccess) {
                    if (refreshProfile) await refreshProfile(true);
                    if (isMounted) {
                        setClaimed(true);
                        setVerifying(false);
                        clearInterval(pollInterval);
                    }
                } else {
                    // Cek apakah sudah di-upgrade otomatis oleh webhook
                    if (refreshProfile) {
                        const updated = await refreshProfile(true);
                        if (updated?.plan === 'ultimate' || updated?.last_payment_trx_id === trxId) {
                            if (isMounted) {
                                setClaimed(true);
                                setVerifying(false);
                                clearInterval(pollInterval);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("UltimateSuccess Polling Error:", e);
            }
        };

        checkPlanStatus();

        pollInterval = setInterval(() => {
            checkPlanStatus();
        }, 2500);

        const timeout = setTimeout(() => {
            if (isMounted) {
                clearInterval(pollInterval);
                setErrorMsg("Waktu tunggu verifikasi habis. Jika Anda sudah membayar, silakan muat ulang halaman ini nanti atau cek dashboard.");
                setVerifying(false);
            }
        }, 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(pollInterval);
            clearTimeout(timeout);
        };
    }, [user, authLoading, trxId, isAlreadyUpgraded, refreshProfile]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memverifikasi pembayaran...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-purple-100">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                        <CheckCircle size={36} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Pembayaran Diterima!</h1>
                    <p className="text-gray-600 mb-6 text-sm">
                        Silakan masuk ke akun My Invoice Anda untuk mengklaim dan mengaktifkan paket ULTIMATE secara instan.
                    </p>
                    <button
                        onClick={() => navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search))}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                    >
                        <LogIn size={18} /> Masuk & Aktifkan Paket
                    </button>
                </div>
            </div>
        );
    }

    const finalError = isMissingTrx ? "ID Transaksi tidak ditemukan di URL. Tidak dapat memverifikasi." : errorMsg;
    if (finalError && !isClaimed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">Verifikasi Belum Selesai</h1>
                    <p className="text-gray-500 mb-6 text-sm">{finalError}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                    <p className="text-xs text-gray-400 mt-4 font-medium">
                        Hubungi <strong>hello.myinvoice@gmail.com</strong> jika saldo Anda terpotong namun paket belum aktif.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                <div className="text-7xl mb-4 animate-pulse pt-2 flex justify-center"><Users size={64} className="text-violet-600" /></div>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Selamat! Kamu sekarang ULTIMATE!</h1>
                <p className="text-gray-500 mb-6">Versi paling sempurna. Bisnismu sekarang di level berikutnya.</p>
                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-5 py-2.5 rounded-full font-black text-lg shadow-sm border border-purple-200 backdrop-blur-sm">
                        ULTIMATE
                    </span>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-5 mb-8 text-left border border-purple-100">
                    <h3 className="font-bold text-purple-900 mb-3 text-sm uppercase tracking-wider">Fitur unggulan:</h3>
                    <ul className="space-y-2 text-sm text-gray-700 font-medium">
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Semua fitur PRO</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Fitur Kasir (Point of Sale)</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Manajemen stok barang</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Struk & nota kasir</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Laporan keuangan lengkap</li>
                        <li className="flex items-center gap-2"><Check size={16} className="text-purple-500 inline mr-1" /> Prioritas support</li>
                    </ul>
                </div>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-1 cursor-pointer"
                >
                    Mulai Gunakan →
                </button>
                <p className="text-xs text-gray-400 mt-6 font-medium">
                    Konfirmasi pembayaran dan invoice dikirim ke email kamu.
                </p>
            </div>
        </div>
    );
}
