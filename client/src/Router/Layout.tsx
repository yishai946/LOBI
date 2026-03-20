import { Header } from '@components/Header';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Box component="main" p={2}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
