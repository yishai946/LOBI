import { Box, Button, Typography } from '@mui/material';
import { Row, Column } from '@components/containers';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

interface UpgradeRequestCardProps {
  onRequestUpgrade: () => void;
  hasRequested: boolean;
  isRequesting: boolean;
}

export const UpgradeRequestCard = ({
  onRequestUpgrade,
  hasRequested,
  isRequesting,
}: UpgradeRequestCardProps) => {
  return (
    <Box
      sx={{
        mb: 2,
        p: 2.5,
        borderRadius: 3,
        border: '1px solid rgba(148, 163, 184, 0.3)',
        background:
          'linear-gradient(120deg, rgba(255,255,255,0.65) 0%, rgba(248,250,252,0.85) 100%)',
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Row sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Column sx={{ gap: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            תשלומים אוטומטיים
          </Typography>
        </Column>
        <Row sx={{ gap: 1, alignItems: 'center' }}>
          <PaymentsRoundedIcon sx={{ color: 'text.primary' }} />
          <LockRoundedIcon sx={{ color: 'text.secondary' }} />
        </Row>
      </Row>
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: 'rgba(255,255,255,0.6)',
          border: '1px solid rgba(148, 163, 184, 0.3)',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          כדי להצליח בתשלומים בחינמי בשלב זה, השתמש בהעברה בנקאית או בקבלה.
        </Typography>
        <Button
          variant="contained"
          onClick={onRequestUpgrade}
          disabled={hasRequested || isRequesting}
          sx={{ mt: 1.5, fontWeight: 700 }}
        >
          {hasRequested ? 'בקשה נשלחה' : 'בקש השדרוג'}
        </Button>
      </Box>
    </Box>
  );
};
