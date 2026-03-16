import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import { ContextType } from '../enums/ContextType';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ContextType[];
  requireContext?: boolean;
  redirectIfContextSelected?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireContext = false,
  redirectIfContextSelected = false,
}) => {
  const { isAuthenticated, isLoading, currentContext, needsProfileCompletion } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (needsProfileCompletion && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (redirectIfContextSelected && currentContext) {
    return <Navigate to="/home" replace />;
  }

  if (requireContext && !currentContext) {
    return <Navigate to="/select-context" state={{ from: location }} replace />;
  }

  if (allowedRoles && !currentContext) {
    return <Navigate to="/select-context" state={{ from: location }} replace />;
  }

  if (allowedRoles && currentContext && !allowedRoles.includes(currentContext.type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
