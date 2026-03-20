import { alpha } from '@mui/material';
import { Column } from './StackContainers';

interface CardProps {
  children: React.ReactNode;
  isError?: boolean;
}

export const Card = ({ children, isError }: CardProps) => (
  <Column
    border={1}
    borderColor={isError ? 'error.main' : 'divider'}
    borderRadius={2}
    p={2}
    sx={(theme) => ({
      bgcolor: isError ? alpha(theme.palette.error.main, 0.12) : theme.palette.background.paper,
    })}
  >
    {children}
  </Column>
);
