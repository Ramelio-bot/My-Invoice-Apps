import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLang } from "../context/LanguageContext";
import { useEffect, useRef } from "react";

export default function PrivateRoute({ children }) {
  const { user, session, loading } = useAuth();
  const { showToast } = useToast();
  const { lang } = useLang();
  const hasShownToast = useRef(false);
  const isGuest = localStorage.getItem("guest_mode") === "true";

  // Guest mode langsung masuk
  if (isGuest) return children;

  // Tunggu AuthContext selesai init
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 font-medium animate-pulse">Memuat data...</p>
      </div>
    );
  }

  // Setelah loading selesai, baru cek auth
  useEffect(() => {
    if (!loading && (!user || !session) && !isGuest && !hasShownToast.current) {
      showToast(
        lang === 'ID' 
          ? "Silakan login terlebih dahulu untuk mengakses halaman ini." 
          : "Please login first to access this page.",
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
