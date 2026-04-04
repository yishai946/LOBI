import { Card, Row } from '@components/containers';
import { ConfirmationDialog, EditDialog } from '@components/dialogs';
import { MessageForm, type MessageFormValues } from '@pages/Messages/MessageForm';
import { Message as MessageType } from '@entities/Message';
import { ContextType } from '@enums/ContextType';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import { Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { useAuth } from '@providers/AuthContext';
import { useGlobalMessage } from '@providers/MessageProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { messageService } from '@api/messageService';
import { getTimePassedMessage } from '@utils/funcs';
import { getErrorMessage } from '@utils/errorHandling';

interface MessageProps {
  item: MessageType;
}

export const MessageCard = ({ item }: MessageProps) => {
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useGlobalMessage();
  const { currentContext, user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isManager = currentContext?.type === ContextType.MANAGER;
  const isResident = currentContext?.type === ContextType.RESIDENT;
  const isOwner = item.createdById === user?.id;
  const canEdit = isManager || (isResident && isOwner);

  const { control, handleSubmit, reset } = useForm<MessageFormValues>({
    defaultValues: {
      title: item.title,
      content: item.content,
      isUrgent: item.isUrgent,
      isPinned: item.isPinned,
    },
  });

  useEffect(() => {
    if (isEditDialogOpen) {
      reset({
        title: item.title,
        content: item.content,
        isUrgent: item.isUrgent,
        isPinned: item.isPinned,
      });
    }
  }, [isEditDialogOpen, item.title, item.content, item.isUrgent, item.isPinned, reset]);

  const updateMessageMutation = useMutation({
    mutationFn: (values: MessageFormValues) =>
      messageService.updateMessage(item.id, {
        title: values.title.trim(),
        content: values.content.trim(),
        isUrgent: values.isUrgent,
      }),
    onSuccess: () => {
      showSuccess('ההודעה עודכנה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון ההודעה'));
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: () =>
      messageService.updateMessage(item.id, {
        isPinned: !item.isPinned,
      }),
    onSuccess: () => {
      showSuccess(item.isPinned ? 'ההודעה הוסרה מנעוץ' : 'ההודעה ננעצה');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה בעדכון נעיצה'));
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: () => messageService.deleteMessage(item.id),
    onSuccess: () => {
      showSuccess('ההודעה נמחקה בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setIsDeleteDialogOpen(false);
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      showError(getErrorMessage(error, 'שגיאה במחיקת ההודעה'));
    },
  });

  const handleCardClick = () => {
    if (!canEdit) {
      return;
    }

    setIsEditDialogOpen(true);
  };

  const onSubmit = (values: MessageFormValues) => {
    updateMessageMutation.mutate(values);
  };

  return (
    <>
      <Card
        isError={item.isUrgent}
        onClick={canEdit ? handleCardClick : undefined}
        sx={canEdit ? { cursor: 'pointer' } : undefined}
      >
        <Row sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {item.title}
          </Typography>
          <Row sx={{ alignItems: 'center', gap: 1 }}>
            {item.isUrgent && <Chip size="small" color="error" label="דחוף" />}
            {isManager ? (
              <Tooltip title={item.isPinned ? 'הסר נעיצה' : 'נעץ הודעה'}>
                <IconButton
                  size="small"
                  color={item.isPinned ? 'primary' : 'default'}
                  onClick={(event) => {
                    event.stopPropagation();
                    togglePinMutation.mutate();
                  }}
                  disabled={togglePinMutation.isPending}
                  aria-label={item.isPinned ? 'הסרת נעיצה' : 'נעיצת הודעה'}
                >
                  <PushPinRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              item.isPinned && <PushPinRoundedIcon color="primary" fontSize="small" />
            )}
          </Row>
        </Row>
        <Typography variant="body2" color="text.secondary" pb={1}>
          {getTimePassedMessage(item.createdAt)}
        </Typography>
        <Typography variant="body2">{item.content}</Typography>
      </Card>

      <EditDialog
        open={isEditDialogOpen}
        onClose={() => {
          if (updateMessageMutation.isPending || deleteMessageMutation.isPending) {
            return;
          }

          setIsEditDialogOpen(false);
        }}
        onSubmit={handleSubmit(onSubmit)}
        isSubmitting={updateMessageMutation.isPending || deleteMessageMutation.isPending}
        title="עריכת הודעה"
        submitLabel={updateMessageMutation.isPending ? 'שומר...' : 'שמור'}
        leadingActions={
          <IconButton
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={updateMessageMutation.isPending || deleteMessageMutation.isPending}
            aria-label="מחיקת הודעה"
          >
            <DeleteOutlineRoundedIcon />
          </IconButton>
        }
      >
        <MessageForm control={control} canPin={false} />
      </EditDialog>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="מחיקת הודעה"
        message="האם למחוק את ההודעה? פעולה זו אינה ניתנת לביטול."
        onCancel={() => {
          if (deleteMessageMutation.isPending) {
            return;
          }

          setIsDeleteDialogOpen(false);
        }}
        onConfirm={() => deleteMessageMutation.mutate()}
        confirmLabel={deleteMessageMutation.isPending ? 'מוחק...' : 'מחק'}
        cancelLabel="ביטול"
        isConfirming={deleteMessageMutation.isPending}
        confirmColor="error"
      />
    </>
  );
};
