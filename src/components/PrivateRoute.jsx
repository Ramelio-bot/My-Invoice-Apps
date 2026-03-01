import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
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

  // Sudah selesai loading, tidak ada user → ke home
  if (!user) return <Navigate to="/" replace />;

  return children;
}
