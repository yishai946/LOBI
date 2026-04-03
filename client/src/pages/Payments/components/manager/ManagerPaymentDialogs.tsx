import { ConfirmationDialog, CreateDialog, EditDialog } from '@components/dialogs';
import { Column } from '@components/containers';
import { Chip } from '@mui/material';
import { RHFTextField } from '@components/forms';
import { ManagerPayment } from '@api/paymentService';
import { UseFormReturn } from 'react-hook-form';

import { PaymentFormValues } from './managerPayments.types';

interface ManagerPaymentDialogsProps {
  createOpen: boolean;
  editTarget: ManagerPayment | null;
  deleteTarget: ManagerPayment | null;
  createForm: UseFormReturn<PaymentFormValues>;
  editForm: UseFormReturn<PaymentFormValues>;
  isLimitedEditPayment: boolean;
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

const ManagerPaymentDialogs = ({
  createOpen,
  editTarget,
  deleteTarget,
  createForm,
  editForm,
  isLimitedEditPayment,
  isCreateSubmitting,
  isEditSubmitting,
  isDeleteSubmitting,
  onCloseCreate,
  onSubmitCreate,
  onCloseEdit,
  onSubmitEdit,
  onCancelDelete,
  onConfirmDelete,
}: ManagerPaymentDialogsProps) => (
  <>
    <CreateDialog
      open={createOpen}
      onClose={onCloseCreate}
      onSubmit={onSubmitCreate}
      isSubmitting={isCreateSubmitting}
      title="יצירת חיוב חדש"
      submitLabel={isCreateSubmitting ? 'יוצר...' : 'צור חיוב'}
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
          label="סכום"
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
          name="dueAt"
          label="תאריך יעד"
          required
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          rules={{ required: 'יש לבחור תאריך יעד' }}
        />
      </Column>
    </CreateDialog>

    <EditDialog
      open={Boolean(editTarget)}
      onClose={onCloseEdit}
      onSubmit={onSubmitEdit}
      isSubmitting={isEditSubmitting}
      title="עריכת חיוב"
      submitLabel={isEditSubmitting ? 'שומר...' : 'שמירה'}
    >
      <Column sx={{ mt: 1, gap: 2 }}>
        {isLimitedEditPayment && (
          <Chip
            color="warning"
            variant="outlined"
            label="לחיוב זה כבר יש תשלומים ששולמו, לכן ניתן לערוך רק כותרת, תיאור ותאריך יעד"
            sx={{ alignSelf: 'flex-start' }}
          />
        )}

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
          label="סכום"
          required
          type="number"
          fullWidth
          disabled={isLimitedEditPayment}
          rules={{
            required: 'יש להזין סכום',
            min: { value: 0.01, message: 'הסכום חייב להיות גדול מ-0' },
          }}
        />
        <RHFTextField
          control={editForm.control}
          name="dueAt"
          label="תאריך יעד"
          required
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          rules={{ required: 'יש לבחור תאריך יעד' }}
        />
      </Column>
    </EditDialog>

    <ConfirmationDialog
      open={Boolean(deleteTarget)}
      title="מחיקת חיוב"
      message={`האם למחוק את החיוב "${deleteTarget?.title || ''}"? הפעולה תמחק גם את כל השיוכים.`}
      onCancel={onCancelDelete}
      onConfirm={onConfirmDelete}
      isConfirming={isDeleteSubmitting}
      confirmLabel={isDeleteSubmitting ? 'מוחק...' : 'מחק'}
    />
  </>
);

export default ManagerPaymentDialogs;
