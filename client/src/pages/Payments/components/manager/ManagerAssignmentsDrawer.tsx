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

import { ManagerPayment, ManagerPaymentAssignment } from '@api/paymentService';
import { Card, Column, Row } from '@components/containers';

import { AssignmentFilter } from './managerPayments.types';
import { formatDate } from './managerPayments.utils';

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
}: ManagerAssignmentsDrawerProps) => (
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
            סטטוס דירות
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
          <MenuItem value="pending">ממתין</MenuItem>
          <MenuItem value="paid">שולם</MenuItem>
        </Select>
      </FormControl>

      {isAssignmentsLoading ? (
        <Row sx={{ justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Row>
      ) : filteredAssignments.length === 0 ? (
        <Typography color="text.secondary">לא נמצאו שיוכים בהתאם לסינון.</Typography>
      ) : (
        <Column sx={{ gap: 1.2, overflowY: 'auto', pb: 2 }}>
          {filteredAssignments.map((assignment: ManagerPaymentAssignment) => (
            <Card key={assignment.id}>
              <Row sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Column>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    דירה {assignment.apartment?.name || 'לא ידוע'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {assignment.status === 'PAID'
                      ? `שולם בתאריך ${formatDate(assignment.paidAt)}`
                      : 'ממתין לתשלום'}
                  </Typography>
                </Column>
                <Chip
                  size="small"
                  color={assignment.status === 'PAID' ? 'success' : 'default'}
                  label={assignment.status === 'PAID' ? 'שולם' : 'ממתין'}
                />
              </Row>
            </Card>
          ))}
        </Column>
      )}
    </Column>
  </Drawer>
);

export default ManagerAssignmentsDrawer;
