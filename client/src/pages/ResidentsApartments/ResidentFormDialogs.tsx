import { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { CreateDialog, EditDialog, ConfirmationDialog } from '@components/dialogs';
import { Apartment } from '@entities/Apartment';
import { Resident } from '@entities/Resident';
import { Row, Column } from '@components/containers';

interface ApartmentFormValues {
  floorNumber: string;
  apartmentNumber: string;
}

interface CreateResidentFormValues {
  phone: string;
  apartmentId: string;
}

interface MoveResidentFormValues {
  apartmentId: string;
}

interface ResidentFormDialogsProps {
  apartments: Apartment[];
  isCreateApartmentOpen: boolean;
  apartmentEditTarget: Apartment | null;
  apartmentDeleteTarget: Apartment | null;
  isCreateResidentOpen: boolean;
  residentMoveTarget: Resident | null;
  residentDeleteTarget: Resident | null;
  isApartmentCreating: boolean;
  isApartmentUpdating: boolean;
  isApartmentDeleting: boolean;
  isResidentCreating: boolean;
  isResidentMoving: boolean;
  isResidentDeleting: boolean;
  onCloseCreateApartment: () => void;
  onCloseEditApartment: () => void;
  onCloseDeleteApartment: () => void;
  onCloseCreateResident: () => void;
  onCloseMoveResident: () => void;
  onCloseDeleteResident: () => void;
  onSubmitCreateApartment: (values: ApartmentFormValues) => void;
  onSubmitEditApartment: (values: ApartmentFormValues) => void;
  onConfirmDeleteApartment: () => void;
  onSubmitCreateResident: (values: CreateResidentFormValues) => void;
  onSubmitMoveResident: (values: MoveResidentFormValues) => void;
  onConfirmDeleteResident: () => void;
}

export const ResidentFormDialogs = ({
  apartments,
  isCreateApartmentOpen,
  apartmentEditTarget,
  apartmentDeleteTarget,
  isCreateResidentOpen,
  residentMoveTarget,
  residentDeleteTarget,
  isApartmentCreating,
  isApartmentUpdating,
  isApartmentDeleting,
  isResidentCreating,
  isResidentMoving,
  isResidentDeleting,
  onCloseCreateApartment,
  onCloseEditApartment,
  onCloseDeleteApartment,
  onCloseCreateResident,
  onCloseMoveResident,
  onCloseDeleteResident,
  onSubmitCreateApartment,
  onSubmitEditApartment,
  onConfirmDeleteApartment,
  onSubmitCreateResident,
  onSubmitMoveResident,
  onConfirmDeleteResident,
}: ResidentFormDialogsProps) => {
  const apartmentCreateForm = useForm<ApartmentFormValues>({
    defaultValues: { floorNumber: '', apartmentNumber: '' },
  });
  const apartmentEditForm = useForm<ApartmentFormValues>({
    defaultValues: { floorNumber: '', apartmentNumber: '' },
  });
  const residentCreateForm = useForm<CreateResidentFormValues>({
    defaultValues: { phone: '', apartmentId: '' },
  });
  const residentMoveForm = useForm<MoveResidentFormValues>({
    defaultValues: { apartmentId: '' },
  });

  // Update edit form when target changes
  useMemo(() => {
    if (apartmentEditTarget) {
      apartmentEditForm.reset({
        floorNumber: String(apartmentEditTarget.floorNumber ?? ''),
        apartmentNumber: apartmentEditTarget.apartmentNumber ?? '',
      });
    }
  }, [apartmentEditTarget]);

  // Update move form when target changes
  useMemo(() => {
    if (residentMoveTarget) {
      residentMoveForm.reset({ apartmentId: residentMoveTarget.apartmentId });
    }
  }, [residentMoveTarget]);

  const formatApartmentLabel = (apartment: Apartment) => {
    const floor = apartment.floorNumber ?? '-';
    const number = apartment.apartmentNumber ?? '-';
    return `קומה ${floor} · דירה ${number}`;
  };

  return (
    <>
      {/* Create Apartment Dialog */}
      <CreateDialog
        open={isCreateApartmentOpen}
        onClose={onCloseCreateApartment}
        onSubmit={apartmentCreateForm.handleSubmit((values) => {
          onSubmitCreateApartment(values);
          apartmentCreateForm.reset();
        })}
        isSubmitting={isApartmentCreating}
        title="הוסף דירה"
        submitLabel={isApartmentCreating ? 'טוען...' : 'צור דירה'}
      >
        <Column gap={2} sx={{ mt: 1 }}>
          <Controller
            name="floorNumber"
            control={apartmentCreateForm.control}
            rules={{
              required: 'קומה נדרשת',
              validate: (value) =>
                Number.isInteger(Number(value)) && Number(value) >= 0 ? true : 'מספר לא תקין',
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="קומה"
                type="number"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="apartmentNumber"
            control={apartmentCreateForm.control}
            rules={{ required: 'מספר דירה נדרש' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="מספר דירה"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        </Column>
      </CreateDialog>

      {/* Edit Apartment Dialog */}
      <EditDialog
        open={Boolean(apartmentEditTarget)}
        onClose={onCloseEditApartment}
        onSubmit={apartmentEditForm.handleSubmit((values) => {
          onSubmitEditApartment(values);
        })}
        isSubmitting={isApartmentUpdating}
        title="ערוך דירה"
        submitLabel={isApartmentUpdating ? 'טוען...' : 'שמור'}
      >
        <Column gap={2} sx={{ mt: 1 }}>
          <Controller
            name="floorNumber"
            control={apartmentEditForm.control}
            rules={{
              required: 'קומה נדרשת',
              validate: (value) =>
                Number.isInteger(Number(value)) && Number(value) >= 0 ? true : 'מספר לא תקין',
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="קומה"
                type="number"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="apartmentNumber"
            control={apartmentEditForm.control}
            rules={{ required: 'מספר דירה נדרש' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="מספר דירה"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        </Column>
      </EditDialog>

      {/* Delete Apartment Confirmation */}
      <ConfirmationDialog
        open={Boolean(apartmentDeleteTarget)}
        title="מחיקת דירה"
        message="האם למחוק את הדירה? אם קיימים דיירים המחיקה תכשל."
        onCancel={onCloseDeleteApartment}
        onConfirm={onConfirmDeleteApartment}
        isConfirming={isApartmentDeleting}
        confirmLabel="מחק"
      />

      {/* Create Resident Dialog */}
      <CreateDialog
        open={isCreateResidentOpen}
        onClose={onCloseCreateResident}
        onSubmit={residentCreateForm.handleSubmit((values) => {
          onSubmitCreateResident(values);
          residentCreateForm.reset();
        })}
        isSubmitting={isResidentCreating}
        title="הוסף דייר"
        submitLabel={isResidentCreating ? 'טוען...' : 'צור דייר'}
      >
        <Column gap={2} sx={{ mt: 1 }}>
          <Controller
            name="phone"
            control={residentCreateForm.control}
            rules={{
              required: 'טלפון נדרש',
              pattern: {
                value: /^05\d{8}$/,
                message: 'טלפון חייב להתחיל ב-05 ולהכיל 10 ספרות',
              },
            }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="טלפון"
                placeholder="05XXXXXXXX"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
          <Controller
            name="apartmentId"
            control={residentCreateForm.control}
            rules={{ required: 'דירה נדרשת' }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)}>
                <InputLabel>דירה</InputLabel>
                <Select {...field} label="דירה">
                  {apartments.map((apartment) => (
                    <MenuItem key={apartment.id} value={apartment.id}>
                      {formatApartmentLabel(apartment)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Column>
      </CreateDialog>

      {/* Move Resident Dialog */}
      <EditDialog
        open={Boolean(residentMoveTarget)}
        onClose={onCloseMoveResident}
        onSubmit={residentMoveForm.handleSubmit((values) => {
          onSubmitMoveResident(values);
        })}
        isSubmitting={isResidentMoving}
        title="העבר דייר"
        submitLabel={isResidentMoving ? 'טוען...' : 'העבר'}
      >
        <Column gap={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {residentMoveTarget?.user.name || residentMoveTarget?.user.phone}
          </Typography>
          <Controller
            name="apartmentId"
            control={residentMoveForm.control}
            rules={{ required: 'דירה נדרשת' }}
            render={({ field, fieldState }) => (
              <FormControl fullWidth error={Boolean(fieldState.error)}>
                <InputLabel>דירה חדשה</InputLabel>
                <Select {...field} label="דירה חדשה">
                  {apartments.map((apartment) => (
                    <MenuItem key={apartment.id} value={apartment.id}>
                      {formatApartmentLabel(apartment)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Column>
      </EditDialog>

      {/* Delete Resident Confirmation */}
      <ConfirmationDialog
        open={Boolean(residentDeleteTarget)}
        title="מחיקת דייר"
        message="האם למחוק את הדייר מהמערכת?"
        onCancel={onCloseDeleteResident}
        onConfirm={onConfirmDeleteResident}
        isConfirming={isResidentDeleting}
        confirmLabel="מחק"
      />
    </>
  );
};
