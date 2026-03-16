import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Button, TextField, Typography, Box } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import { authService } from '../../api/authService';
import { Column, Center } from '../../components/containers';
import { useGlobalMessage } from '../../providers/MessageProvider';

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
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Center
        sx={{
          gap: 1.5,
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            color: 'primary.main',
          }}
        >
          התחברות
        </Typography>
      </Center>

      <Column
        sx={{
          alignItems: 'center',
          textAlign: 'center',
          px: 3,
          pt: 6,
          pb: 4,
        }}
      >
        <Box
          component="img"
          src="/images/logo.png"
          alt="לוגו LOBI"
          sx={{
            width: 100,
            height: 100,
            objectFit: 'contain',
            mb: 3,
            filter: 'drop-shadow(0 8px 16px rgba(0, 31, 61, 0.18))',
          }}
        />
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1.5 }}
        >
          ברוכים הבאים
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 280 }}>
          הזן את מספר הטלפון שלך כדי להתחבר למערכת המאובטחת שלנו
        </Typography>
      </Column>

      <Column
        sx={{
          gap: 3,
          px: 3,
          py: 2,
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
              sx: { height: 56, bgcolor: 'background.paper' },
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
            height: 56,
            fontSize: '1.125rem',
            boxShadow: '0 10px 15px -3px rgba(0, 31, 61, 0.2)',
          }}
        >
          {requestOtpMutation.isPending ? 'שולח...' : 'שלח קוד אימות'}
        </Button>
      </Column>

      <Column
        sx={{
          mt: 'auto',
          alignItems: 'center',
          gap: 2,
          pb: 6,
          px: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
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
    </Column>
  );
};
