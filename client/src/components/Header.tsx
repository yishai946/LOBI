import { useMemo, useState } from 'react';
import { Box, IconButton, ListItemIcon, Menu, MenuItem, Typography } from '@mui/material';
import { Center, Row } from './containers';
import ApartmentIcon from '@mui/icons-material/Apartment';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useAuth } from '@providers/AuthContext';
import { translateContextType } from '@utils/contextTypeTranslations';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
  const { currentContext, contexts, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(menuAnchorEl);
  const canSwitchContext = useMemo(() => contexts.length > 1, [contexts.length]);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleSwitchContext = () => {
    closeMenu();
    navigate('/select-context', {
      state: { allowContextSwitch: true },
    });
  };

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        bgcolor: 'rgba(255, 255, 255, 0.28)',
        backdropFilter: 'blur(14px) saturate(145%)',
        WebkitBackdropFilter: 'blur(14px) saturate(145%)',
        boxShadow:
          '0 2px 0 rgba(255, 255, 255, 0.34) inset, 0 14px 34px rgba(15, 23, 42, 0.18), 0 6px 14px rgba(15, 23, 42, 0.1)',
      }}
    >
      <Row sx={{ alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
        <Row sx={{ alignItems: 'center', gap: 1.5 }}>
          <IconButton
            onClick={openMenu}
            size="small"
            sx={{
              p: 0,
              borderRadius: 2,
            }}
          >
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
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {currentContext?.buildingName || 'לובי'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {translateContextType(currentContext?.type)}
            </Typography>
          </Box>
        </Row>

        <Menu
          anchorEl={menuAnchorEl}
          open={isMenuOpen}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {canSwitchContext && (
            <MenuItem onClick={handleSwitchContext}>
              <ListItemIcon>
                <SwapHorizRoundedIcon fontSize="small" />
              </ListItemIcon>
              החלף פרופיל
            </MenuItem>
          )}
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            התנתקות
          </MenuItem>
        </Menu>
      </Row>
    </Box>
  );
};
