import React from 'react';
import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Center, Column } from '@components/containers';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Center sx={{ minHeight: '100vh', px: 3, bgcolor: 'background.default' }}>
      <Column sx={{ maxWidth: 360, textAlign: 'center', gap: 2.5, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          אין הרשאה לצפייה
        </Typography>
        <Typography variant="body1" color="text.secondary">
          לחשבון שלך אין הרשאות מתאימות לגישה לעמוד הזה.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/home', { replace: true })}>
          חזרה למסך הבית
        </Button>
      </Column>
    </Center>
  );
};
