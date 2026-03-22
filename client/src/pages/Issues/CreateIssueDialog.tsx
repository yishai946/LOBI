import { issuesService } from '@api/issuesService';
import { CreateDialog } from '@components/dialogs';
import { IssueForm, type IssueFormValues } from './IssueForm';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';

interface CreateIssueDialogProps {
  open: boolean;
  onClose: () => void;
}

const MAX_FILES = 3;

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

export const CreateIssueDialog = ({ open, onClose }: CreateIssueDialogProps) => {
  const { showError, showSuccess } = useGlobalMessage();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<IssueFormValues>({
    defaultValues: {
      title: '',
      description: '',
      isUrgent: false,
      files: [],
    },
  });

  const createIssueMutation = useMutation({
    mutationFn: async (values: IssueFormValues) => {
      const imageKeys = await issuesService.uploadIssueImages(values.files);

      return issuesService.createIssue({
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        isUrgent: values.isUrgent,
        imageKeys,
      });
    },
    onSuccess: () => {
      showSuccess('התקלה נוצרה בהצלחה');
      reset();
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onClose();
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה ביצירת התקלה'));
    },
  });

  const handleClose = () => {
    if (createIssueMutation.isPending) {
      return;
    }

    reset();
    onClose();
  };

  const onSubmit = (values: IssueFormValues) => {
    createIssueMutation.mutate(values);
  };

  return (
    <CreateDialog
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={createIssueMutation.isPending}
      title="דיווח תקלה חדשה"
      submitLabel={createIssueMutation.isPending ? 'יוצר תקלה...' : 'צור תקלה'}
    >
      <IssueForm
        control={control}
        isSubmitting={createIssueMutation.isPending}
        maxFiles={MAX_FILES}
        onMaxFilesExceeded={(maxFiles) => showError(`ניתן להעלות עד ${maxFiles} תמונות בלבד`)}
      />
    </CreateDialog>
  );
};
