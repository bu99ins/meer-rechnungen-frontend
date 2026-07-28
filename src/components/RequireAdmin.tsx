import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const RequireAdmin: React.FC = () => {
  const identity = useAuthStore((s) => s.identity);

  if (identity?.role !== 'Admin') {
    return <Navigate to="/invoices" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
