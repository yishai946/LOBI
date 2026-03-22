import { TextField, type TextFieldProps } from '@mui/material';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';

interface RHFTextFieldProps<TFieldValues extends FieldValues> extends Omit<
  TextFieldProps,
  'name' | 'defaultValue'
> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
}

export const RHFTextField = <TFieldValues extends FieldValues>({
  name,
  control,
  rules,
  helperText,
  ...textFieldProps
}: RHFTextFieldProps<TFieldValues>) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field, fieldState }) => (
      <TextField
        {...textFieldProps}
        {...field}
        value={field.value ?? ''}
        error={Boolean(fieldState.error)}
        helperText={fieldState.error?.message || helperText}
      />
    )}
  />
);
