import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, session, loading, isVerified } = useAuth();

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
