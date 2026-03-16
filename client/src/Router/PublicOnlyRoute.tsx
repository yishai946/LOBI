import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthContext';
import LoadingScreen from './LoadingScreen';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, currentContext, needsProfileCompletion } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (needsProfileCompletion) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (currentContext) {
    return <Navigate to="/home" replace />;
  }

  return <Navigate to="/select-context" replace />;
};
