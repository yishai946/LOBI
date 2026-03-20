import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { authService } from '../../api/authService';
import { useAuth } from '../../providers/AuthContext';
import { Button, Typography, Box } from '@mui/material';
import { Center, Column } from '../../components/containers';
import { useGlobalMessage } from '../../providers/MessageProvider';
import { AuthPageHeader } from './components/AuthPageHeader';
import { OtpCodeInputs } from './components/OtpCodeInputs';
import { useOtpInput } from './hooks/useOtpInput';
import { usePostAuthRouting } from './hooks/usePostAuthRouting';

export const OtpPage = () => {
  const [timeLeft, setTimeLeft] = useState(59);
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalMessage();
  const { login } = useAuth();
  const {
    continueAfterAuthentication,
    isPending: isRoutingPending,
    error: postAuthError,
  } = usePostAuthRouting();

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
      : fallback;

  const verifyOtpMutation = useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: async (response) => {
      showSuccess('האימות בוצע בהצלחה');

      login(response.accessToken, response.contexts, response.needsProfileCompletion);

      if (response.needsProfileCompletion) {
        navigate('/complete-profile', { replace: true });
        return;
      }

      await continueAfterAuthentication(response.contexts);
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה באימות הקוד'));
    },
  });

  const resendOtpMutation = useMutation({
    mutationFn: authService.resendOtp,
    onSuccess: () => {
      showSuccess('קוד חדש נשלח למכשירך');
      setTimeLeft(60);
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בשליחה חוזרת של הקוד'));
    },
  });

  const phone = location.state?.phone;

  const submitOtp = (code: string) => {
    if (code.length !== 6 || isSubmitting) {
      return;
    }

    verifyOtpMutation.mutate({
      phone,
      otp: code,
    });
  };

  const { otp, otpCode, isOtpComplete, inputRefs, handleChange, handleKeyDown, handlePaste } =
    useOtpInput({
      isSubmitting: verifyOtpMutation.isPending || isRoutingPending || resendOtpMutation.isPending,
      onSubmit: submitOtp,
    });

  const isSubmitting =
    verifyOtpMutation.isPending || isRoutingPending || resendOtpMutation.isPending;

  const mutationError = verifyOtpMutation.error || postAuthError || resendOtpMutation.error;

  const error = axios.isAxiosError(mutationError)
    ? (mutationError.response?.data as { message?: string } | undefined)?.message || 'שגיאה בפעולה'
    : '';

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft]);

  if (!phone) {
    return <Navigate to="/login" replace />;
  }

  const handleVerify = () => {
    if (!isOtpComplete) {
      return;
    }

    submitOtp(otpCode);
  };

  const handleResend = () => {
    if (timeLeft > 0 || resendOtpMutation.isPending) return;

    resendOtpMutation.mutate({ phone });
  };

  return (
    <Column
      sx={{
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <AuthPageHeader title="אימות חשבון" onBack={() => navigate('/login')} />

      <Center
        sx={{
          flex: 1,
          minHeight: 0,
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, sm: 2.5 },
          pb: { xs: 'calc(14px + env(safe-area-inset-bottom, 0px))', sm: 2.5 },
          maxWidth: 480,
          mx: 'auto',
          width: '100%',
          gap: { xs: 4, sm: 2.25 },
        }}
      >
        <Column
          sx={{
            alignItems: 'center',
            textAlign: 'center',
            gap: { xs: 0.75, sm: 1.1 },
          }}
        >
          <Box
            component="img"
            src="/images/logo.png"
            alt="לוגו LOBI"
            sx={{
              width: { xs: 64, sm: 82, md: 94 },
              height: { xs: 64, sm: 82, md: 94 },
              objectFit: 'contain',
              mb: { xs: 1, sm: 2 },
              filter: 'drop-shadow(0 8px 16px rgba(0, 31, 61, 0.18))',
            }}
          />
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 'bold',
              mb: { xs: 0.25, sm: 0.8 },
              fontSize: { xs: '1.3rem', sm: '1.6rem' },
              lineHeight: 1.2,
            }}
          >
            אימות קוד
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontSize: { xs: '0.92rem', sm: '1rem' }, lineHeight: 1.3 }}
          >
            הזן את הקוד שנשלח לנייד שלך
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              mt: { xs: 0.25, sm: 0.5 },
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
            dir="ltr"
          >
            {phone}
          </Typography>
        </Column>

        <OtpCodeInputs
          otp={otp}
          inputRefs={inputRefs}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
        />

        {error && (
          <Typography
            color="error"
            variant="body2"
            align="center"
            sx={{ mb: { xs: 0.5, sm: 1 }, lineHeight: 1.25 }}
          >
            {error}
          </Typography>
        )}

        <Column sx={{ alignItems: 'center', textAlign: 'center', gap: { xs: 0.2, sm: 0.5 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 0.4, sm: 0.8 } }}>
            לא קיבלת את הקוד?
          </Typography>
          <Button
            variant="text"
            color="primary"
            onClick={handleResend}
            disabled={timeLeft > 0 || resendOtpMutation.isPending}
            sx={{ fontWeight: 'bold' }}
          >
            {resendOtpMutation.isPending
              ? 'שולח...'
              : timeLeft > 0
                ? `שלח שוב (0:${timeLeft.toString().padStart(2, '0')})`
                : 'שלח שוב'}
          </Button>
        </Column>

        <Button
          variant="contained"
          color="primary"
          onClick={handleVerify}
          disabled={isSubmitting}
          sx={{
            width: '100%',
            height: { xs: 50, sm: 56 },
            fontSize: { xs: '1rem', sm: '1.125rem' },
            boxShadow: '0 10px 15px -3px rgba(0, 31, 61, 0.2)',
          }}
        >
          {isSubmitting ? 'מאמת...' : 'אימות וכניסה'}
        </Button>
      </Center>
    </Column>
  );
};
