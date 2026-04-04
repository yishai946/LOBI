import { messageService } from '@api/messageService';
import { CreateDialog } from '@components/dialogs';
import { ContextType } from '@enums/ContextType';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { getErrorMessage } from '@utils/errorHandling';
import { MessageForm, type MessageFormValues } from './MessageForm';

interface CreateMessageDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateMessageDialog = ({ open, onClose }: CreateMessageDialogProps) => {
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();
  const canPin = currentContext?.type === ContextType.MANAGER;
  const { control, handleSubmit, reset } = useForm<MessageFormValues>({
    defaultValues: {
      title: '',
      content: '',
      isUrgent: false,
      isPinned: false,
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: (values: MessageFormValues) =>
      messageService.createMessage({
        title: values.title.trim(),
        content: values.content.trim(),
        isUrgent: values.isUrgent,
        isPinned: canPin ? values.isPinned : undefined,
      }),
    onSuccess: () => {
      showSuccess('ההודעה נוצרה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      reset();
      onClose();
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה ביצירת ההודעה'));
    },
  });

  const handleClose = () => {
    if (createMessageMutation.isPending) {
      return;
    }

    reset();
    onClose();
  };

  const onSubmit = (values: MessageFormValues) => {
    createMessageMutation.mutate(values);
  };

  return (
    <CreateDialog
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={createMessageMutation.isPending}
      title="הודעה חדשה"
      submitLabel={createMessageMutation.isPending ? 'יוצר...' : 'צור הודעה'}
    >
      <MessageForm control={control} canPin={canPin} />
    </CreateDialog>
  );
};
