import { Navigate } from 'react-router-dom';

/**
 * Protects all app routes.
 * Allowed if: guest_mode === "true" OR auth_token is set.
 * Otherwise redirect to landing page (/).
 */
export default function PrivateRoute({ children }) {
    const isGuest = localStorage.getItem('guest_mode') === 'true';
    const isAuth = !!localStorage.getItem('auth_token');

    if (!isGuest && !isAuth) {
        return <Navigate to="/" replace />;
    }

    return children;
}
