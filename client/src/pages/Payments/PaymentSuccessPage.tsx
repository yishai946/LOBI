import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const shortSessionId = useMemo(() => {
    if (!sessionId || sessionId.length < 10) {
      return sessionId;
    }

    return `${sessionId.slice(0, 6)}...${sessionId.slice(-4)}`;
  }, [sessionId]);

  const handleReceiptDownload = () => {
    if (!sessionId) {
      setReceiptError('לא נמצא מזהה עסקה כדי למשוך קבלה.');
      return;
    }

    setReceiptError(null);

    const baseApiUrl = import.meta.env.VITE_API_URL;
    const receiptUrl = `${baseApiUrl}/payments/public/receipt?session_id=${encodeURIComponent(sessionId)}&download=1`;
    window.open(receiptUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" p={3}>
      <Paper
        elevation={6}
        sx={{
          maxWidth: 520,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 4,
          textAlign: 'center',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          backgroundColor: 'rgba(255, 255, 255, 0.24)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 10px 28px rgba(15, 23, 42, 0.09)',
        }}
      >
        <Stack spacing={2.2} alignItems="center">
          <CheckCircleRoundedIcon color="success" sx={{ fontSize: 64 }} />

          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            התשלום בוצע בהצלחה
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 380 }}>
            קיבלנו את התשלום שלך והמערכת תעדכן את הסטטוס בדקות הקרובות.
          </Typography>

          {shortSessionId && (
            <Typography
              variant="caption"
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.55)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
              }}
            >
              מזהה עסקה: {shortSessionId}
            </Typography>
          )}

          {receiptError && (
            <Typography variant="body2" color="error.main">
              {receiptError}
            </Typography>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              startIcon={<ReceiptLongRoundedIcon />}
              onClick={handleReceiptDownload}
              disabled={!sessionId}
            >
              הורדת קבלה
            </Button>
            <Button
              variant="contained"
              startIcon={<PaymentsRoundedIcon />}
              onClick={() => navigate('/payments')}
            >
              חזרה לתשלומים
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeRoundedIcon />}
              onClick={() => navigate('/home')}
            >
              חזרה לדף הבית
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};
