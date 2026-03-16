import { useRef, useState } from 'react';

interface UseOtpInputOptions {
  isSubmitting: boolean;
  onSubmit: (code: string) => void;
}

const OTP_LENGTH = 6;

export const useOtpInput = ({ isSubmitting, onSubmit }: UseOtpInputOptions) => {
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpCode = otp.join('');
  const isOtpComplete = otpCode.length === OTP_LENGTH;

  const submitIfReady = (code: string) => {
    if (code.length !== OTP_LENGTH || isSubmitting) {
      return;
    }

    onSubmit(code);
  };

  const handleChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (!cleanValue) {
      setOtp((currentOtp) => {
        const nextOtp = [...currentOtp];
        nextOtp[index] = '';
        return nextOtp;
      });
      return;
    }

    const nextOtp = [...otp];

    if (cleanValue.length > 1) {
      const chunk = cleanValue.slice(0, OTP_LENGTH - index).split('');

      chunk.forEach((digit, offset) => {
        nextOtp[index + offset] = digit;
      });
    } else {
      nextOtp[index] = cleanValue;
    }

    setOtp(nextOtp);

    const nextEmptyIndex = nextOtp.findIndex((digit) => digit === '');

    if (nextEmptyIndex === -1) {
      submitIfReady(nextOtp.join(''));
      return;
    }

    inputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (isOtpComplete) {
        submitIfReady(otpCode);
      }
      return;
    }

    if (event.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData
      .getData('text')
      .replace(/[^0-9]/g, '')
      .slice(0, OTP_LENGTH);

    if (!pastedData) {
      return;
    }

    const nextOtp = Array.from({ length: OTP_LENGTH }, (_, index) => pastedData[index] ?? '');
    setOtp(nextOtp);

    if (pastedData.length === OTP_LENGTH) {
      submitIfReady(nextOtp.join(''));
      return;
    }

    inputRefs.current[pastedData.length]?.focus();
  };

  return {
    otp,
    otpCode,
    isOtpComplete,
    inputRefs,
    handleChange,
    handleKeyDown,
    handlePaste,
  };
};
