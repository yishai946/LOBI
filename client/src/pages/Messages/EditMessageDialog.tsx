import { messageService } from '@api/messageService';
import { EditDialog } from '@components/dialogs';
import { Message } from '@entities/Message';
import { ContextType } from '@enums/ContextType';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { MessageForm, type MessageFormValues } from './MessageForm';

interface EditMessageDialogProps {
  open: boolean;
  message: Message;
  onClose: () => void;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    return typeof message === 'string' ? message : fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export const EditMessageDialog = ({ open, message, onClose }: EditMessageDialogProps) => {
  const { currentContext } = useAuth();
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();
  const canPin = currentContext?.type === ContextType.MANAGER;

  const { control, handleSubmit, reset } = useForm<MessageFormValues>({
    defaultValues: {
      title: message.title,
      content: message.content,
      isUrgent: message.isUrgent,
      isPinned: message.isPinned,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: message.title,
        content: message.content,
        isUrgent: message.isUrgent,
        isPinned: message.isPinned,
      });
    }
  }, [open, message.title, message.content, message.isUrgent, reset]);

  const editMessageMutation = useMutation({
    mutationFn: (values: MessageFormValues) =>
      messageService.updateMessage(message.id, {
        title: values.title.trim(),
        content: values.content.trim(),
        isUrgent: values.isUrgent,
        isPinned: canPin ? values.isPinned : undefined,
      }),
    onSuccess: () => {
      showSuccess('ההודעה עודכנה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      onClose();
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון ההודעה'));
    },
  });

  const handleClose = () => {
    if (editMessageMutation.isPending) {
      return;
    }

    onClose();
  };

  const onSubmit = (values: MessageFormValues) => {
    editMessageMutation.mutate(values);
  };

  return (
    <EditDialog
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={editMessageMutation.isPending}
      title="עריכת הודעה"
      submitLabel={editMessageMutation.isPending ? 'שומר...' : 'שמור'}
    >
      <MessageForm control={control} canPin={canPin} />
    </EditDialog>
  );
};
