import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { Star } from "lucide-react";

export default function ProSuccess() {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        // If user is not logged in, redirect them to login first
        if (!user) {
            navigate("/login");
            return;
        }

        const upgradeToPro = async () => {
            try {
                const { error: dbError } = await supabase
                    .from("profiles")
                    .update({
                        plan: "pro",
                        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        pro_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    })
                    .eq("id", user.id);

                if (dbError) throw dbError;

                if (refreshProfile) {
                    await refreshProfile();
                }
            } catch (e) {
                console.error("Gagal mengupdate status PRO:", e);
                setErrorMsg(e.message || "Terjadi kesalahan saat memproses update profil.");
            } finally {
                setLoading(false);
            }
        };

        upgradeToPro();
    }, [user, navigate, refreshProfile]);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
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
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden p-8 text-center border border-gray-100 dark:border-gray-700">

                <div className="text-6xl mb-4 animate-bounce">🎉</div>

                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Selamat! Kamu sekarang PRO!</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Terima kasih telah berlangganan. Akun kamu berhasil di-upgrade.</p>

                <div className="mb-8">
                    <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 px-4 py-2 rounded-full font-black text-lg shadow-sm border border-blue-200 dark:border-blue-800">
                        PRO <Star size={18} fill="currentColor" />
                    </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-8 text-left border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm uppercase tracking-wider">Fitur yang didapat:</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Semua dokumen bisnis</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Manajemen klien</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Laporan keuangan</li>
                        <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Tanpa watermark</li>
                    </ul>
                </div>

                <button
                    onClick={() => navigate("/dashboard")}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1"
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
