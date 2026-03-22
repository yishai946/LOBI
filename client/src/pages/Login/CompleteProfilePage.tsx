import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Box, Button, TextField, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { authService } from '../../api/authService';
import { Column, Center } from '../../components/containers';
import { useAuth } from '../../providers/AuthContext';
import { useGlobalMessage } from '../../providers/MessageProvider';
import { AuthPageHeader } from './components/AuthPageHeader';
import { usePostAuthRouting } from './hooks/usePostAuthRouting';

export const CompleteProfilePage: React.FC = () => {
  const [name, setName] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { contexts, currentContext, completeProfile, needsProfileCompletion } = useAuth();
  const { showSuccess, showError } = useGlobalMessage();
  const { continueAfterAuthentication, isPending: isRoutingPending } = usePostAuthRouting();

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 2;

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
      : fallback;

  const completeProfileMutation = useMutation({
    mutationFn: authService.completeProfile,
    onSuccess: async (response) => {
      setIsRedirecting(true);
      completeProfile(response.user);
      showSuccess('הפרופיל הושלם בהצלחה');
      await continueAfterAuthentication(contexts);
    },
    onError: (error) => {
      setIsRedirecting(false);
      showError(getErrorMessage(error, 'שגיאה בהשלמת הפרופיל'));
    },
  });

  if (!needsProfileCompletion && !isRedirecting) {
    if (currentContext) {
      return <Navigate to="/home" replace />;
    }

    if (contexts.length > 1) {
      return <Navigate to="/select-context" replace />;
    }

    return <Navigate to="/home" replace />;
  }

  const handleSubmit = () => {
    if (!isNameValid || completeProfileMutation.isPending || isRoutingPending) {
      return;
    }

    completeProfileMutation.mutate({ name: trimmedName });
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  const error = completeProfileMutation.isError
    ? getErrorMessage(completeProfileMutation.error, 'שגיאה בהשלמת הפרופיל')
    : !isNameValid && name.length > 0
      ? 'יש להזין שם מלא באורך של לפחות 2 תווים'
      : '';

  return (
    <Column sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AuthPageHeader title="השלמת פרופיל" onBack={() => navigate('/login')} />

      <Column
        sx={{
          flex: 1,
          justifyContent: 'center',
          px: 3,
          py: 4,
          maxWidth: 480,
          width: '100%',
          mx: 'auto',
          gap: 3,
        }}
      >
        <Center sx={{ textAlign: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'rgba(37, 99, 235, 0.08)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PersonOutlineIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            לפני שממשיכים
          </Typography>
          <Typography variant="body1" color="text.secondary">
            יש להשלים שם מלא כדי להמשיך למערכת.
          </Typography>
        </Center>

        <Column sx={{ gap: 1.25 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
            שם מלא
          </Typography>
          <TextField
            fullWidth
            placeholder="הזן שם מלא"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={handleNameKeyDown}
            error={Boolean(error)}
            helperText={error || 'השם יוצג לדיירים ולמנהלי המבנה'}
            InputProps={{
              sx: {
                height: 56,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              },
            }}
          />
        </Column>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={completeProfileMutation.isPending || isRoutingPending}
          sx={{ height: 56, fontSize: '1.05rem' }}
        >
          {completeProfileMutation.isPending || isRoutingPending ? 'שומר...' : 'שמירה והמשך'}
        </Button>
      </Column>
    </Column>
  );
};
