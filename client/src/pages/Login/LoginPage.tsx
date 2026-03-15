import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { Button, TextField, Card, Typography, Box, Divider } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PhoneIcon from '@mui/icons-material/Phone';

export const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(phone)) {
      setError('מספר טלפון לא תקין. אנא הזן מספר בפורמט 05XXXXXXXX');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.requestOtp({ phone });
      navigate('/otp', { state: { phone } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשליחת קוד אימות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography variant="h6" component="h2" sx={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: 'primary.main' }}>
          LOBI
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 3, pt: 6, pb: 4 }}>
        <Box sx={{ width: 80, height: 80, bgcolor: 'primary.main', opacity: 0.1, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4, position: 'relative' }}>
          <LockOpenIcon sx={{ fontSize: 40, color: 'primary.main', position: 'absolute' }} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1.5 }}>
          ברוכים הבאים
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', textAlign: 'center', maxWidth: 280 }}>
          הזן את מספר הטלפון שלך כדי להתחבר למערכת המאובטחת שלנו
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, px: 3, py: 2, maxWidth: 480, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
            error={!!error}
            helperText={error || 'קוד אימות יישלח אליך ב-SMS'}
            InputProps={{
              startAdornment: (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 2, color: 'text.secondary', borderRight: 1, borderColor: 'divider', mr: 2 }}>
                  <PhoneIcon />
                </Box>
              ),
              sx: { height: 56, bgcolor: 'background.paper' }
            }}
            inputProps={{ dir: 'ltr' }}
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSendOtp}
          disabled={isLoading}
          sx={{ height: 56, fontSize: '1.125rem', boxShadow: '0 10px 15px -3px rgba(0, 31, 61, 0.2)' }}
        >
          {isLoading ? 'שולח...' : 'שלח קוד אימות'}
        </Button>
      </Box>

      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, pb: 6, px: 3 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          בכניסתך למערכת הינך מסכים ל
          <Typography component="a" href="#" variant="body2" color="primary" sx={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4, mx: 0.5 }}>
            תנאי השימוש
          </Typography>
          ול
          <Typography component="a" href="#" variant="body2" color="primary" sx={{ fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 4, mx: 0.5 }}>
            מדיניות הפרטיות
          </Typography>
        </Typography>
      </Box>
    </Box>
  );
};
