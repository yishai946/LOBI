import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Divider, IconButton, Paper, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../providers/AuthContext';
import { Row, Column, Center } from '../../components/containers';

export const HomePage: React.FC = () => {
  const { user, currentContext, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Column
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        component="header"
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Row sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
          <Row sx={{ alignItems: 'center', gap: 1.5 }}>
            <Center
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <ApartmentIcon fontSize="small" />
            </Center>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                {currentContext?.buildingName || 'LOBI'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentContext?.type}
              </Typography>
            </Box>
          </Row>

          <IconButton onClick={handleLogout} sx={{ bgcolor: 'action.hover' }} aria-label="logout">
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Row>
      </Box>

      <Box component="main" sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, pb: 8 }}>
        <Paper
          elevation={4}
          sx={{
            borderRadius: 3,
            p: 3,
            mb: 3,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            שלום, {user?.name || 'משתמש'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, fontStyle: 'italic' }}>
            ברוך הבא למערכת LOBI
          </Typography>
        </Paper>

        <Paper variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            פרטי משתמש
          </Typography>

          <Column sx={{ gap: 1 }}>
            <Typography variant="body1">
              <Box component="span" sx={{ fontWeight: 700 }}>
                טלפון:
              </Box>{' '}
              {user?.phone}
            </Typography>
            <Typography variant="body1">
              <Box component="span" sx={{ fontWeight: 700 }}>
                תפקיד:
              </Box>{' '}
              {user?.role}
            </Typography>
            <Typography variant="body1">
              <Box component="span" sx={{ fontWeight: 700 }}>
                הקשר נוכחי:
              </Box>{' '}
              {currentContext?.type}
            </Typography>
          </Column>

          <Divider sx={{ my: 2 }} />

          <Button variant="outlined" color="primary" onClick={handleLogout}>
            התנתקות
          </Button>
        </Paper>
      </Box>
    </Column>
  );
};
