import { useCallback } from 'react';
import { apartmentService } from '@api/apartmentService';
import { residentService } from '@api/residentService';
import { userService } from '@api/userService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@utils/errorHandling';

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

interface UseApartmentResidentMutationsOptions {
  onSuccessCreateApartment?: () => void;
  onSuccessUpdateApartment?: () => void;
  onSuccessDeleteApartment?: () => void;
  onSuccessCreateResident?: () => void;
  onSuccessMoveResident?: () => void;
  onSuccessDeleteResident?: () => void;
  onError?: (error: unknown, message: string) => void;
  onSuccess?: (message: string) => void;
}

/**
 * Hook for managing apartment and resident CRUD mutations
 * Handles all apartment and resident API calls with consistent error/success handling
 */
export const useApartmentResidentMutations = (
  buildingId: string | undefined,
  callbacks?: UseApartmentResidentMutationsOptions
) => {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['apartments'] });
    queryClient.invalidateQueries({ queryKey: ['residents'] });
  }, [queryClient]);

  const createApartmentMutation = useMutation({
    mutationFn: (values: ApartmentFormValues) => {
      if (!buildingId) throw new Error('אין בניין נבחר');
      return apartmentService.createApartment({
        buildingId,
        floorNumber: Number(values.floorNumber),
        apartmentNumber: values.apartmentNumber.trim(),
      });
    },
    onSuccess: () => {
      callbacks?.onSuccess?.('הדירה נוצרה');
      invalidateQueries();
      callbacks?.onSuccessCreateApartment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה ביצירת דירה');
      callbacks?.onError?.(error, message);
    },
  });

  const updateApartmentMutation = useMutation({
    mutationFn: (variables: { apartmentId: string; values: ApartmentFormValues }) =>
      apartmentService.updateApartment(variables.apartmentId, {
        floorNumber: Number(variables.values.floorNumber),
        apartmentNumber: variables.values.apartmentNumber.trim(),
      }),
    onSuccess: () => {
      callbacks?.onSuccess?.('הדירה עודכנה');
      invalidateQueries();
      callbacks?.onSuccessUpdateApartment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה בעדכון דירה');
      callbacks?.onError?.(error, message);
    },
  });

  const deleteApartmentMutation = useMutation({
    mutationFn: (apartmentId: string) => apartmentService.deleteApartment(apartmentId),
    onSuccess: () => {
      callbacks?.onSuccess?.('הדירה נמחקה');
      invalidateQueries();
      callbacks?.onSuccessDeleteApartment?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה במחיקת דירה');
      callbacks?.onError?.(error, message);
    },
  });

  const createResidentMutation = useMutation({
    mutationFn: (values: CreateResidentFormValues) =>
      userService.createResidentByPhone({
        phone: values.phone.trim(),
        apartmentId: values.apartmentId,
      }),
    onSuccess: () => {
      callbacks?.onSuccess?.('הדייר נוסף');
      invalidateQueries();
      callbacks?.onSuccessCreateResident?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה ביצירת דייר');
      callbacks?.onError?.(error, message);
    },
  });

  const moveResidentMutation = useMutation({
    mutationFn: (variables: { residentId: string; values: MoveResidentFormValues }) =>
      residentService.updateResident(variables.residentId, {
        apartmentId: variables.values.apartmentId,
      }),
    onSuccess: () => {
      callbacks?.onSuccess?.('הדייר הועבר');
      invalidateQueries();
      callbacks?.onSuccessMoveResident?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה בהעברת דייר');
      callbacks?.onError?.(error, message);
    },
  });

  const deleteResidentMutation = useMutation({
    mutationFn: (residentId: string) => residentService.deleteResident(residentId),
    onSuccess: () => {
      callbacks?.onSuccess?.('הדייר נמחק');
      invalidateQueries();
      callbacks?.onSuccessDeleteResident?.();
    },
    onError: (error) => {
      const message = getErrorMessage(error, 'שגיאה במחיקת דייר');
      callbacks?.onError?.(error, message);
    },
  });

  return {
    createApartmentMutation,
    updateApartmentMutation,
    deleteApartmentMutation,
    createResidentMutation,
    moveResidentMutation,
    deleteResidentMutation,
  };
};
