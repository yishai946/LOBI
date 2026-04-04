import { Header } from '@components/Header';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { usePushNotifications } from '@hooks/usePushNotifications';
import Tabs from './Tabs';

const Layout = () => {
  const { subscribeUser } = usePushNotifications();

  useEffect(() => {
    // Only prompt if permission is currently "default"
    if ('Notification' in window && Notification.permission === 'default') {
      const timeout = setTimeout(() => {
        subscribeUser();
      }, 3000); // Wait 3 seconds after login/load to not overwhelm the user
      return () => clearTimeout(timeout);
    }
  }, [subscribeUser]);

  return (
    <Box
      sx={{
        height: '100dvh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Header />
      <Box
        component="main"
        p={2}
        pb={14}
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Outlet />
      </Box>
      <Tabs />
    </Box>
  );
};

export default Layout;
