import { alpha } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';
import { Column } from './StackContainers';

interface CardProps {
  children: React.ReactNode;
  isError?: boolean;
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

export const Card = ({ children, isError, onClick, sx }: CardProps) => (
  <Column
    border={1}
    borderColor={isError ? 'rgba(204, 82, 82, 0.34)' : 'rgba(255, 255, 255, 0.38)'}
    borderRadius={2}
    p={2}
    onClick={onClick}
    sx={[
      {
        bgcolor: isError ? alpha('#CC5252', 0.1) : 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Column>
);
