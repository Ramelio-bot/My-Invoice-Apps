import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useLang } from "../context/LanguageContext";
import { useEffect, useRef } from "react";

export default function PrivateRoute({ children }) {
  const { user, session, loading, isVerified } = useAuth();
  const { showToast } = useToast();
  const { lang } = useLang();
  const hasShownToast = useRef(false);
  const isGuest = localStorage.getItem("guest_mode") === "true";

  if (loading) return null;

  // Case 1: Real User Auth (takes priority over guest mode)
  if (user && session) {
    // If we are a real user, ensure guest mode is cleared to prevent logic leaks
    if (localStorage.getItem("guest_mode") === "true") {
      localStorage.removeItem("guest_mode");
    }

    if (!isVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    return children;
  }

  // Case 2: Guest Mode (only if not logged in)
  if (isGuest) return children;

  // Case 3: No Auth & No Guest -> Redirect to Landing/Login
  return <Navigate to="/" replace />;
}
