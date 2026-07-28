import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const RequireAuth: React.FC = () => {
  const identity = useAuthStore((s) => s.identity);
  const location = useLocation();

  if (!identity) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
