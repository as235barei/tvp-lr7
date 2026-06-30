import { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Guard for routes that require authentication (and optionally an admin role).
// - While the session is being restored (GET /api/auth/me) it renders nothing.
// - Guests are redirected to /login with a toast prompt.
// - When `adminOnly`, non-admins are bounced to the home page.
// Prepared for the admin panel in Lab #5 (wrap admin routes with adminOnly).
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const warned = useRef(false);

  const denied = !loading && (!isAuthenticated || (adminOnly && !isAdmin));

  useEffect(() => {
    if (denied && !warned.current) {
      warned.current = true;
      if (!isAuthenticated) {
        toast.warning('Please log in to continue.', { title: 'Login required' });
      } else {
        toast.error('Administrator access is required.', { title: 'Access denied' });
      }
    }
  }, [denied, isAuthenticated, toast]);

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
