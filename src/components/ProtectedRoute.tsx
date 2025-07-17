
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

// Admin emails that should always bypass approval checks
const ADMIN_EMAILS = ['info@dkenterprises.co.in', 'info@satguruengravures.com'];

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, profile, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Admin bypass logic for approval requirements
  const isAdminEmail = ADMIN_EMAILS.includes(user.email || '');
  const hasAccess = isAdmin() || profile?.is_approved || isAdminEmail;

  // Check if user needs approval (but bypass for admin emails)
  if (!hasAccess && !isAdminEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Account Pending Approval</h2>
          <p className="text-gray-600">Your account is pending approval from an administrator.</p>
          <p className="text-sm text-gray-500">Please contact your administrator for access.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Role-based access control (admin always has access)
  if (requiredRole && profile?.role !== requiredRole && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
