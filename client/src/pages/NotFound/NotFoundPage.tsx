import React from 'react';
import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Center, Column } from '@components/containers';
import { useAuth } from '@providers/AuthContext';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentContext, needsProfileCompletion } = useAuth();

  const handleNavigate = () => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (needsProfileCompletion) {
      navigate('/complete-profile', { replace: true });
      return;
    }

    if (!currentContext) {
      navigate('/select-context', { replace: true });
      return;
    }

    navigate('/home', { replace: true });
  };

  return (
    <Center sx={{ minHeight: '100vh', px: 3, bgcolor: 'background.default' }}>
      <Column sx={{ maxWidth: 360, textAlign: 'center', gap: 2.5, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          העמוד לא נמצא
        </Typography>
        <Typography variant="body1" color="text.secondary">
          הכתובת שאליה ניסית להגיע אינה קיימת או הועברה למקום אחר.
        </Typography>
        <Button variant="contained" onClick={handleNavigate}>
          חזרה למסלול תקין
        </Button>
      </Column>
    </Center>
  );
};
