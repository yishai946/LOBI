import { Box, Button, FormControl, FormHelperText, Typography } from '@mui/material';
import { ChangeEvent } from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface RHFFileUploadFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
  buttonLabel?: string;
  emptySelectionText?: string;
  selectedCountText?: (count: number) => string;
  onMaxFilesExceeded?: (maxFiles: number) => void;
  helperText?: string;
}

export const RHFFileUploadField = <TFieldValues extends FieldValues>({
  name,
  control,
  maxFiles = 3,
  accept = 'image/*',
  disabled = false,
  buttonLabel = 'הוסף קבצים',
  emptySelectionText = 'לא נבחרו קבצים',
  selectedCountText = (count) => `${count} קבצים נבחרו`,
  onMaxFilesExceeded,
  helperText,
}: RHFFileUploadFieldProps<TFieldValues>) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState }) => {
      const files = Array.isArray(field.value) ? (field.value as File[]) : [];
      const selectedFilesText =
        files.length === 0 ? emptySelectionText : selectedCountText(files.length);

      const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const allSelected = Array.from(event.target.files || []);

        if (allSelected.length > maxFiles) {
          onMaxFilesExceeded?.(maxFiles);
        }

        const selected = allSelected.slice(0, maxFiles);
        field.onChange(selected);
      };

      return (
        <FormControl>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" component="label" disabled={disabled}>
              {buttonLabel}
              <input type="file" hidden accept={accept} multiple onChange={handleFilesChange} />
            </Button>
            <Typography variant="body2" color="text.secondary">
              {selectedFilesText}
            </Typography>
          </Box>
          {fieldState.error?.message && (
            <FormHelperText error>{fieldState.error.message}</FormHelperText>
          )}
          {!fieldState.error?.message && helperText && (
            <FormHelperText>{helperText}</FormHelperText>
          )}
          {files.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {files.map((file) => file.name).join(', ')}
            </Typography>
          )}
        </FormControl>
      );
    }}
  />
);
