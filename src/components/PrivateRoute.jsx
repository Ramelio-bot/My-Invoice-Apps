import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PrivateRoute({ children }) {
  const isGuest = localStorage.getItem("guest_mode") === "true";
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Cek langsung ke Supabase — bukan lewat React state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setChecking(false);
    });
  }, []);

  // Tunggu sampai pengecekan selesai
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Setelah cek selesai — boleh masuk kalau ada session atau guest
  if (!hasSession && !isGuest) {
    return <Navigate to="/" replace />;
  }

  return children;
}
