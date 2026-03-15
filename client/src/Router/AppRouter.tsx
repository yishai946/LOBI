import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/Login/LoginPage';
import { OtpPage } from '../pages/Login/OtpPage';
import { ContextSelectionPage } from '../pages/ContextSelection/ContextSelectionPage';
import { HomePage } from '../pages/Home/HomePage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />

        {/* Protected Routes */}
        <Route
          path="/select-context"
          element={
            <ProtectedRoute>
              <ContextSelectionPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
