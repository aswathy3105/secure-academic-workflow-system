import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles, allowedStaffTypes }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role first
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // Check staffType if role is staff and specific types are required
  if (user.role === 'staff' && allowedStaffTypes && !allowedStaffTypes.includes(user.staffType)) {
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
