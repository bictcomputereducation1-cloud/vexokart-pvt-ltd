import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <AccessDeniedView />;
  }

  return <>{children}</>;
};

const AccessDeniedView = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/', { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
          You don't have the required administrative permissions to view this page. 
          <br />
          <span className="text-sm font-medium text-slate-400 mt-2 block">Redirecting to home in 4 seconds...</span>
        </p>
        <div className="flex flex-col gap-3">
          <a 
            href="/"
            className="bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
          >
            Return to Home Now
          </a>
        </div>
      </div>
    </div>
  );
};
