import { Box, Typography } from '@mui/material';
import { Center, Row } from './containers';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { useAuth } from '@providers/AuthContext';

export const Header = () => {
  const { currentContext } = useAuth();

  return (
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
      </Row>
    </Box>
  );
};
