import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import {
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';

import { ManagerPayment, PaymentFilterParam, SortParam } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';

import { formatCurrency, formatDate, getPaymentCardTone } from './managerPayments.utils';

const PAYMENT_FILTER_OPTIONS: Array<{ label: string; value: PaymentFilterParam }> = [
  { label: 'הכל', value: 'all' },
  { label: 'ממתינים', value: 'pending' },
  { label: 'שולמו', value: 'paid' },
  { label: 'באיחור', value: 'overdue' },
  { label: 'עתידיים', value: 'upcoming' },
  { label: 'שולמו ב-30 ימים אחרונים', value: 'recentPaid' },
];

const SORT_OPTIONS: Array<{ label: string; value: SortParam }> = [
  { label: 'חדש', value: 'new' },
  { label: 'ישן', value: 'old' },
];

interface ManagerOneTimePaymentsPanelProps {
  activeFilter: PaymentFilterParam;
  activeSort: SortParam;
  activePageSize: number;
  activePage: number;
  allPaymentsLength: number;
  isLoading: boolean;
  pagedPayments: ManagerPayment[];
  onFilterChange: (value: PaymentFilterParam) => void;
  onSortChange: (value: SortParam) => void;
  onPageSizeChange: (value: number) => void;
  onPageChange: (value: number) => void;
  onOpenAssignments: (payment: ManagerPayment) => void;
  onEdit: (payment: ManagerPayment) => void;
  onDelete: (payment: ManagerPayment) => void;
}

const ManagerOneTimePaymentsPanel = ({
  activeFilter,
  activeSort,
  activePageSize,
  activePage,
  allPaymentsLength,
  isLoading,
  pagedPayments,
  onFilterChange,
  onSortChange,
  onPageSizeChange,
  onPageChange,
  onOpenAssignments,
  onEdit,
  onDelete,
}: ManagerOneTimePaymentsPanelProps) => (
  <Column gap={2}>
    <Row sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
      <Row sx={{ gap: 1, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>סינון</InputLabel>
          <Select
            label="סינון"
            value={activeFilter}
            onChange={(event: SelectChangeEvent<PaymentFilterParam>) =>
              onFilterChange(event.target.value as PaymentFilterParam)
            }
          >
            {PAYMENT_FILTER_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>מיון</InputLabel>
          <Select
            label="מיון"
            value={activeSort}
            onChange={(event: SelectChangeEvent<SortParam>) =>
              onSortChange(event.target.value as SortParam)
            }
          >
            {SORT_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Row>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>גודל עמוד</InputLabel>
        <Select
          label="גודל עמוד"
          value={String(activePageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {[3, 5, 10].map((size) => (
            <MenuItem key={size} value={String(size)}>
              {size}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Row>

    {isLoading ? (
      <Row sx={{ justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Row>
    ) : pagedPayments.length === 0 ? (
      <Typography color="text.secondary">לא נמצאו חיובים להצגה.</Typography>
    ) : (
      <Column gap={1.5}>
        {pagedPayments.map((payment) => {
          const tone = getPaymentCardTone(payment);
          const completedCount = payment.assignments.paid;
          const totalCount = payment.assignments.total;
          const canDeletePayment = payment.assignments.paid === 0;
          const progressValue =
            totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

          return (
            <Card
              key={payment.id}
              isError={tone === 'warning'}
              sx={{
                borderColor:
                  tone === 'success'
                    ? 'rgba(46, 160, 67, 0.4)'
                    : tone === 'warning'
                      ? 'rgba(217, 119, 6, 0.45)'
                      : undefined,
              }}
            >
              <Column gap={1.5}>
                <Row sx={{ justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
                  <Column>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                      {payment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      יעד תשלום: {formatDate(payment.dueAt)}
                    </Typography>
                  </Column>

                  <Chip
                    color={
                      tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'default'
                    }
                    label={
                      tone === 'success'
                        ? 'שולם במלואו'
                        : tone === 'warning'
                          ? 'קיימים איחורים'
                          : 'בתהליך גבייה'
                    }
                  />
                </Row>

                {payment.description && (
                  <Typography variant="body2" color="text.secondary">
                    {payment.description}
                  </Typography>
                )}

                <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    סכום ליחידה: {formatCurrency(payment.amount, payment.currency)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    שולם {completedCount}/{totalCount}
                  </Typography>
                </Row>

                <LinearProgress
                  variant="determinate"
                  value={progressValue}
                  sx={{
                    height: 8,
                    borderRadius: 999,
                    bgcolor: 'rgba(15, 23, 42, 0.12)',
                  }}
                />

                <Row sx={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityRoundedIcon />}
                    onClick={() => onOpenAssignments(payment)}
                  >
                    שיוכים
                  </Button>

                  <Row sx={{ gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<EditRoundedIcon />}
                      onClick={() => onEdit(payment)}
                    >
                      עריכה
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutlineRoundedIcon />}
                      disabled={!canDeletePayment}
                      onClick={() => onDelete(payment)}
                    >
                      מחיקה
                    </Button>
                  </Row>
                </Row>

                {!canDeletePayment && (
                  <Typography variant="caption" color="warning.main">
                    לא ניתן למחוק חיוב שכבר שולם לפחות עבור דירה אחת.
                  </Typography>
                )}
              </Column>
            </Card>
          );
        })}

        {Math.ceil(allPaymentsLength / activePageSize) > 1 && (
          <Row sx={{ justifyContent: 'center', pt: 1 }}>
            <Pagination
              color="primary"
              shape="rounded"
              page={activePage}
              count={Math.ceil(allPaymentsLength / activePageSize)}
              onChange={(_event, page) => onPageChange(page)}
            />
          </Row>
        )}
      </Column>
    )}
  </Column>
);

export default ManagerOneTimePaymentsPanel;
