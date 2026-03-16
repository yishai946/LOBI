import React from 'react';
import { BottomNavigation, BottomNavigationAction, Box, Paper } from '@mui/material';
import { Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import Pages from './Pages';

const navigationPages = Pages.filter((page) => page.isProtected && page.isVisibleInMenu);

const getMatchedPage = (pathname: string) => {
  return Pages.find((page) => {
    if (page.path === '*') {
      return false;
    }

    return Boolean(matchPath({ path: page.path, end: page.path !== '/' }, pathname));
  });
};

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = getMatchedPage(location.pathname);
  const showNavigation = Boolean(currentPage?.isProtected && currentPage?.isVisibleInMenu);
  const currentNavigationPath =
    navigationPages.find((page) => matchPath({ path: page.path, end: false }, location.pathname))
      ?.path ?? false;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="main" sx={{ pb: showNavigation ? 9 : 0 }}>
        <Outlet />
      </Box>

      {showNavigation && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            right: 0,
            bottom: 0,
            left: 0,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            overflow: 'hidden',
          }}
        >
          <BottomNavigation
            showLabels
            value={currentNavigationPath}
            onChange={(_, nextPath: string) => {
              if (nextPath !== location.pathname) {
                navigate(nextPath);
              }
            }}
          >
            {navigationPages.map((page) => (
              <BottomNavigationAction
                key={page.path}
                value={page.path}
                label={page.title}
                icon={page.icon}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

export default Layout;
