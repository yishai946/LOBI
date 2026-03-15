import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { ContextType } from '../enums/ContextType';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ContextType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, currentContext } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Replace with a proper loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && currentContext && !allowedRoles.includes(currentContext.type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
