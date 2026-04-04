import {
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';

import { ManagerPayment, ManagerPaymentAssignment, paymentService } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';

import { AssignmentFilter } from './managerPayments.types';
import { formatDate } from './managerPayments.utils';
import { useAuth } from '@providers/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useGlobalMessage } from '@providers/MessageProvider';

interface ManagerAssignmentsDrawerProps {
  assignmentsTarget: ManagerPayment | null;
  assignmentFilter: AssignmentFilter;
  isAssignmentsLoading: boolean;
  filteredAssignments: ManagerPaymentAssignment[];
  onClose: () => void;
  onFilterChange: (value: AssignmentFilter) => void;
}

const ManagerAssignmentsDrawer = ({
  assignmentsTarget,
  assignmentFilter,
  isAssignmentsLoading,
  filteredAssignments,
  onClose,
  onFilterChange,
}: ManagerAssignmentsDrawerProps) => {
  const { currentContext } = useAuth();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalMessage();
  const isFreeTier = currentContext?.buildingTier === 'FREE';

  const { mutate: approveProof, isPending: isApproving } = useMutation({
    mutationFn: (assignmentId: string) => paymentService.approvePaymentProof(assignmentId),
    onSuccess: () => {
      showSuccess('אישור הצליח');
      queryClient.invalidateQueries({ queryKey: ['payments', 'manager'] });
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || 'לא ניתן לאשר הוכחה');
    },
  });

  return (
    <Drawer
      anchor="right"
      open={Boolean(assignmentsTarget)}
      onClose={onClose}
      ModalProps={{
        slotProps: {
          backdrop: {
            sx: {
              backgroundColor: 'rgba(15, 23, 42, 0.08)',
              backdropFilter: 'none',
              WebkitBackdropFilter: 'none',
            },
          },
        },
      }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 } } }}
    >
      <Column sx={{ p: 2, height: '100%', gap: 2 }}>
        <Row sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Column>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              הקצאות תשלום
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {assignmentsTarget?.title || ''}
            </Typography>
          </Column>
          <Button onClick={onClose}>סגור</Button>
        </Row>

        <FormControl size="small" sx={{ width: 'fit-content' }}>
          <InputLabel>סינון</InputLabel>
          <Select
            label="סינון"
            value={assignmentFilter}
            onChange={(event: SelectChangeEvent<AssignmentFilter>) =>
              onFilterChange(event.target.value as AssignmentFilter)
            }
          >
            <MenuItem value="all">הכל</MenuItem>
            <MenuItem value="pending">בהמתנה</MenuItem>
            <MenuItem value="paid">שולם</MenuItem>
          </Select>
        </FormControl>

        {isAssignmentsLoading ? (
          <Row sx={{ justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Row>
        ) : filteredAssignments.length === 0 ? (
          <Typography color="text.secondary">אין הקצאות בסינון זה.</Typography>
        ) : (
          <Column sx={{ gap: 1.2, overflowY: 'auto', pb: 2 }}>
            {filteredAssignments.map((assignment: ManagerPaymentAssignment) => (
              <Card key={assignment.id}>
                <Column sx={{ gap: 1 }}>
                  <Row sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                    <Column>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        דירה {assignment.apartment?.name || 'לא נקבעה'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {assignment.status === 'PAID'
                          ? `תאריך תשלום: ${formatDate(assignment.paidAt)}`
                          : 'בהמתנה'}
                      </Typography>
                    </Column>
                    <Chip
                      size="small"
                      color={
                        assignment.status === 'PAID'
                          ? 'success'
                          : assignment.proofKey
                            ? 'warning'
                            : 'default'
                      }
                      icon={
                        assignment.status === 'PAID' ? (
                          <CheckCircleRoundedIcon />
                        ) : assignment.proofKey ? (
                          <HourglassTopRoundedIcon />
                        ) : (
                          <PendingActionsRoundedIcon />
                        )
                      }
                      label={
                        assignment.status === 'PAID'
                          ? assignment.proofApprovedAt
                            ? 'הוכחה אושרה'
                            : 'שולם'
                          : assignment.proofKey
                            ? 'ממתין לאישור הוכחה'
                            : 'ממתין לתשלום'
                      }
                    />
                  </Row>

                  {assignment.proofUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        window.open(assignment.proofUrl!, '_blank', 'noopener,noreferrer')
                      }
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      צפה בהוכחה
                    </Button>
                  )}

                  {isFreeTier && assignment.proofKey && assignment.status !== 'PAID' && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => approveProof(assignment.id)}
                      disabled={isApproving}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      אשר הוכחה
                    </Button>
                  )}
                </Column>
              </Card>
            ))}
          </Column>
        )}
      </Column>
    </Drawer>
  );
};

export default ManagerAssignmentsDrawer;
