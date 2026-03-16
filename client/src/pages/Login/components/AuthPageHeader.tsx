import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Row } from '../../../components/containers';

interface AuthPageHeaderProps {
  title: string;
  onBack?: () => void;
}

export const AuthPageHeader: React.FC<AuthPageHeaderProps> = ({ title, onBack }) => {
  return (
    <Row
      sx={{
        alignItems: 'center',
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {onBack ? (
        <IconButton onClick={onBack} sx={{ color: 'primary.main' }}>
          <ArrowForwardIcon />
        </IconButton>
      ) : (
        <Box sx={{ width: 40 }} />
      )}
      <Typography
        variant="h6"
        component="h1"
        sx={{ flex: 1, textAlign: 'center', pr: onBack ? 6 : 0, fontWeight: 'bold' }}
      >
        {title}
      </Typography>
      <Box sx={{ width: 40 }} />
    </Row>
  );
};
