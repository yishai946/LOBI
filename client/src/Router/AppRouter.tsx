import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import LoadingScreen from './LoadingScreen';
import Pages from './Pages';
import Layout from './Layout';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {Pages.filter((page) => page.isPublicOnly).map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={<PublicOnlyRoute>{page.element}</PublicOnlyRoute>}
            />
          ))}

          {Pages.filter((page) => !page.isProtected && !page.isPublicOnly).map((page) => (
            <Route key={page.path} path={page.path} element={page.element} />
          ))}

          <Route element={<Layout />}>
            {Pages.filter((page) => page.isProtected).map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={
                  <ProtectedRoute
                    allowedRoles={page.allowedRoles}
                    requireContext={page.requireContext}
                    redirectIfContextSelected={page.redirectIfContextSelected}
                  >
                    {page.element}
                  </ProtectedRoute>
                }
              />
            ))}
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
