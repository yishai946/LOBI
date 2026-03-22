import { FormControlLabel, Switch, type SwitchProps } from '@mui/material';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

interface RHFSwitchFieldProps<TFieldValues extends FieldValues> extends Omit<
  SwitchProps,
  'name' | 'checked' | 'onChange'
> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
}

export const RHFSwitchField = <TFieldValues extends FieldValues>({
  name,
  control,
  label,
  ...switchProps
}: RHFSwitchFieldProps<TFieldValues>) => (
  <Controller
    name={name}
    control={control}
    render={({ field }) => (
      <FormControlLabel
        label={label}
        control={
          <Switch
            {...switchProps}
            checked={Boolean(field.value)}
            onChange={(event) => field.onChange(event.target.checked)}
          />
        }
      />
    )}
  />
);
