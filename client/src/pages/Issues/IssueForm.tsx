import { RHFFileUploadField, RHFSwitchField, RHFTextField } from '@components/forms';
import { Box } from '@mui/material';
import type { Control } from 'react-hook-form';

export interface IssueFormValues {
  title: string;
  description: string;
  isUrgent: boolean;
  files: File[];
}

interface IssueFormProps {
  control: Control<IssueFormValues>;
  isSubmitting?: boolean;
  showImageUpload?: boolean;
  maxFiles?: number;
  onMaxFilesExceeded?: (maxFiles: number) => void;
}

export const IssueForm = ({
  control,
  isSubmitting = false,
  showImageUpload = true,
  maxFiles = 3,
  onMaxFilesExceeded,
}: IssueFormProps) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
    <RHFTextField
      control={control}
      name="title"
      label="כותרת"
      required
      fullWidth
      rules={{
        required: 'יש להזין כותרת לתקלה',
        validate: (value) =>
          (typeof value === 'string' && value.trim().length > 0) || 'יש להזין כותרת לתקלה',
      }}
    />

    <RHFTextField
      control={control}
      name="description"
      label="תיאור"
      multiline
      minRows={3}
      fullWidth
    />

    <RHFSwitchField control={control} name="isUrgent" label="תקלה דחופה" color="error" />

    {showImageUpload && (
      <RHFFileUploadField
        control={control}
        name="files"
        disabled={isSubmitting}
        buttonLabel="הוסף תמונות"
        emptySelectionText="לא נבחרו תמונות"
        selectedCountText={(count) => `${count} קבצים נבחרו`}
        maxFiles={maxFiles}
        onMaxFilesExceeded={onMaxFilesExceeded}
      />
    )}
  </Box>
);
