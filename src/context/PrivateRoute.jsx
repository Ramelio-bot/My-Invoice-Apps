import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "./ToastContext";
import { useLang } from "./LanguageContext";
import { useEffect, useRef } from "react";

export default function PrivateRoute({ children }) {
  const { user, session, loading } = useAuth();
  const { showToast } = useToast();
  const { lang } = useLang();
  const hasShownToast = useRef(false);
  const isGuest = localStorage.getItem("guest_mode") === "true";

  // Tunggu sampai auth selesai cek — jangan redirect dulu!
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Setelah loading selesai, baru cek auth
  useEffect(() => {
    if (!loading && !user && !session && !isGuest && !hasShownToast.current) {
      showToast(
        lang === 'ID' ? "Silakan login terlebih dahulu untuk mengakses halaman ini." : "Please login first to access this page.",
        'warning'
      );
      hasShownToast.current = true;
    }
  }, [loading, user, session, isGuest, lang, showToast]);

  if (!loading && (!user || !session) && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return children;
}
