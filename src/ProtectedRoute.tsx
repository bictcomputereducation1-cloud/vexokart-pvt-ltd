import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  vendorOnly?: boolean;
  deliveryOnly?: boolean;
  customerOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  vendorOnly = false, 
  deliveryOnly = false,
  customerOnly = false
}) => {
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();

  // 1. Loading state while checking permissions
  if (authLoading) {
    console.log(`[ProtectedRoute] Auth/profile state is loading. Postponing evaluation for "${location.pathname}".`);
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent"></div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Verifying Permissions...</p>
      </div>
    );
  }

  // 14. Add console logs
  console.log("Auth User:", user);
  console.log("Database Profile:", profile);
  console.log("Database Role:", profile?.role || null);

  // 2. No active session -> Login
  if (!user) {
    const destination = "/login";
    console.log("Navigation:", destination, `(Redirecting from "${location.pathname}" due to no session)`);
    return <Navigate to={destination} state={{ from: location }} replace />;
  }

  // 3. Profile doesn't exist
  if (!profile) {
    console.warn(`[ProtectedRoute] Profile record not found in public.users table for ID: ${user.id}`);
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Role Missing</h2>
        <p className="text-slate-600 max-w-sm mx-auto">
          Your account is registered but does not have a designated role. Please contact system administration.
        </p>
      </div>
    );
  }

  // 15. If profile.role is missing show "Role Missing" instead of redirecting
  const role = profile.role;
  if (!role) {
    console.warn(`[ProtectedRoute] Role is missing on profile for ID: ${user.id}`);
    return (
      <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Role Missing</h2>
        <p className="text-slate-600 max-w-sm mx-auto">
          Your profile is active, but the assigned role is blank. Please contact system administration.
        </p>
      </div>
    );
  }

  // 4. Admin checking
  if (adminOnly && role !== 'admin') {
    console.warn(`[ProtectedRoute DENIED] Admin access required, but role is "${role}".`);
    return <AccessDeniedView roleName="Administrative" userRole={role} />;
  }

  // 5. Vendor checking
  if (vendorOnly && role !== 'vendor') {
    console.warn(`[ProtectedRoute DENIED] Vendor access required, but role is "${role}".`);
    return <AccessDeniedView roleName="Vendor" userRole={role} />;
  }

  // 6. Delivery checking
  if (deliveryOnly && role !== 'delivery') {
    console.warn(`[ProtectedRoute DENIED] Delivery access required, but role is "${role}".`);
    return <AccessDeniedView roleName="Delivery" userRole={role} />;
  }

  // 7. Customer checking (Only allows 'customer' or 'user')
  if (customerOnly && role !== 'customer' && role !== 'user') {
    console.warn(`[ProtectedRoute DENIED] Customer access required, but role is "${role}".`);
    return <AccessDeniedView roleName="Customer" userRole={role} />;
  }

  console.log(`[ProtectedRoute APPROVED] Access granted for role "${role}" to path "${location.pathname}".`);
  return <>{children}</>;
};

interface AccessDeniedProps {
  roleName: string;
  userRole: string;
}

const AccessDeniedView: React.FC<AccessDeniedProps> = ({ roleName, userRole }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      let destination = "/";
      if (userRole === 'admin') {
        destination = '/admin';
      } else if (userRole === 'vendor') {
        destination = '/vendor';
      } else if (userRole === 'delivery') {
        destination = '/delivery';
      }

      console.log("Navigation:", destination, `(Redirecting from access denied)`);
      navigate(destination, { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate, userRole]);

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center min-h-[60vh]">
      <div className="bg-white p-10 rounded-2xl border border-slate-100 max-w-md w-full shadow-2xl shadow-slate-200/50">
        <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0-6H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-6z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Access Denied</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          You don't have the required <span className="font-bold text-slate-800">{roleName}</span> permissions to view this page. 
          <br />
          <span className="text-sm font-semibold text-red-500 mt-2 block">Found Role: "{userRole}"</span>
          <span className="text-sm font-medium text-slate-400 mt-2 block">Redirecting to your authorized dashboard in 4 seconds...</span>
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => {
              let destination = "/";
              if (userRole === 'admin') {
                destination = '/admin';
              } else if (userRole === 'vendor') {
                destination = '/vendor';
              } else if (userRole === 'delivery') {
                destination = '/delivery';
              }
              console.log("Navigation:", destination);
              navigate(destination, { replace: true });
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-600/30 active:scale-[0.98]"
          >
            Go to My Dashboard Now
          </button>
        </div>
      </div>
    </div>
  );
};
