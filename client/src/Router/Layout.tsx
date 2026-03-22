import { Header } from '@components/Header';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Tabs from './Tabs';

const Layout = () => {
  return (
    <Box sx={{ minHeight: '100vh', background: 'transparent' }}>
      <Header />
      <Box component="main" p={2} pb={14}>
        <Outlet />
      </Box>
      <Tabs />
    </Box>
  );
};

export default Layout;
