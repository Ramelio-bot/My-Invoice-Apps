import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function UltimateSuccess() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }

        const upgradeToUltimate = async () => {
            try {
                const { error: dbError } = await supabase
                    .from("profiles")
                    .update({
                        plan: "ultimate",
                        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .eq("id", user.id);

                if (dbError) throw dbError;

                if (refreshProfile) {
                    await refreshProfile();
                }
            } catch (e) {
                console.error("Gagal mengupdate status ULTIMATE:", e);
                setErrorMsg(e.message || "Terjadi kesalahan saat memproses update profil.");
            } finally {
                setLoading(false);
            }
        };

        upgradeToUltimate();
    }, [user, navigate, refreshProfile]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                <p className="text-gray-500 font-medium animate-pulse">Memproses pembayaran...</p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-red-100 dark:border-red-900/30">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Update Tertunda</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">{errorMsg}</p>
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="w-full py-3.5 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold transition-all"
                    >
                        Kembali ke Dashboard
                    </button>
                    <p className="text-xs text-gray-400 mt-6 font-medium">Hubungi support@myinvoice.space jika saldo Anda terpotong namun paket belum aktif.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 dark:border-gray-700 relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-indigo-600"></div>

                <div className="text-7xl mb-4 animate-pulse pt-2 text-transparent text-shadow">👑</div>

                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Selamat! Kamu sekarang ULTIMATE!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Versi paling sempurna. Bisnismu sekarang di level berikutnya.</p>

                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 px-5 py-2.5 rounded-full font-black text-lg shadow-sm border border-purple-200 dark:border-purple-800 backdrop-blur-sm">
                        ULTIMATE 👑
                    </span>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 rounded-2xl p-5 mb-8 text-left border border-purple-100 dark:border-purple-800/30">
                    <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-3 text-sm uppercase tracking-wider">Fitur unggulan:</h3>
                    <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Semua fitur PRO</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Fitur Kasir (Point of Sale)</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Manajemen stok barang</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Struk &amp; nota kasir</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Laporan keuangan lengkap</li>
                        <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">✓</span> Prioritas support</li>
                    </ul>
                </div>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-purple-600/30 transition-all transform hover:-translate-y-1"
                >
                    Mulai Gunakan →
                </button>
                <p className="text-xs text-gray-400 mt-6 font-medium">
                    Catatan: Konfirmasi pembayaran dan invoice dikirim ke email kamu.
                </p>
            </div>
        </div>
    );
}
