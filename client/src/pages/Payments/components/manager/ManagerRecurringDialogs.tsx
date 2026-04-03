import { MenuItem } from '@mui/material';
import { UseFormReturn } from 'react-hook-form';

import { ManagerRecurringSeries, RecurringSeriesStatus } from '@api/paymentService';
import { Column } from '@components/containers';
import { ConfirmationDialog, CreateDialog, EditDialog } from '@components/dialogs';
import { RHFSwitchField, RHFTextField } from '@components/forms';

import { RecurringSeriesFormValues } from './managerPayments.types';

const RECURRING_STATUS_OPTIONS: Array<{ label: string; value: RecurringSeriesStatus }> = [
  { label: 'פעיל', value: 'ACTIVE' },
  { label: 'מושהה', value: 'PAUSED' },
  { label: 'הסתיים', value: 'ENDED' },
];

interface ManagerRecurringDialogsProps {
  createOpen: boolean;
  editTarget: ManagerRecurringSeries | null;
  deleteTarget: ManagerRecurringSeries | null;
  createForm: UseFormReturn<RecurringSeriesFormValues>;
  editForm: UseFormReturn<RecurringSeriesFormValues>;
  isCreateSubmitting: boolean;
  isEditSubmitting: boolean;
  isDeleteSubmitting: boolean;
  onCloseCreate: () => void;
  onSubmitCreate: () => void;
  onCloseEdit: () => void;
  onSubmitEdit: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

const ManagerRecurringDialogs = ({
  createOpen,
  editTarget,
  deleteTarget,
  createForm,
  editForm,
  isCreateSubmitting,
  isEditSubmitting,
  isDeleteSubmitting,
  onCloseCreate,
  onSubmitCreate,
  onCloseEdit,
  onSubmitEdit,
  onCancelDelete,
  onConfirmDelete,
}: ManagerRecurringDialogsProps) => (
  <>
    <CreateDialog
      open={createOpen}
      onClose={onCloseCreate}
      onSubmit={onSubmitCreate}
      isSubmitting={isCreateSubmitting}
      title="יצירת סדרת חיובים"
      submitLabel={isCreateSubmitting ? 'יוצר...' : 'צור סדרה'}
    >
      <Column sx={{ mt: 1, gap: 2 }}>
        <RHFTextField
          control={createForm.control}
          name="title"
          label="כותרת"
          required
          fullWidth
          rules={{ required: 'יש להזין כותרת' }}
        />
        <RHFTextField
          control={createForm.control}
          name="description"
          label="תיאור"
          fullWidth
          multiline
          minRows={2}
        />
        <RHFTextField
          control={createForm.control}
          name="amount"
          label="סכום חודשי"
          required
          type="number"
          fullWidth
          rules={{
            required: 'יש להזין סכום',
            min: { value: 0.01, message: 'הסכום חייב להיות גדול מ-0' },
          }}
        />
        <RHFTextField
          control={createForm.control}
          name="anchorDay"
          label="יום חיוב קבוע (1-28)"
          required
          type="number"
          fullWidth
          rules={{
            required: 'יש להזין יום חיוב',
            min: { value: 1, message: 'מינימום 1' },
            max: { value: 28, message: 'מקסימום 28' },
          }}
        />
        <RHFTextField
          control={createForm.control}
          name="startsAt"
          label="תאריך התחלה"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <RHFTextField
          control={createForm.control}
          name="endsAt"
          label="תאריך סיום"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <RHFSwitchField
          control={createForm.control}
          name="createInitialPayment"
          label="ליצור חיוב ראשוני מיידי"
        />
      </Column>
    </CreateDialog>

    <EditDialog
      open={Boolean(editTarget)}
      onClose={onCloseEdit}
      onSubmit={onSubmitEdit}
      isSubmitting={isEditSubmitting}
      title="עריכת סדרה"
      submitLabel={isEditSubmitting ? 'שומר...' : 'שמירה'}
    >
      <Column sx={{ mt: 1, gap: 2 }}>
        <RHFTextField
          control={editForm.control}
          name="title"
          label="כותרת"
          required
          fullWidth
          rules={{ required: 'יש להזין כותרת' }}
        />
        <RHFTextField
          control={editForm.control}
          name="description"
          label="תיאור"
          fullWidth
          multiline
          minRows={2}
        />
        <RHFTextField
          control={editForm.control}
          name="amount"
          label="סכום חודשי"
          required
          type="number"
          fullWidth
          rules={{
            required: 'יש להזין סכום',
            min: { value: 0.01, message: 'הסכום חייב להיות גדול מ-0' },
          }}
        />

        <RHFTextField control={editForm.control} name="status" label="סטטוס" select fullWidth>
          {RECURRING_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </RHFTextField>

        <RHFTextField
          control={editForm.control}
          name="endsAt"
          label="תאריך סיום"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </Column>
    </EditDialog>

    <ConfirmationDialog
      open={Boolean(deleteTarget)}
      title="מחיקת סדרת חיובים"
      message={`האם למחוק את סדרת החיובים "${deleteTarget?.title || ''}"? חיובים שלא שולמו יימחקו.`}
      onCancel={onCancelDelete}
      onConfirm={onConfirmDelete}
      isConfirming={isDeleteSubmitting}
      confirmLabel={isDeleteSubmitting ? 'מוחק...' : 'מחק'}
    />
  </>
);

export default ManagerRecurringDialogs;
