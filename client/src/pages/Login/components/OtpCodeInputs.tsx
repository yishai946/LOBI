import React from 'react';
import { TextField } from '@mui/material';
import { Row } from '../../../components/containers';

interface OtpCodeInputsProps {
  otp: string[];
  inputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onChange: (index: number, value: string) => void;
  onKeyDown: (index: number, event: React.KeyboardEvent<HTMLElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLInputElement>) => void;
}

export const OtpCodeInputs: React.FC<OtpCodeInputsProps> = ({
  otp,
  inputRefs,
  onChange,
  onKeyDown,
  onPaste,
}) => {
  return (
    <Row
      sx={{
        justifyContent: 'center',
        gap: { xs: 0.75, sm: 1.25, md: 1.5 },
        mb: { xs: 1.25, sm: 2.5, md: 3.5 },
        width: '100%',
      }}
      dir="ltr"
    >
      {otp.map((digit, index) => (
        <TextField
          key={index}
          inputRef={(element) => {
            inputRefs.current[index] = element;
          }}
          autoFocus={index === 0}
          type="text"
          value={digit}
          onChange={(event) => onChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          inputProps={{
            inputMode: 'numeric',
            autoComplete: 'one-time-code',
            pattern: '[0-9]*',
            maxLength: 1,
            style: {
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              padding: 0,
            },
          }}
          sx={{
            width: { xs: 40, sm: 46, md: 48 },
            '& .MuiOutlinedInput-root': {
              height: { xs: 48, sm: 54, md: 56 },
              borderRadius: 2,
              bgcolor: 'background.paper',
            },
          }}
        />
      ))}
    </Row>
  );
};
