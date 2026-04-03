import { issuesService } from '@api/issuesService';
import { EditDialog } from '@components/dialogs';
import { Issue } from '@entities/Issue';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { IssueForm, type IssueFormValues } from './IssueForm';

interface EditIssueDialogProps {
  open: boolean;
  issue: Issue;
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

export const EditIssueDialog = ({ open, issue, onClose }: EditIssueDialogProps) => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalMessage();

  const { control, handleSubmit, reset } = useForm<IssueFormValues>({
    defaultValues: {
      title: issue.title,
      description: issue.description || '',
      isUrgent: issue.isUrgent,
      files: [],
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: issue.title,
        description: issue.description || '',
        isUrgent: issue.isUrgent,
        files: [],
      });
    }
  }, [open, issue.title, issue.description, issue.isUrgent, reset]);

  const updateIssueMutation = useMutation({
    mutationFn: (values: IssueFormValues) =>
      issuesService.updateIssue(issue.id, {
        title: values.title.trim(),
        description: values.description.trim() || undefined,
        isUrgent: values.isUrgent,
      }),
    onSuccess: () => {
      showSuccess('התקלה עודכנה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      onClose();
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון התקלה'));
    },
  });

  const handleDialogClose = () => {
    if (updateIssueMutation.isPending) {
      return;
    }

    onClose();
  };

  const onSubmit = (values: IssueFormValues) => {
    updateIssueMutation.mutate(values);
  };

  return (
    <EditDialog
      open={open}
      onClose={handleDialogClose}
      onSubmit={handleSubmit(onSubmit)}
      isSubmitting={updateIssueMutation.isPending}
      title="עריכת תקלה"
      submitLabel={updateIssueMutation.isPending ? 'שומר...' : 'שמור'}
    >
      <IssueForm
        control={control}
        isSubmitting={updateIssueMutation.isPending}
        showImageUpload={false}
      />
    </EditDialog>
  );
};
