import { buildingService } from '@api/buildingService';
import Banner from '@components/Banner';
import { Card, Column } from '@components/containers';
import { ContextType } from '@enums/ContextType';
import { Button, Typography } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export const UpgradePage = () => {
  const { currentContext } = useAuth();
  const navigate = useNavigate();
  const buildingId = currentContext?.buildingId;
  const canViewSummary =
    currentContext?.type === ContextType.MANAGER || currentContext?.type === ContextType.ADMIN;

  const { data: upgradeSummary } = useQuery({
    queryKey: ['upgrade-requests', 'summary', buildingId],
    queryFn: () => buildingService.getUpgradeRequestSummary(buildingId!),
    enabled: canViewSummary && Boolean(buildingId),
  });

  const pendingRequests = upgradeSummary?.totalRequests ?? 0;

  return (
    <Column gap={3}>
      <Banner
        title="שדרוג ל-Pro"
        subtitle="גבייה דיגיטלית אוטומטית לדיירים"
        buttonLabel="חזרה לתשלומים"
        onButtonClick={() => navigate('/payments')}
      />

      <Card>
        <Column sx={{ gap: 1.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            תשלום דיגיטלי מהיר
          </Typography>
          <Typography variant="body2" color="text.secondary">
            אפשרו Bit, Apple Pay וכרטיסי אשראי – הגבייה נסגרת בזמן והמעקב אוטומטי.
          </Typography>
          {canViewSummary && pendingRequests > 0 ? (
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              {pendingRequests} דיירים מחכים לחוויית תשלום דיגיטלית חלקה.
            </Typography>
          ) : null}
          <Button variant="contained" sx={{ alignSelf: 'flex-start', fontWeight: 700 }}>
            דברו עם צוות לובי לשדרוג
          </Button>
        </Column>
      </Card>
    </Column>
  );
};
