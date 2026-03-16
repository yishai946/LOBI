import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContextData } from '../../../entities/AuthContextData';
import { ContextType } from '../../../enums/ContextType';
import { authService } from '../../../api/authService';
import { useAuth } from '../../../providers/AuthContext';
import { useGlobalMessage } from '../../../providers/MessageProvider';

interface SelectContextMutationInput {
  context: AuthContextData;
}

export const usePostAuthRouting = () => {
  const navigate = useNavigate();
  const { setContext } = useAuth();
  const { showSuccess, showError } = useGlobalMessage();

  const getErrorMessage = (error: unknown, fallback: string) =>
    axios.isAxiosError(error)
      ? ((error.response?.data as { message?: string } | undefined)?.message ?? fallback)
      : fallback;

  const selectContextMutation = useMutation({
    mutationFn: ({ context }: SelectContextMutationInput) =>
      authService.selectContext({
        type: context.type,
        buildingId: context.buildingId,
        apartmentId: context.apartmentId,
      }),
    onSuccess: (response, variables) => {
      setContext(variables.context, response.token);
      showSuccess('ההקשר נבחר בהצלחה');
      navigate('/home', { replace: true });
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בבחירת הקשר'));
    },
  });

  const continueAfterAuthentication = async (contexts: AuthContextData[]) => {
    if (contexts.length === 1 && contexts[0].type === ContextType.ADMIN) {
      await selectContextMutation.mutateAsync({ context: contexts[0] });
      return;
    }

    if (contexts.length > 1) {
      navigate('/select-context', { replace: true });
      return;
    }

    if (contexts.length === 1) {
      await selectContextMutation.mutateAsync({ context: contexts[0] });
      return;
    }

    navigate('/home', { replace: true });
  };

  return {
    continueAfterAuthentication,
    isPending: selectContextMutation.isPending,
    error: selectContextMutation.error,
  };
};
