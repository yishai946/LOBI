import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Alert, Box, Button, Card, Chip, Divider, IconButton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import EngineeringIcon from '@mui/icons-material/Engineering';
import PersonIcon from '@mui/icons-material/Person';
import { useAuth } from '../../providers/AuthContext';
import { useGlobalMessage } from '../../providers/MessageProvider';
import { AuthContextData } from '../../entities/AuthContextData';
import { ContextType } from '../../enums/ContextType';
import { authService } from '../../api/authService';
import { Row, Column, Center } from '../../components/containers';

export const ContextSelectionPage: React.FC = () => {
  const { contexts, currentContext, setContext } = useAuth();
  const { showSuccess, showError } = useGlobalMessage();
  const navigate = useNavigate();

  type SelectContextMutationInput = {
    context: AuthContextData;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
      : fallback;

  const selectContextMutation = useMutation({
    mutationFn: ({ context }: SelectContextMutationInput) =>
      authService.selectContext({
        type: context.type,
        buildingId: context.buildingId,
        apartmentId: context.apartmentId,
      }),
    onSuccess: (response, variables) => {
      showSuccess('ההקשר נבחר בהצלחה');
      setContext(variables.context, response.token);
      navigate('/home', { replace: true });
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בבחירת הקשר'));
    },
  });
  const error = axios.isAxiosError(selectContextMutation.error)
    ? (selectContextMutation.error.response?.data as { message?: string } | undefined)?.message ||
      'שגיאה בבחירת הקשר'
    : '';

  const handleSelectContext = (context: AuthContextData) => {
    selectContextMutation.mutate({ context });
  };

  const getContextKey = (context: AuthContextData) =>
    [context.type, context.buildingId ?? 'no-building', context.apartmentId ?? 'no-apartment'].join(
      ':'
    );

  const isActiveContext = (context: AuthContextData) =>
    Boolean(currentContext && getContextKey(currentContext) === getContextKey(context));

  const getRoleLabel = (type: ContextType) => {
    switch (type) {
      case ContextType.ADMIN:
        return 'מנהל מערכת';
      case ContextType.MANAGER:
        return 'מנהל מבנה';
      case ContextType.RESIDENT:
        return 'דייר';
      default:
        return 'משתמש';
    }
  };

  const getRoleIcon = (type: ContextType) => {
    switch (type) {
      case ContextType.ADMIN:
        return <AdminPanelSettingsIcon fontSize="small" />;
      case ContextType.MANAGER:
        return <EngineeringIcon fontSize="small" />;
      case ContextType.RESIDENT:
        return <PersonIcon fontSize="small" />;
      default:
        return <PersonIcon fontSize="small" />;
    }
  };

  const getActionLabel = (context: AuthContextData) => (isActiveContext(context) ? 'כניסה' : 'בחר');

  const getMapBackground = (type: ContextType) => {
    switch (type) {
      case ContextType.ADMIN:
        return `
          radial-gradient(circle at 12% 18%, rgba(255,255,255,0.9) 0 2px, transparent 3px),
          linear-gradient(115deg, rgba(120, 197, 221, 0.95) 0%, rgba(151, 215, 229, 0.88) 26%, rgba(220, 231, 227, 0.75) 26%, rgba(220, 231, 227, 0.75) 100%),
          linear-gradient(180deg, transparent 0 100%),
          linear-gradient(90deg, transparent 0 100%)
        `;
      case ContextType.MANAGER:
        return `
          radial-gradient(circle at 78% 26%, rgba(255,255,255,0.85) 0 2px, transparent 3px),
          linear-gradient(110deg, rgba(132, 210, 232, 0.92) 0%, rgba(177, 225, 238, 0.82) 24%, rgba(224, 236, 229, 0.76) 24%, rgba(224, 236, 229, 0.76) 100%),
          linear-gradient(180deg, transparent 0 100%),
          linear-gradient(90deg, transparent 0 100%)
        `;
      case ContextType.RESIDENT:
        return `
          radial-gradient(circle at 24% 24%, rgba(255,255,255,0.9) 0 2px, transparent 3px),
          linear-gradient(108deg, rgba(141, 215, 235, 0.92) 0%, rgba(188, 232, 242, 0.8) 28%, rgba(226, 236, 229, 0.78) 28%, rgba(226, 236, 229, 0.78) 100%),
          linear-gradient(180deg, transparent 0 100%),
          linear-gradient(90deg, transparent 0 100%)
        `;
      default:
        return `
          linear-gradient(108deg, rgba(141, 215, 235, 0.92) 0%, rgba(188, 232, 242, 0.8) 28%, rgba(226, 236, 229, 0.78) 28%, rgba(226, 236, 229, 0.78) 100%)
        `;
    }
  };

  const getMapLabel = (context: AuthContextData) => {
    if (context.buildingName) {
      return context.buildingName;
    }

    switch (context.type) {
      case ContextType.ADMIN:
        return 'מרכז שליטה';
      case ContextType.MANAGER:
        return 'בניין פעיל';
      case ContextType.RESIDENT:
        return 'אזור מגורים';
      default:
        return 'מערכת ניהול';
    }
  };

  return (
    <Column
      sx={{
        minHeight: '100vh',
        width: '100%',
        maxWidth: 430,
        mx: 'auto',
        bgcolor: '#F5F7FB',
        overflowX: 'hidden',
      }}
    >
      <Row
        sx={{
          alignItems: 'center',
          px: 2,
          py: 1.75,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 0 rgba(17, 24, 39, 0.08)',
        }}
      >
        <Box sx={{ width: 40 }} />
        <Typography
          variant="h6"
          sx={{
            flex: 1,
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 24,
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          בחר הקשר
        </Typography>
        <IconButton onClick={() => navigate('/login')} sx={{ color: '#0F172A' }} aria-label="close">
          <CloseIcon />
        </IconButton>
      </Row>

      <Box sx={{ px: 2, pt: 3, pb: 1.5 }}>
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', fontWeight: 500, textAlign: 'right' }}
        >
          הקשרים זמינים עבורך
        </Typography>
      </Box>

      <Column sx={{ gap: 2, px: 1.5, pb: 3 }}>
        {error && (
          <Alert severity="error" variant="outlined" sx={{ mx: 0.5 }}>
            {error}
          </Alert>
        )}

        {contexts.map((context) => (
          <Card
            key={getContextKey(context)}
            variant="outlined"
            sx={{
              overflow: 'hidden',
              borderRadius: 3,
              borderColor: isActiveContext(context) ? 'rgba(37, 99, 235, 0.28)' : 'divider',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: 132,
                backgroundColor: '#DCEEE7',
                backgroundImage: `${getMapBackground(context.type)},
                  linear-gradient(21deg, rgba(255,255,255,0.74) 2%, transparent 2% 10%, rgba(255,255,255,0.7) 10% 12%, transparent 12% 18%, rgba(255,255,255,0.72) 18% 20%, transparent 20%),
                  linear-gradient(108deg, transparent 8%, rgba(153, 173, 142, 0.34) 8% 12%, transparent 12% 22%, rgba(153, 173, 142, 0.24) 22% 25%, transparent 25%),
                  radial-gradient(circle at 70% 54%, rgba(211, 94, 94, 0.92) 0 4px, rgba(211, 94, 94, 0.35) 5px 8px, transparent 9px),
                  radial-gradient(circle at 84% 31%, rgba(211, 94, 94, 0.92) 0 4px, rgba(211, 94, 94, 0.35) 5px 8px, transparent 9px),
                  radial-gradient(circle at 44% 70%, rgba(211, 94, 94, 0.92) 0 4px, rgba(211, 94, 94, 0.35) 5px 8px, transparent 9px)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0) 25%, rgba(15,23,42,0.2) 100%)',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  position: 'absolute',
                  left: 18,
                  top: 44,
                  fontWeight: 500,
                  fontSize: 15,
                  color: '#111827',
                  textShadow: '0 1px 1px rgba(255,255,255,0.35)',
                }}
              >
                {getMapLabel(context)}
              </Typography>
              {isActiveContext(context) && (
                <Chip
                  label="פעיל כעת"
                  size="small"
                  sx={{
                    position: 'absolute',
                    right: 14,
                    bottom: 14,
                    bgcolor: '#0F3D7A',
                    color: '#ffffff',
                    fontWeight: 700,
                    height: 28,
                    borderRadius: 1.75,
                    '& .MuiChip-label': {
                      px: 1.25,
                    },
                  }}
                />
              )}
            </Box>
            <Column sx={{ px: 1.75, pt: 1.5, pb: 1.75, gap: 1.5 }}>
              <Row sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                <Button
                  variant={isActiveContext(context) ? 'contained' : 'outlined'}
                  onClick={() => handleSelectContext(context)}
                  disabled={selectContextMutation.isPending}
                  startIcon={<ArrowBackIcon fontSize="small" />}
                  sx={{
                    minWidth: 82,
                    alignSelf: 'center',
                    bgcolor: isActiveContext(context) ? '#0F3D7A' : '#F1F5F9',
                    color: isActiveContext(context) ? '#ffffff' : '#0F172A',
                    borderColor: 'transparent',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: isActiveContext(context) ? '#0B305F' : '#E2E8F0',
                      borderColor: 'transparent',
                      boxShadow: 'none',
                    },
                    '&.Mui-disabled': {
                      bgcolor: '#CBD5E1',
                      color: '#ffffff',
                    },
                  }}
                >
                  {selectContextMutation.isPending ? '...' : getActionLabel(context)}
                </Button>

                <Column sx={{ gap: 0.65, flex: 1, alignItems: 'flex-end', textAlign: 'right' }}>
                  <Typography
                    variant="h6"
                    sx={{ fontSize: 17, fontWeight: 800, lineHeight: 1.2, color: '#0F172A' }}
                  >
                    {context.buildingName || 'מערכת ניהול'}
                  </Typography>
                  <Row
                    sx={{
                      alignItems: 'center',
                      gap: 0.75,
                      color: 'text.secondary',
                      flexDirection: 'row-reverse',
                    }}
                  >
                    <Center sx={{ color: '#64748B' }}>{getRoleIcon(context.type)}</Center>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getRoleLabel(context.type)}
                    </Typography>
                  </Row>
                </Column>
              </Row>
              <Divider sx={{ borderColor: 'rgba(226, 232, 240, 0.8)' }} />
            </Column>
          </Card>
        ))}

        {contexts.length === 0 && (
          <Typography sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            לא נמצאו הקשרים זמינים עבורך.
          </Typography>
        )}
      </Column>
    </Column>
  );
};
