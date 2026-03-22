import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirming?: boolean;
  confirmColor?: 'primary' | 'error' | 'warning' | 'success' | 'info';
}

export const ConfirmationDialog = ({
  open,
  title,
  message,
  onCancel,
  onConfirm,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  isConfirming = false,
  confirmColor = 'error',
}: ConfirmationDialogProps) => (
  <Dialog open={open} onClose={isConfirming ? undefined : onCancel} fullWidth maxWidth="xs">
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography variant="body1" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} disabled={isConfirming}>
        {cancelLabel}
      </Button>
      <Button onClick={onConfirm} color={confirmColor} variant="contained" disabled={isConfirming}>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
