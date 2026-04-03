import { RHFSwitchField, RHFTextField } from '@components/forms';
import { Box, type SxProps, type Theme } from '@mui/material';
import type { Control } from 'react-hook-form';

export interface MessageFormValues {
  title: string;
  content: string;
  isUrgent: boolean;
  isPinned: boolean;
}

interface MessageFormProps {
  control: Control<MessageFormValues>;
  sx?: SxProps<Theme>;
  canPin?: boolean;
}

export const MessageForm = ({ control, sx, canPin = false }: MessageFormProps) => (
  <Box
    sx={[
      { display: 'flex', flexDirection: 'column', gap: 2, mt: 1 },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    <RHFTextField
      control={control}
      name="title"
      label="כותרת"
      required
      fullWidth
      rules={{
        required: 'יש להזין כותרת להודעה',
        validate: (value) =>
          (typeof value === 'string' && value.trim().length > 0) || 'יש להזין כותרת להודעה',
      }}
    />

    <RHFTextField
      control={control}
      name="content"
      label="תוכן"
      required
      multiline
      minRows={4}
      fullWidth
      rules={{
        required: 'יש להזין תוכן להודעה',
        validate: (value) =>
          (typeof value === 'string' && value.trim().length > 0) || 'יש להזין תוכן להודעה',
      }}
    />

    {canPin && (
      <>
        <RHFSwitchField control={control} name="isUrgent" label="הודעה דחופה" color="error" />
        <RHFSwitchField control={control} name="isPinned" label="נעוץ" color="primary" />
      </>
    )}
  </Box>
);
