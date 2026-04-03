import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { Button, Chip, CircularProgress, Typography } from '@mui/material';

import { ManagerRecurringSeries } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';

import { formatCurrency, formatDate } from './managerPayments.utils';

interface ManagerRecurringSeriesPanelProps {
  recurringSeries: ManagerRecurringSeries[];
  activeRecurringCount: number;
  isLoading: boolean;
  onEdit: (series: ManagerRecurringSeries) => void;
  onDelete: (series: ManagerRecurringSeries) => void;
}

const ManagerRecurringSeriesPanel = ({
  recurringSeries,
  activeRecurringCount,
  isLoading,
  onEdit,
  onDelete,
}: ManagerRecurringSeriesPanelProps) => (
  <Column gap={1.5}>
    <Row
      sx={{
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {activeRecurringCount} סדרות פעילות מתוך {recurringSeries.length}
      </Typography>
    </Row>

    {isLoading ? (
      <Row sx={{ justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Row>
    ) : recurringSeries.length === 0 ? (
      <Typography color="text.secondary">לא קיימות סדרות חיוב להצגה.</Typography>
    ) : (
      <Column gap={1.5}>
        {recurringSeries.map((series) => (
          <Card key={series.id}>
            <Column gap={1.25}>
              <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {series.title}
                </Typography>
                <Chip
                  color={
                    series.status === 'ACTIVE'
                      ? 'success'
                      : series.status === 'PAUSED'
                        ? 'warning'
                        : 'default'
                  }
                  label={
                    series.status === 'ACTIVE'
                      ? 'פעיל'
                      : series.status === 'PAUSED'
                        ? 'מושהה'
                        : 'הסתיים'
                  }
                />
              </Row>

              {series.description && (
                <Typography variant="body2" color="text.secondary">
                  {series.description}
                </Typography>
              )}

              <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2">
                  סכום חודשי: {formatCurrency(series.amount, series.currency)}
                </Typography>
                <Typography variant="body2">יום עיגון: {series.anchorDay}</Typography>
                <Typography variant="body2">נרשמו: {series._count.enrollments}</Typography>
              </Row>

              <Typography variant="caption" color="text.secondary">
                טווח: {formatDate(series.startsAt)} -{' '}
                {series.endsAt ? formatDate(series.endsAt) : 'ללא סיום'}
              </Typography>

              <Row sx={{ justifyContent: 'flex-end' }}>
                <Row sx={{ gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => onEdit(series)}
                  >
                    עריכת סדרה
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteOutlineRoundedIcon />}
                    onClick={() => onDelete(series)}
                  >
                    מחיקת סדרה
                  </Button>
                </Row>
              </Row>
            </Column>
          </Card>
        ))}
      </Column>
    )}
  </Column>
);

export default ManagerRecurringSeriesPanel;
