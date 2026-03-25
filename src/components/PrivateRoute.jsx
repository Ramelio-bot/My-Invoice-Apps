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

  if (loading) return null;
  
  if (user && session) {
    if (!isVerified) {
      return <Navigate to="/verify-email" replace />;
    }
    return children;
  }

  // No Auth -> Redirect to Landing/Login
  return <Navigate to="/" replace />;
}
