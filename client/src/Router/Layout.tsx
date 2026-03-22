import { Header } from '@components/Header';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Tabs from './Tabs';

const Layout = () => {
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
          scrollbarWidth: 'thin',
          scrollbarColor: '#8D95A5 transparent',
          '&::-webkit-scrollbar': {
            width: 10,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(109, 79, 191, 0.55)',
            borderRadius: 999,
            border: '2px solid transparent',
            backgroundClip: 'padding-box',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: 'rgba(83, 58, 123, 0.75)',
          },
        }}
      >
        <Outlet />
      </Box>
      <Tabs />
    </Box>
  );
};

export default Layout;
