import { RecurringSeries } from '@api/paymentService';
import { Box, Button, Chip, Typography } from '@mui/material';
import { Column } from '@components/containers';

interface RecurringSeriesEnrollmentPanelProps {
  recurringSeries: RecurringSeries[];
  isLoading: boolean;
  isUpdating: boolean;
  isFreeTier: boolean;
  onEnrollmentChange: (seriesId: string, enabled: boolean) => void;
  onUpgradeClick: () => void;
}

const getEnrollment = (series: RecurringSeries) => series.enrollments?.[0] || null;

export const RecurringSeriesEnrollmentPanel = ({
  recurringSeries,
  isLoading,
  isUpdating,
  isFreeTier,
  onEnrollmentChange,
  onUpgradeClick,
}: RecurringSeriesEnrollmentPanelProps) => {
  return (
    <Column
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        gap: 1.5,
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 800 }}>
        תשלומים חוזרים
      </Typography>
      <Typography variant="body2" color="text.secondary">
        כאן תוכל לנהל את תשלומיך החוזרים, להצטרף כמנוי או לבטל בכל עת.
      </Typography>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">
          טוען תשלומים...
        </Typography>
      ) : recurringSeries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          אין לך עדיין שום תשלום חוזר פעיל.
        </Typography>
      ) : (
        <Column sx={{ gap: 1 }}>
          {recurringSeries.map((series) => {
            const enrollment = getEnrollment(series);
            const isActive = enrollment?.status === 'ACTIVE';
            const nextBillingText = enrollment?.nextBillingAt
              ? new Date(enrollment.nextBillingAt).toLocaleDateString('he-IL')
              : null;
            const lastChargedText = enrollment?.lastChargedAt
              ? new Date(enrollment.lastChargedAt).toLocaleDateString('he-IL')
              : null;

            return (
              <Box
                key={series.id}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                }}
              >
                <Column sx={{ gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {series.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={isActive ? 'מנוי פעיל כעת' : 'מנוי לא פעיל כעת'}
                      color={isActive ? 'success' : 'default'}
                    />
                  </Box>

                  {series.description && (
                    <Typography variant="body2" color="text.secondary">
                      {series.description}
                    </Typography>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    תאריך תשלום: יום {series.anchorDay}
                  </Typography>

                  {nextBillingText && (
                    <Typography variant="body2" color="text.secondary">
                      התשלום הבא: {nextBillingText}
                    </Typography>
                  )}

                  {lastChargedText && (
                    <Typography variant="body2" color="text.secondary">
                      התשלום האחרון: {lastChargedText}
                    </Typography>
                  )}

                  <Button
                    variant={isActive ? 'outlined' : 'contained'}
                    onClick={() =>
                      isFreeTier ? onUpgradeClick() : onEnrollmentChange(series.id, !isActive)
                    }
                    disabled={isUpdating || series.status === 'ENDED' || isFreeTier}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    {isFreeTier ? 'בקש ל-Pro כעת' : isActive ? 'בטל כמנוי' : 'צרף כמנוי'}
                  </Button>
                </Column>
              </Box>
            );
          })}
        </Column>
      )}
    </Column>
  );
};
