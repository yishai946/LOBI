import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Button, TextField, Typography, Box } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { authService } from '../../api/authService';
import { Column, Center } from '../../components/containers';
import { useGlobalMessage } from '../../providers/MessageProvider';
import { AuthPageHeader } from './components/AuthPageHeader';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalMessage();

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
      : fallback;

  const requestOtpMutation = useMutation({
    mutationFn: authService.requestOtp,
    onSuccess: (_, variables) => {
      showSuccess('קוד האימות נשלח בהצלחה');
      navigate('/otp', { state: { phone: variables.phone }, replace: true });
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בשליחת קוד אימות'));
    },
  });
  const phoneRegex = /^05\d{8}$/;
  const isPhoneValid = phoneRegex.test(phone);
  const mutationErrorMessage = axios.isAxiosError(requestOtpMutation.error)
    ? (requestOtpMutation.error.response?.data as { message?: string } | undefined)?.message
    : undefined;

  const error = requestOtpMutation.isError
    ? mutationErrorMessage || 'שגיאה בשליחת קוד אימות'
    : !isPhoneValid && phone.length > 0
      ? 'מספר טלפון לא תקין. אנא הזן מספר בפורמט 05XXXXXXXX'
      : '';

  const handleSendOtp = () => {
    if (!isPhoneValid) {
      return;
    }

    requestOtpMutation.mutate({ phone });
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || requestOtpMutation.isPending) {
      return;
    }

    e.preventDefault();
    handleSendOtp();
  };

  return (
    <Column
      sx={{
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <AuthPageHeader title="אימות חשבון" />
      <Center
        textAlign="center"
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          px: { xs: 2, sm: 3 },
          pt: { xs: 1.5, sm: 2.5 },
          pb: { xs: 'calc(14px + env(safe-area-inset-bottom, 0px))', sm: 2.5 },
          gap: { xs: 4, sm: 2.5 },
        }}
      >
        <Box
          component="img"
          src="/assets/logo.png"
          alt="לוגו LOBI"
          width={{ xs: 68, sm: 50, md: 96 }}
          height={{ xs: 68, sm: 50, md: 96 }}
          mb={{ xs: 1, sm: 2.5 }}
          sx={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 8px 16px rgba(0, 31, 61, 0.18))',
          }}
        />
        <Typography
          variant="h4"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            mb: { xs: 0.5, sm: 1.25 },
            fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.125rem' },
            lineHeight: 1.2,
          }}
        >
          ברוכים הבאים
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            maxWidth: 320,
            fontSize: { xs: '0.9rem', sm: '1rem' },
            lineHeight: 1.35,
          }}
        >
          הזן את מספר הטלפון שלך כדי להתחבר למערכת המאובטחת שלנו
        </Typography>

        <Column
          sx={{
            gap: { xs: 1.5, sm: 2.5 },
            px: { xs: 0, sm: 2, md: 3 },
            py: { xs: 0.5, sm: 1.5 },
            maxWidth: 480,
            mx: 'auto',
            width: '100%',
          }}
        >
          <Column sx={{ width: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
              מספר טלפון
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="05X-XXXXXXX"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={handlePhoneKeyDown}
              error={!!error}
              helperText={error || 'קוד אימות יישלח אליך ב-SMS'}
              InputProps={{
                startAdornment: (
                  <Center
                    sx={{
                      pr: 2,
                      color: 'text.secondary',
                      borderRight: 1,
                      borderColor: 'divider',
                      mr: 2,
                    }}
                  >
                    <PhoneIcon />
                  </Center>
                ),
                sx: {
                  height: { xs: 50, sm: 56 },
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                },
              }}
              inputProps={{ dir: 'ltr' }}
            />
          </Column>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendOtp}
            disabled={requestOtpMutation.isPending}
            sx={{
              height: { xs: 50, sm: 56 },
              fontSize: { xs: '1rem', sm: '1.125rem' },
              boxShadow: '0 10px 15px -3px rgba(0, 31, 61, 0.2)',
            }}
          >
            {requestOtpMutation.isPending ? 'שולח...' : 'שלח קוד אימות'}
          </Button>
        </Column>

        <Column
          sx={{
            alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            px: { xs: 1, sm: 2 },
            pb: { xs: 'calc(10px + env(safe-area-inset-bottom, 0px))', sm: 2 },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ lineHeight: 1.45 }}
          >
            בכניסתך למערכת הינך מסכים ל
            <Typography
              component="a"
              href="#"
              variant="body2"
              color="primary"
              sx={{
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                mx: 0.5,
              }}
            >
              תנאי השימוש
            </Typography>
            ול
            <Typography
              component="a"
              href="#"
              variant="body2"
              color="primary"
              sx={{
                fontWeight: 600,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                mx: 0.5,
              }}
            >
              מדיניות הפרטיות
            </Typography>
          </Typography>
        </Column>
      </Center>
    </Column>
  );
};
