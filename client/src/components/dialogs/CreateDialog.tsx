import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { FormEventHandler, ReactNode } from 'react';

interface CreateDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}

export const CreateDialog = ({
  open,
  title,
  children,
  onClose,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'צור',
  cancelLabel = 'ביטול',
  maxWidth = 'sm',
}: CreateDialogProps) => (
  <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth={maxWidth}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <form id="create-dialog-form" onSubmit={onSubmit}>
        {children}
      </form>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={isSubmitting}>
        {cancelLabel}
      </Button>
      <Button type="submit" form="create-dialog-form" variant="contained" disabled={isSubmitting}>
        {submitLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
