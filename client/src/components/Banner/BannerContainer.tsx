import { Box, Paper } from '@mui/material';

interface BannerContainerProps {
  children: React.ReactNode;
}

export const BannerContainer = ({ children }: BannerContainerProps) => (
  <Box component="main">
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
      {children}
    </Paper>
  </Box>
);
