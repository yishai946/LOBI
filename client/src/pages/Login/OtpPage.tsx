import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../api/authService';
import { useAuth } from '../../providers/AuthContext';
import { Button, Typography, Box, IconButton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VibrationIcon from '@mui/icons-material/Vibration';
import LockIcon from '@mui/icons-material/Lock';

export const OtpPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const phone = location.state?.phone;

  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleChange = (index: number, value: string) => {
    value = value.replace(/[^0-9]/g, '');
    if (value.length > 1) {
      value = value.slice(-1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('אנא הזן קוד בן 6 ספרות');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verifyOtp({ phone, otp: otpCode });
      login(response.accessToken, response.contexts, response.needsProfileCompletion);
      
      if (response.contexts.length > 1) {
        navigate('/select-context');
      } else if (response.contexts.length === 1) {
        await authService.selectContext({
          type: response.contexts[0].type,
          buildingId: response.contexts[0].buildingId,
          apartmentId: response.contexts[0].apartmentId
        });
        navigate('/home');
      } else {
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'קוד אימות שגוי');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0) return;
    try {
      await authService.resendOtp({ phone });
      setTimeLeft(60);
      alert('קוד חדש נשלח למכשירך');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשליחת קוד חדש');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 10 }}>
        <IconButton onClick={() => navigate('/login')} sx={{ color: 'primary.main' }}>
          <ArrowForwardIcon />
        </IconButton>
        <Typography variant="h6" component="h1" sx={{ flex: 1, textAlign: 'center', pr: 6, fontWeight: 'bold' }}>
          אימות חשבון
        </Typography>
      </Box>
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', px: 3, pt: 6, maxWidth: 480, mx: 'auto', width: '100%' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', mb: 5 }}>
          <Box sx={{ width: 80, height: 80, bgcolor: 'primary.main', opacity: 0.1, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, position: 'relative' }}>
            <VibrationIcon sx={{ fontSize: 40, color: 'primary.main', position: 'absolute' }} />
          </Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1.5 }}>
            אימות קוד
          </Typography>
          <Typography variant="body1" color="text.secondary">
            הזן את הקוד שנשלח לנייד שלך
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, mt: 0.5 }} dir="ltr">
            {phone}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 4 }} dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-white text-2xl font-bold border-2 border-slate-700 rounded-lg focus:border-primary focus:ring-0 bg-slate-800 transition-all"
            />
          ))}
        </Box>
        
        {error && <Typography color="error" variant="body2" align="center" sx={{ mb: 2 }}>{error}</Typography>}
        
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            לא קיבלת את הקוד?
          </Typography>
          <Button 
            variant="text" 
            color="primary" 
            onClick={handleResend} 
            disabled={timeLeft > 0}
            sx={{ fontWeight: 'bold' }}
          >
            {timeLeft > 0 ? `שלח שוב (0:${timeLeft.toString().padStart(2, '0')})` : 'שלח שוב'}
          </Button>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={handleVerify}
          disabled={isLoading}
          sx={{ height: 56, fontSize: '1.125rem', boxShadow: '0 10px 15px -3px rgba(0, 31, 61, 0.2)' }}
        >
          {isLoading ? 'מאמת...' : 'אימות וכניסה'}
        </Button>
      </Box>
    </Box>
  );
};
